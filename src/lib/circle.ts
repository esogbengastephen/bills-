import { Circle, CircleEnvironments } from '@circle-fin/circle-sdk'

// Circle API configuration
const CIRCLE_API_KEY = process.env.CIRCLE_API_KEY || ''
const CIRCLE_ENVIRONMENT = process.env.NODE_ENV === 'production' 
  ? CircleEnvironments.production 
  : CircleEnvironments.sandbox

// Initialize Circle SDK
export const circleClient = new Circle(CIRCLE_API_KEY, CIRCLE_ENVIRONMENT)

// Circle API service for stablecoin operations
export class CircleService {
  private client: Circle

  constructor() {
    this.client = new Circle(CIRCLE_API_KEY, CIRCLE_ENVIRONMENT)
  }

  /**
   * Get wallet balance for USDC
   */
  async getWalletBalance(walletId: string, tokenType: 'USDC'): Promise<number> {
    try {
      const response = await this.client.wallets.getWallet(walletId)
      
      if (response.data?.data) {
        const wallet = response.data.data
        const tokenAddress = this.getTokenAddress(tokenType)
        
        // Find the token balance in the wallet
        const tokenBalance = wallet.tokenBalances?.find(
          balance => balance.tokenAddress === tokenAddress
        )
        
        return tokenBalance ? parseFloat(tokenBalance.amount) : 0
      }
      
      return 0
    } catch (error) {
      console.error('Error fetching Circle wallet balance:', error)
      return 0
    }
  }

  /**
   * Create a payment for bill payment
   */
  async createPayment(params: {
    sourceWalletId: string
    destinationAddress: string
    amount: string
    tokenType: 'USDC'
    description: string
  }): Promise<{ success: boolean; paymentId?: string; error?: string }> {
    try {
      const tokenAddress = this.getTokenAddress(params.tokenType)
      
      const paymentData = {
        source: {
          type: 'wallet',
          id: params.sourceWalletId
        },
        destination: {
          type: 'address',
          address: params.destinationAddress
        },
        amount: {
          amount: params.amount,
          currency: params.tokenType
        },
        metadata: {
          description: params.description,
          billPayment: true,
          service: 'bill-payment-dapp'
        }
      }

      const response = await this.client.payments.createPayment(paymentData)
      
      if (response.data?.data) {
        return {
          success: true,
          paymentId: response.data.data.id
        }
      }
      
      return {
        success: false,
        error: 'Failed to create payment'
      }
    } catch (error: any) {
      console.error('Error creating Circle payment:', error)
      return {
        success: false,
        error: error.message || 'Payment creation failed'
      }
    }
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(paymentId: string): Promise<{ status: string; error?: string }> {
    try {
      const response = await this.client.payments.getPayment(paymentId)
      
      if (response.data?.data) {
        return {
          status: response.data.data.status
        }
      }
      
      return {
        status: 'unknown',
        error: 'Payment not found'
      }
    } catch (error: any) {
      console.error('Error fetching payment status:', error)
      return {
        status: 'error',
        error: error.message || 'Failed to fetch payment status'
      }
    }
  }

  /**
   * Create a wallet for user
   */
  async createWallet(userId: string): Promise<{ success: boolean; walletId?: string; error?: string }> {
    try {
      const walletData = {
        idempotencyKey: `wallet-${userId}-${Date.now()}`,
        description: `Bill Payment Wallet for ${userId}`,
        metadata: {
          userId,
          service: 'bill-payment-dapp'
        }
      }

      const response = await this.client.wallets.createWallet(walletData)
      
      if (response.data?.data) {
        return {
          success: true,
          walletId: response.data.data.walletId
        }
      }
      
      return {
        success: false,
        error: 'Failed to create wallet'
      }
    } catch (error: any) {
      console.error('Error creating Circle wallet:', error)
      return {
        success: false,
        error: error.message || 'Wallet creation failed'
      }
    }
  }

  /**
   * Get token address for Circle API
   */
  private getTokenAddress(tokenType: 'USDC'): string {
    // Use the correct USDC address based on network
    const network = process.env.NEXT_PUBLIC_SUI_NETWORK || 'testnet'
    
    if (network === 'testnet') {
      return '0xa1ec7fc00a6f40db9693ad1415d0c193ad3906494428cf252621037bd7117e29::usdc::USDC'
    } else {
      return '0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN'
    }
  }

  /**
   * Estimate transaction fees
   */
  async estimateFees(params: {
    sourceWalletId: string
    destinationAddress: string
    amount: string
    tokenType: 'USDC'
  }): Promise<{ fees: number; error?: string }> {
    try {
      const tokenAddress = this.getTokenAddress(params.tokenType)
      
      const feeData = {
        source: {
          type: 'wallet',
          id: params.sourceWalletId
        },
        destination: {
          type: 'address',
          address: params.destinationAddress
        },
        amount: {
          amount: params.amount,
          currency: params.tokenType
        }
      }

      const response = await this.client.payments.estimatePaymentFee(feeData)
      
      if (response.data?.data) {
        return {
          fees: parseFloat(response.data.data.fee.amount)
        }
      }
      
      return {
        fees: 0,
        error: 'Failed to estimate fees'
      }
    } catch (error: any) {
      console.error('Error estimating Circle fees:', error)
      return {
        fees: 0,
        error: error.message || 'Fee estimation failed'
      }
    }
  }
}

// Export singleton instance
export const circleService = new CircleService()
