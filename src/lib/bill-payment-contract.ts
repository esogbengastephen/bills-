import { Transaction } from '@mysten/sui/transactions'
import { SuiClient } from '@mysten/sui/client'
import { normalizeSuiAddress } from '@mysten/sui/utils'

export interface ContractConfig {
  packageId: string
  contractId: string
  adminCapId: string
  upgradeCapId: string
}

export interface ServiceParams {
  network: string
  phoneNumber: string
  amount?: number
  dataPlan?: string
  meterNumber?: string
  disco?: string
}

export class BillPaymentContract {
  private client: SuiClient
  private config: ContractConfig

  constructor(client: SuiClient, config: ContractConfig) {
    this.client = client
    this.config = config
  }

  /**
   * Purchase airtime using the smart contract
   */
  async purchaseAirtime(
    amountInSmallestUnit: number,
    params: ServiceParams,
    signAndExecute: (tx: Transaction) => Promise<any>
  ): Promise<{ success: boolean; txDigest: string; error?: string }> {
    try {
      const tx = new Transaction()
      const [paymentCoin] = tx.splitCoins(tx.gas, [amountInSmallestUnit])
      
      // Call the smart contract function with type parameter
      tx.moveCall({
        target: `${this.config.packageId}::bill_payment::purchase_airtime`,
        typeArguments: ['0x2::sui::SUI'], // Specify SUI coin type
        arguments: [
          tx.object(this.config.contractId),
          paymentCoin,
          tx.pure.string(params.network),
          tx.pure.string(params.phoneNumber),
          tx.pure.u64(params.amount || 0),
          tx.object('0x6'), // Clock object
        ],
      })

      const result = await signAndExecute(tx)
      
      return {
        success: true,
        txDigest: result.digest
      }
    } catch (error: any) {
      return {
        success: false,
        txDigest: '',
        error: error.message || 'Transaction failed'
      }
    }
  }

  /**
   * Purchase data bundle using the smart contract
   */
  async purchaseData(
    amountInSmallestUnit: number,
    params: ServiceParams,
    signAndExecute: (tx: Transaction) => Promise<any>
  ): Promise<{ success: boolean; txDigest: string; error?: string }> {
    try {
      const tx = new Transaction()
      const [paymentCoin] = tx.splitCoins(tx.gas, [amountInSmallestUnit])
      
      // Call the smart contract function with type parameter
      tx.moveCall({
        target: `${this.config.packageId}::bill_payment::purchase_data`,
        typeArguments: ['0x2::sui::SUI'], // Specify SUI coin type
        arguments: [
          tx.object(this.config.contractId),
          paymentCoin,
          tx.pure.string(params.network),
          tx.pure.string(params.phoneNumber),
          tx.pure.string(params.dataPlan || ''),
          tx.object('0x6'), // Clock object
        ],
      })

      const result = await signAndExecute(tx)
      
      return {
        success: true,
        txDigest: result.digest
      }
    } catch (error: any) {
      return {
        success: false,
        txDigest: '',
        error: error.message || 'Transaction failed'
      }
    }
  }

  /**
   * Purchase electricity using the smart contract
   */
  async purchaseElectricity(
    amountInSmallestUnit: number,
    params: ServiceParams,
    signAndExecute: (tx: Transaction) => Promise<any>
  ): Promise<{ success: boolean; txDigest: string; error?: string }> {
    try {
      const tx = new Transaction()
      const [paymentCoin] = tx.splitCoins(tx.gas, [amountInSmallestUnit])
      
      // Call the smart contract function with type parameter
      tx.moveCall({
        target: `${this.config.packageId}::bill_payment::purchase_electricity`,
        typeArguments: ['0x2::sui::SUI'], // Specify SUI coin type
        arguments: [
          tx.object(this.config.contractId),
          paymentCoin,
          tx.pure.string(params.disco || ''),
          tx.pure.string(params.meterNumber || ''),
          tx.pure.u64(params.amount || 0),
          tx.object('0x6'), // Clock object
        ],
      })

      const result = await signAndExecute(tx)
      
      return {
        success: true,
        txDigest: result.digest
      }
    } catch (error: any) {
      return {
        success: false,
        txDigest: '',
        error: error.message || 'Transaction failed'
      }
    }
  }

  /**
   * Get contract information
   */
  async getContractInfo(): Promise<{
    admin: string
    treasuryBalance: number
    totalTransactions: number
    totalVolume: number
  }> {
    try {
      const tx = new Transaction()
      tx.moveCall({
        target: `${this.config.packageId}::bill_payment::get_contract_info`,
        arguments: [tx.object(this.config.contractId)],
      })

      const result = await this.client.devInspectTransactionBlock({
        transactionBlock: tx,
        sender: '0x0000000000000000000000000000000000000000000000000000000000000000',
      })

      const returnValues = result.results?.[0]?.returnValues
      if (!returnValues || returnValues.length < 4) {
        throw new Error('Invalid contract info response')
      }

      return {
        admin: normalizeSuiAddress(Buffer.from(returnValues[0][0]).toString('hex')),
        treasuryBalance: Number(Buffer.from(returnValues[1][0]).toString('hex')),
        totalTransactions: Number(Buffer.from(returnValues[2][0]).toString('hex')),
        totalVolume: Number(Buffer.from(returnValues[3][0]).toString('hex')),
      }
    } catch (error) {
      console.error('Error fetching contract info:', error)
      throw error
    }
  }

  /**
   * Check if contract has ClubKonnect credentials set
   */
  async hasCredentials(): Promise<boolean> {
    try {
      const contractObject = await this.client.getObject({
        id: this.config.contractId,
        options: {
          showContent: true,
          showType: true,
        },
      })

      if (!contractObject.data?.content || contractObject.data.content.dataType !== 'moveObject') {
        return false
      }

      const fields = (contractObject.data.content as any).fields
      const hasUserId = fields.clubkonnect_user_id && fields.clubkonnect_user_id.length > 0
      const hasApiKey = fields.clubkonnect_api_key && fields.clubkonnect_api_key.length > 0
      const hasApiUrl = fields.clubkonnect_api_url && fields.clubkonnect_api_url.length > 0

      return hasUserId && hasApiKey && hasApiUrl
    } catch (error) {
      console.error('Error checking credentials:', error)
      return false
    }
  }

  /**
   * Set ClubKonnect credentials (admin only)
   */
  async setCredentials(
    userId: string,
    apiKey: string,
    apiUrl: string,
    signAndExecute: (tx: Transaction) => Promise<any>
  ): Promise<{ success: boolean; txDigest: string; error?: string }> {
    try {
      const tx = new Transaction()
      
      tx.moveCall({
        target: `${this.config.packageId}::bill_payment::set_clubkonnect_credentials`,
        arguments: [
          tx.object(this.config.contractId),
          tx.object(this.config.adminCapId),
          tx.pure.string(userId),
          tx.pure.string(apiKey),
          tx.pure.string(apiUrl),
        ],
      })

      const result = await signAndExecute(tx)
      
      return {
        success: true,
        txDigest: result.digest
      }
    } catch (error: any) {
      return {
        success: false,
        txDigest: '',
        error: error.message || 'Failed to set credentials'
      }
    }
  }

  /**
   * Add treasury funds (admin only)
   */
  async addTreasuryFunds(
    coinId: string,
    signAndExecute: (tx: Transaction) => Promise<any>
  ): Promise<{ success: boolean; txDigest: string; error?: string }> {
    try {
      const tx = new Transaction()
      
      tx.moveCall({
        target: `${this.config.packageId}::bill_payment::add_treasury_funds`,
        arguments: [
          tx.object(this.config.contractId),
          tx.object(this.config.adminCapId),
          tx.object(coinId),
        ],
      })

      const result = await signAndExecute(tx)
      
      return {
        success: true,
        txDigest: result.digest
      }
    } catch (error: any) {
      return {
        success: false,
        txDigest: '',
        error: error.message || 'Failed to add treasury funds'
      }
    }
  }

  /**
   * Confirm payment and release funds to admin (admin only)
   * Called after ClubKonnect confirms successful service delivery
   */
  async confirmPayment(
    pendingPaymentId: string,
    coinType: string,
    signAndExecute: (tx: Transaction) => Promise<any>
  ): Promise<{ success: boolean; txDigest: string; error?: string }> {
    try {
      const tx = new Transaction()
      
      tx.moveCall({
        target: `${this.config.packageId}::bill_payment::confirm_payment`,
        typeArguments: [coinType], // e.g., '0x2::sui::SUI'
        arguments: [
          tx.object(this.config.contractId),
          tx.object(this.config.adminCapId),
          tx.object(pendingPaymentId),
          tx.object('0x6'), // Clock object
        ],
      })

      const result = await signAndExecute(tx)
      
      return {
        success: true,
        txDigest: result.digest
      }
    } catch (error: any) {
      console.error('Error confirming payment:', error)
      return {
        success: false,
        txDigest: '',
        error: error.message || 'Failed to confirm payment'
      }
    }
  }

  /**
   * Refund payment to user (admin only)
   * Called when ClubKonnect service delivery fails
   */
  async refundPayment(
    pendingPaymentId: string,
    coinType: string,
    reason: string,
    signAndExecute: (tx: Transaction) => Promise<any>
  ): Promise<{ success: boolean; txDigest: string; error?: string }> {
    try {
      const tx = new Transaction()
      
      tx.moveCall({
        target: `${this.config.packageId}::bill_payment::refund_payment`,
        typeArguments: [coinType], // e.g., '0x2::sui::SUI'
        arguments: [
          tx.object(this.config.contractId),
          tx.object(this.config.adminCapId),
          tx.object(pendingPaymentId),
          tx.pure.string(reason),
          tx.object('0x6'), // Clock object
        ],
      })

      const result = await signAndExecute(tx)
      
      return {
        success: true,
        txDigest: result.digest
      }
    } catch (error: any) {
      console.error('Error refunding payment:', error)
      return {
        success: false,
        txDigest: '',
        error: error.message || 'Failed to refund payment'
      }
    }
  }

  /**
   * Claim expired payment (admin only)
   * Automatically refunds expired pending payments
   */
  async claimExpiredPayment(
    pendingPaymentId: string,
    coinType: string,
    signAndExecute: (tx: Transaction) => Promise<any>
  ): Promise<{ success: boolean; txDigest: string; error?: string }> {
    try {
      const tx = new Transaction()
      
      tx.moveCall({
        target: `${this.config.packageId}::bill_payment::claim_expired_payment`,
        typeArguments: [coinType],
        arguments: [
          tx.object(this.config.contractId),
          tx.object(this.config.adminCapId),
          tx.object(pendingPaymentId),
          tx.object('0x6'), // Clock object
        ],
      })

      const result = await signAndExecute(tx)
      
      return {
        success: true,
        txDigest: result.digest
      }
    } catch (error: any) {
      console.error('Error claiming expired payment:', error)
      return {
        success: false,
        txDigest: '',
        error: error.message || 'Failed to claim expired payment'
      }
    }
  }

  /**
   * Get pending payment status
   */
  async getPendingPaymentStatus(
    pendingPaymentId: string,
    coinType: string
  ): Promise<{
    status: string
    amount: number
    expiresAt: number
    isExpired: boolean
  } | null> {
    try {
      const tx = new Transaction()
      tx.moveCall({
        target: `${this.config.packageId}::bill_payment::get_pending_payment_status`,
        typeArguments: [coinType],
        arguments: [tx.object(pendingPaymentId)],
      })

      const result = await this.client.devInspectTransactionBlock({
        transactionBlock: tx,
        sender: '0x0000000000000000000000000000000000000000000000000000000000000000',
      })

      const returnValues = result.results?.[0]?.returnValues
      if (!returnValues || returnValues.length < 4) {
        return null
      }

      return {
        status: Buffer.from(returnValues[0][0]).toString('utf-8'),
        amount: Number(Buffer.from(returnValues[1][0]).toString('hex')),
        expiresAt: Number(Buffer.from(returnValues[2][0]).toString('hex')),
        isExpired: Buffer.from(returnValues[3][0])[0] === 1,
      }
    } catch (error) {
      console.error('Error fetching pending payment status:', error)
      return null
    }
  }
}

/**
 * Create a BillPaymentContract instance
 */
export function createBillPaymentContract(
  client: SuiClient,
  config: ContractConfig
): BillPaymentContract {
  return new BillPaymentContract(client, config)
}

/**
 * Network mappings for ClubKonnect
 */
export const NETWORK_MAPPINGS = {
  mtn: '01',
  airtel: '04', 
  glo: '02',
  '9mobile': '03'
} as const

/**
 * Service type mappings
 */
export const SERVICE_TYPES = {
  airtime: 'airtime',
  data: 'data',
  electricity: 'electricity'
} as const
