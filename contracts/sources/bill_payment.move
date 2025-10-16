module bill_payment::bill_payment {
    use std::string::{Self, String};
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::clock::{Self, Clock};
    use sui::event;
    use sui::hex;
    use sui::bcs;
    use sui::table::{Self, Table};
    use sui::balance::{Self, Balance};

    // ===== CONSTANTS =====
    const EInvalidAmount: u64 = 0;
    const EInvalidPhoneNumber: u64 = 1;
    const EInvalidNetwork: u64 = 2;
    const EInvalidServiceType: u64 = 3;
    const EInsufficientBalance: u64 = 4;
    const EClubKonnectError: u64 = 5;
    const EUnauthorized: u64 = 6;
    const EInvalidCredentials: u64 = 7;
    const EUnsupportedToken: u64 = 8;
    const EPendingPaymentNotFound: u64 = 9;
    const EPaymentAlreadyProcessed: u64 = 10;
    const EPaymentExpired: u64 = 11;
    const EInvalidStatus: u64 = 12;

    // Payment expiry time: 30 minutes (in milliseconds)
    const PAYMENT_EXPIRY_MS: u64 = 1800000;

    // ===== STRUCTS =====
    
    /// Main bill payment contract
    public struct BillPaymentContract has key {
        id: UID,
        admin: address,
        clubkonnect_user_id: String,
        clubkonnect_api_key: String,
        clubkonnect_api_url: String,
        treasury_balance: u64,
        total_transactions: u64,
        total_volume: u64,
        total_refunds: u64,
        pending_payments: Table<String, UID>, // Maps transaction_id to PendingPayment object ID
    }

    /// Pending payment stored in escrow
    public struct PendingPayment<phantom T> has key, store {
        id: UID,
        user_address: address,
        payment_balance: Balance<T>, // Hold the actual coins in balance
        service_type: String,
        network: String,
        phone_number: String,
        amount_naira: u64, // Amount in Naira (for reference)
        amount_token: u64, // Amount in token smallest unit
        transaction_id: String,
        timestamp: u64,
        expires_at: u64,
        status: String, // "pending", "confirmed", "refunded", "expired"
    }

    /// Admin capabilities
    public struct AdminCap has key {
        id: UID,
    }

    /// Upgrade capability
    public struct UpgradeCap has key {
        id: UID,
    }

    // ===== EVENTS =====
    
    public struct PaymentPending has copy, drop {
        transaction_id: String,
        user_address: address,
        service_type: String,
        network: String,
        phone_number: String,
        amount_token: u64,
        amount_naira: u64,
        timestamp: u64,
        expires_at: u64,
    }

    public struct PaymentConfirmed has copy, drop {
        transaction_id: String,
        user_address: address,
        service_type: String,
        amount_token: u64,
        confirmed_by: address,
        timestamp: u64,
    }

    public struct PaymentRefunded has copy, drop {
        transaction_id: String,
        user_address: address,
        service_type: String,
        amount_token: u64,
        refunded_by: address,
        reason: String,
        timestamp: u64,
    }

    public struct ServicePurchased has copy, drop {
        user_address: address,
        service_type: String,
        network: String,
        phone_number: String,
        amount: u64,
        transaction_id: String,
        status: String,
    }

    public struct AdminAction has copy, drop {
        admin: address,
        action: String,
        timestamp: u64,
    }

    // ===== INITIALIZATION =====
    
    fun init(ctx: &mut TxContext) {
        let admin = tx_context::sender(ctx);
        
        let contract = BillPaymentContract {
            id: object::new(ctx),
            admin,
            clubkonnect_user_id: string::utf8(b""),
            clubkonnect_api_key: string::utf8(b""),
            clubkonnect_api_url: string::utf8(b"https://www.nellobytesystems.com"),
            treasury_balance: 0,
            total_transactions: 0,
            total_volume: 0,
            total_refunds: 0,
            pending_payments: table::new(ctx),
        };

        // Create admin capability
        let admin_cap = AdminCap {
            id: object::new(ctx),
        };

        // Create upgrade capability
        let upgrade_cap = UpgradeCap {
            id: object::new(ctx),
        };

        // Transfer capabilities to admin and make contract shared
        transfer::share_object(contract);
        transfer::transfer(admin_cap, admin);
        transfer::transfer(upgrade_cap, admin);
    }

    // ===== ADMIN FUNCTIONS =====
    
    /// Set ClubKonnect credentials (admin only)
    public entry fun set_clubkonnect_credentials(
        contract: &mut BillPaymentContract,
        _admin_cap: &AdminCap,
        user_id: String,
        api_key: String,
        api_url: String,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        contract.clubkonnect_user_id = user_id;
        contract.clubkonnect_api_key = api_key;
        contract.clubkonnect_api_url = api_url;

        event::emit(AdminAction {
            admin: tx_context::sender(ctx),
            action: string::utf8(b"credentials_updated"),
            timestamp: clock::timestamp_ms(clock),
        });
    }

    /// Update admin address (admin only)
    public entry fun set_admin(
        contract: &mut BillPaymentContract,
        _admin_cap: &AdminCap,
        new_admin: address,
        _ctx: &mut TxContext
    ) {
        contract.admin = new_admin;
    }

    // ===== ESCROW PAYMENT FUNCTIONS =====
    
    /// Purchase airtime - Step 1: Create pending payment in escrow
    public entry fun purchase_airtime<T>(
        contract: &mut BillPaymentContract,
        payment: Coin<T>,
        network: String,
        phone_number: String,
        amount_naira: u64,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        // Validate inputs
        assert!(amount_naira > 0, EInvalidAmount);
        assert!(string::length(&phone_number) >= 10, EInvalidPhoneNumber);
        assert!(string::length(&network) > 0, EInvalidNetwork);
        
        // Validate ClubKonnect credentials
        assert!(string::length(&contract.clubkonnect_user_id) > 0, EInvalidCredentials);
        assert!(string::length(&contract.clubkonnect_api_key) > 0, EInvalidCredentials);

        let user_address = tx_context::sender(ctx);
        let payment_amount = coin::value(&payment);
        let current_time = clock::timestamp_ms(clock);
        
        // Generate unique transaction ID
        let transaction_id = generate_transaction_id(user_address, current_time);
        
        // Convert coin to balance for storage
        let payment_balance = coin::into_balance(payment);
        
        // Create pending payment object
        let pending_payment = PendingPayment<T> {
            id: object::new(ctx),
            user_address,
            payment_balance,
            service_type: string::utf8(b"airtime"),
            network,
            phone_number,
            amount_naira,
            amount_token: payment_amount,
            transaction_id,
            timestamp: current_time,
            expires_at: current_time + PAYMENT_EXPIRY_MS,
            status: string::utf8(b"pending"),
        };

        // Get the object ID of the pending payment
        let pending_payment_id = object::id(&pending_payment);
        
        // Store mapping of transaction_id to pending payment object ID
        table::add(&mut contract.pending_payments, transaction_id, pending_payment_id);
        
        // Share the pending payment object so it can be accessed later
        transfer::share_object(pending_payment);

        // Update contract stats
        contract.total_transactions = contract.total_transactions + 1;

        // Emit event for backend to process
        event::emit(PaymentPending {
            transaction_id,
            user_address,
            service_type: string::utf8(b"airtime"),
            network,
            phone_number,
            amount_token: payment_amount,
            amount_naira,
            timestamp: current_time,
            expires_at: current_time + PAYMENT_EXPIRY_MS,
        });
    }

    /// Purchase data bundle - Step 1: Create pending payment in escrow
    public entry fun purchase_data<T>(
        contract: &mut BillPaymentContract,
        payment: Coin<T>,
        network: String,
        phone_number: String,
        data_plan: String,
        amount_naira: u64,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        // Validate inputs
        assert!(string::length(&phone_number) >= 10, EInvalidPhoneNumber);
        assert!(string::length(&network) > 0, EInvalidNetwork);
        assert!(string::length(&data_plan) > 0, EInvalidAmount);
        
        // Validate ClubKonnect credentials
        assert!(string::length(&contract.clubkonnect_user_id) > 0, EInvalidCredentials);
        assert!(string::length(&contract.clubkonnect_api_key) > 0, EInvalidCredentials);

        let user_address = tx_context::sender(ctx);
        let payment_amount = coin::value(&payment);
        let current_time = clock::timestamp_ms(clock);
        
        let transaction_id = generate_transaction_id(user_address, current_time);
        let payment_balance = coin::into_balance(payment);
        
        let pending_payment = PendingPayment<T> {
            id: object::new(ctx),
            user_address,
            payment_balance,
            service_type: string::utf8(b"data"),
            network,
            phone_number: data_plan, // Store data_plan in phone_number field
            amount_naira,
            amount_token: payment_amount,
            transaction_id,
            timestamp: current_time,
            expires_at: current_time + PAYMENT_EXPIRY_MS,
            status: string::utf8(b"pending"),
        };

        let pending_payment_id = object::id(&pending_payment);
        table::add(&mut contract.pending_payments, transaction_id, pending_payment_id);
        transfer::share_object(pending_payment);

        contract.total_transactions = contract.total_transactions + 1;

        event::emit(PaymentPending {
            transaction_id,
            user_address,
            service_type: string::utf8(b"data"),
            network,
            phone_number: data_plan,
            amount_token: payment_amount,
            amount_naira,
            timestamp: current_time,
            expires_at: current_time + PAYMENT_EXPIRY_MS,
        });
    }

    /// Purchase electricity - Step 1: Create pending payment in escrow
    public entry fun purchase_electricity<T>(
        contract: &mut BillPaymentContract,
        payment: Coin<T>,
        disco: String,
        meter_number: String,
        amount_naira: u64,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        // Validate inputs
        assert!(amount_naira > 0, EInvalidAmount);
        assert!(string::length(&meter_number) >= 10, EInvalidPhoneNumber);
        assert!(string::length(&disco) > 0, EInvalidNetwork);
        
        // Validate ClubKonnect credentials
        assert!(string::length(&contract.clubkonnect_user_id) > 0, EInvalidCredentials);
        assert!(string::length(&contract.clubkonnect_api_key) > 0, EInvalidCredentials);

        let user_address = tx_context::sender(ctx);
        let payment_amount = coin::value(&payment);
        let current_time = clock::timestamp_ms(clock);
        
        let transaction_id = generate_transaction_id(user_address, current_time);
        let payment_balance = coin::into_balance(payment);
        
        let pending_payment = PendingPayment<T> {
            id: object::new(ctx),
            user_address,
            payment_balance,
            service_type: string::utf8(b"electricity"),
            network: disco,
            phone_number: meter_number,
            amount_naira,
            amount_token: payment_amount,
            transaction_id,
            timestamp: current_time,
            expires_at: current_time + PAYMENT_EXPIRY_MS,
            status: string::utf8(b"pending"),
        };

        let pending_payment_id = object::id(&pending_payment);
        table::add(&mut contract.pending_payments, transaction_id, pending_payment_id);
        transfer::share_object(pending_payment);

        contract.total_transactions = contract.total_transactions + 1;

        event::emit(PaymentPending {
            transaction_id,
            user_address,
            service_type: string::utf8(b"electricity"),
            network: disco,
            phone_number: meter_number,
            amount_token: payment_amount,
            amount_naira,
            timestamp: current_time,
            expires_at: current_time + PAYMENT_EXPIRY_MS,
        });
    }

    /// Step 2: Confirm payment and release funds to admin (admin only)
    public entry fun confirm_payment<T>(
        contract: &mut BillPaymentContract,
        _admin_cap: &AdminCap,
        pending_payment: &mut PendingPayment<T>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let current_time = clock::timestamp_ms(clock);
        
        // Verify payment hasn't expired
        assert!(current_time <= pending_payment.expires_at, EPaymentExpired);
        
        // Verify payment is still pending
        assert!(pending_payment.status == string::utf8(b"pending"), EPaymentAlreadyProcessed);
        
        // Update status
        pending_payment.status = string::utf8(b"confirmed");
        
        // Extract the balance and convert to coin
        let payment_amount = balance::value(&pending_payment.payment_balance);
        let payment_coin = coin::from_balance(
            balance::withdraw_all(&mut pending_payment.payment_balance),
            ctx
        );
        
        // Transfer to admin treasury
        transfer::public_transfer(payment_coin, contract.admin);
        
        // Update contract stats
        contract.treasury_balance = contract.treasury_balance + payment_amount;
        contract.total_volume = contract.total_volume + payment_amount;
        
        // Emit confirmation event
        event::emit(PaymentConfirmed {
            transaction_id: pending_payment.transaction_id,
            user_address: pending_payment.user_address,
            service_type: pending_payment.service_type,
            amount_token: payment_amount,
            confirmed_by: tx_context::sender(ctx),
            timestamp: current_time,
        });
    }

    /// Step 2 Alternative: Refund payment to user (admin only)
    public entry fun refund_payment<T>(
        contract: &mut BillPaymentContract,
        _admin_cap: &AdminCap,
        pending_payment: &mut PendingPayment<T>,
        reason: String,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let current_time = clock::timestamp_ms(clock);
        
        // Verify payment hasn't been processed
        assert!(
            pending_payment.status == string::utf8(b"pending") || 
            current_time > pending_payment.expires_at,
            EPaymentAlreadyProcessed
        );
        
        // Update status
        pending_payment.status = string::utf8(b"refunded");
        
        // Extract the balance and convert to coin
        let payment_amount = balance::value(&pending_payment.payment_balance);
        let refund_coin = coin::from_balance(
            balance::withdraw_all(&mut pending_payment.payment_balance),
            ctx
        );
        
        // Refund to original user
        transfer::public_transfer(refund_coin, pending_payment.user_address);
        
        // Update contract stats
        contract.total_refunds = contract.total_refunds + payment_amount;
        
        // Emit refund event
        event::emit(PaymentRefunded {
            transaction_id: pending_payment.transaction_id,
            user_address: pending_payment.user_address,
            service_type: pending_payment.service_type,
            amount_token: payment_amount,
            refunded_by: tx_context::sender(ctx),
            reason,
            timestamp: current_time,
        });
    }

    /// Claim expired payment (admin only - for cleanup)
    public entry fun claim_expired_payment<T>(
        contract: &mut BillPaymentContract,
        _admin_cap: &AdminCap,
        pending_payment: &mut PendingPayment<T>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let current_time = clock::timestamp_ms(clock);
        
        // Verify payment has expired
        assert!(current_time > pending_payment.expires_at, EInvalidStatus);
        
        // Verify payment is still pending
        assert!(pending_payment.status == string::utf8(b"pending"), EPaymentAlreadyProcessed);
        
        // Refund to user (expired payments are refunded, not claimed by admin)
        refund_payment(
            contract,
            _admin_cap,
            pending_payment,
            string::utf8(b"Payment expired - automatic refund"),
            clock,
            ctx
        );
    }

    // ===== HELPER FUNCTIONS =====
    
    /// Generate unique transaction ID
    fun generate_transaction_id(user_address: address, timestamp: u64): String {
        let id_bytes = bcs::to_bytes(&user_address);
        let timestamp_bytes = bcs::to_bytes(&timestamp);
        
        let mut combined = vector::empty<u8>();
        vector::append(&mut combined, id_bytes);
        vector::append(&mut combined, timestamp_bytes);
        
        let hex_string = hex::encode(combined);
        string::utf8(hex_string)
    }

    // ===== VIEW FUNCTIONS =====
    
    /// Get contract info
    public fun get_contract_info(contract: &BillPaymentContract): (address, u64, u64, u64, u64) {
        (
            contract.admin,
            contract.treasury_balance,
            contract.total_transactions,
            contract.total_volume,
            contract.total_refunds
        )
    }

    /// Check if credentials are set
    public fun has_credentials(contract: &BillPaymentContract): bool {
        string::length(&contract.clubkonnect_user_id) > 0 && 
        string::length(&contract.clubkonnect_api_key) > 0
    }

    /// Get pending payment status
    public fun get_pending_payment_status<T>(pending_payment: &PendingPayment<T>): (String, u64, u64, bool) {
        let is_expired = false; // Would need clock to check properly
        (
            pending_payment.status,
            pending_payment.amount_token,
            pending_payment.expires_at,
            is_expired
        )
    }
}

