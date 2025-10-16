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
    }

    /// Service configuration for different networks
    public struct ServiceConfig has store {
        network_code: String,
        service_id: String,
        commission_rate: u64, // in basis points (100 = 1%)
    }

    /// Transaction record
    public struct TransactionRecord has store {
        id: String,
        user_address: address,
        service_type: String,
        network: String,
        phone_number: String,
        amount: u64,
        status: String,
        timestamp: u64,
        clubkonnect_response: String,
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
        admin_cap: &AdminCap,
        user_id: String,
        api_key: String,
        api_url: String,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        // Authorization via possession of AdminCap
        contract.clubkonnect_user_id = user_id;
        contract.clubkonnect_api_key = api_key;
        contract.clubkonnect_api_url = api_url;

        event::emit(AdminAction {
            admin: tx_context::sender(ctx),
            action: string::utf8(b"credentials_updated"),
            timestamp: clock::timestamp_ms(clock),
        });
    }

    /// Add treasury funds (admin only)
    public entry fun add_treasury_funds(
        contract: &mut BillPaymentContract,
        admin_cap: &AdminCap,
        payment: Coin<SUI>,
        ctx: &mut TxContext
    ) {
        // Authorization via possession of AdminCap
        let amount = coin::value(&payment);
        contract.treasury_balance = contract.treasury_balance + amount;
        
        // Transfer the coin to the admin (treasury)
        transfer::public_transfer(payment, contract.admin);
    }

    /// Update admin address (admin only)
    public entry fun set_admin(
        contract: &mut BillPaymentContract,
        admin_cap: &AdminCap,
        new_admin: address,
        ctx: &mut TxContext
    ) {
        // Authorization via possession of AdminCap
        // Update admin recipient for treasury transfers
        contract.admin = new_admin;
    }

    /// Withdraw treasury funds (admin only)
    public entry fun withdraw_treasury_funds(
        contract: &mut BillPaymentContract,
        admin_cap: &AdminCap,
        amount: u64,
        ctx: &mut TxContext
    ) {
        // Authorization via possession of AdminCap
        assert!(contract.treasury_balance >= amount, EInsufficientBalance);
        
        contract.treasury_balance = contract.treasury_balance - amount;
        
        // For now, just update the balance. In a real implementation, 
        // you would need to handle coin transfers properly
        // This is a simplified version for demonstration
    }

    // ===== SERVICE PURCHASE FUNCTIONS =====
    
    /// Purchase airtime
    public entry fun purchase_airtime<T>(
        contract: &mut BillPaymentContract,
        payment: Coin<T>,
        network: String,
        phone_number: String,
        amount: u64,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        // Validate inputs
        assert!(amount > 0, EInvalidAmount);
        assert!(string::length(&phone_number) >= 10, EInvalidPhoneNumber);
        assert!(string::length(&network) > 0, EInvalidNetwork);
        
        // Validate ClubKonnect credentials
        assert!(string::length(&contract.clubkonnect_user_id) > 0, EInvalidCredentials);
        assert!(string::length(&contract.clubkonnect_api_key) > 0, EInvalidCredentials);

        let user_address = tx_context::sender(ctx);
        let payment_amount = coin::value(&payment);
        
        // Add payment to treasury
        contract.treasury_balance = contract.treasury_balance + payment_amount;
        
        // Transfer the coin to the admin (treasury)
        transfer::public_transfer(payment, contract.admin);

        // Generate transaction ID
        let transaction_id = generate_transaction_id(user_address, clock::timestamp_ms(clock));
        
        // Call ClubKonnect API
        let (success, _response) = call_clubkonnect_airtime(
            &contract.clubkonnect_user_id,
            &contract.clubkonnect_api_key,
            &contract.clubkonnect_api_url,
            &network,
            &phone_number,
            amount
        );

        // Update contract stats
        contract.total_transactions = contract.total_transactions + 1;
        contract.total_volume = contract.total_volume + payment_amount;

        // Emit event
        event::emit(ServicePurchased {
            user_address,
            service_type: string::utf8(b"airtime"),
            network,
            phone_number,
            amount: payment_amount,
            transaction_id,
            status: if (success) string::utf8(b"success") else string::utf8(b"failed"),
        });
    }

    /// Purchase data bundle
    public entry fun purchase_data<T>(
        contract: &mut BillPaymentContract,
        payment: Coin<T>,
        network: String,
        phone_number: String,
        data_plan: String,
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
        
        // Add payment to treasury
        contract.treasury_balance = contract.treasury_balance + payment_amount;
        
        // Transfer the coin to the admin (treasury)
        transfer::public_transfer(payment, contract.admin);

        // Generate transaction ID
        let transaction_id = generate_transaction_id(user_address, clock::timestamp_ms(clock));
        
        // Call ClubKonnect API
        let (success, _response) = call_clubkonnect_data(
            &contract.clubkonnect_user_id,
            &contract.clubkonnect_api_key,
            &contract.clubkonnect_api_url,
            &network,
            &phone_number,
            &data_plan
        );

        // Update contract stats
        contract.total_transactions = contract.total_transactions + 1;
        contract.total_volume = contract.total_volume + payment_amount;

        // Emit event
        event::emit(ServicePurchased {
            user_address,
            service_type: string::utf8(b"data"),
            network,
            phone_number,
            amount: payment_amount,
            transaction_id,
            status: if (success) string::utf8(b"success") else string::utf8(b"failed"),
        });
    }

    /// Purchase electricity
    public entry fun purchase_electricity<T>(
        contract: &mut BillPaymentContract,
        payment: Coin<T>,
        disco: String,
        meter_number: String,
        amount: u64,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        // Validate inputs
        assert!(amount > 0, EInvalidAmount);
        assert!(string::length(&meter_number) >= 10, EInvalidPhoneNumber);
        assert!(string::length(&disco) > 0, EInvalidNetwork);
        
        // Validate ClubKonnect credentials
        assert!(string::length(&contract.clubkonnect_user_id) > 0, EInvalidCredentials);
        assert!(string::length(&contract.clubkonnect_api_key) > 0, EInvalidCredentials);

        let user_address = tx_context::sender(ctx);
        let payment_amount = coin::value(&payment);
        
        // Add payment to treasury
        contract.treasury_balance = contract.treasury_balance + payment_amount;
        
        // Transfer the coin to the admin (treasury)
        transfer::public_transfer(payment, contract.admin);

        // Generate transaction ID
        let transaction_id = generate_transaction_id(user_address, clock::timestamp_ms(clock));
        
        // Call ClubKonnect API
        let (success, _response) = call_clubkonnect_electricity(
            &contract.clubkonnect_user_id,
            &contract.clubkonnect_api_key,
            &contract.clubkonnect_api_url,
            &disco,
            &meter_number,
            amount
        );

        // Update contract stats
        contract.total_transactions = contract.total_transactions + 1;
        contract.total_volume = contract.total_volume + payment_amount;

        // Emit event
        event::emit(ServicePurchased {
            user_address,
            service_type: string::utf8(b"electricity"),
            network: disco,
            phone_number: meter_number,
            amount: payment_amount,
            transaction_id,
            status: if (success) string::utf8(b"success") else string::utf8(b"failed"),
        });
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

    /// Call ClubKonnect API for airtime
    fun call_clubkonnect_airtime(
        user_id: &String,
        api_key: &String,
        api_url: &String,
        network: &String,
        phone_number: &String,
        amount: u64
    ): (bool, String) {
        // This would make an HTTP request to ClubKonnect API
        // For now, we'll simulate the response
        // In a real implementation, you'd use sui::http to make the API call
        
        // Simulate API call
        let response = string::utf8(b"{\"status\":\"success\",\"orderid\":\"12345\"}");
        (true, response)
    }

    /// Call ClubKonnect API for data
    fun call_clubkonnect_data(
        user_id: &String,
        api_key: &String,
        api_url: &String,
        network: &String,
        phone_number: &String,
        data_plan: &String
    ): (bool, String) {
        // Simulate API call
        let response = string::utf8(b"{\"status\":\"success\",\"orderid\":\"12346\"}");
        (true, response)
    }

    /// Call ClubKonnect API for electricity
    fun call_clubkonnect_electricity(
        user_id: &String,
        api_key: &String,
        api_url: &String,
        disco: &String,
        meter_number: &String,
        amount: u64
    ): (bool, String) {
        // Simulate API call
        let response = string::utf8(b"{\"status\":\"success\",\"orderid\":\"12347\"}");
        (true, response)
    }

    // ===== VIEW FUNCTIONS =====
    
    /// Get contract info
    public fun get_contract_info(contract: &BillPaymentContract): (address, u64, u64, u64) {
        (
            contract.admin,
            contract.treasury_balance,
            contract.total_transactions,
            contract.total_volume
        )
    }

    /// Check if credentials are set
    public fun has_credentials(contract: &BillPaymentContract): bool {
        string::length(&contract.clubkonnect_user_id) > 0 && 
        string::length(&contract.clubkonnect_api_key) > 0
    }
}
