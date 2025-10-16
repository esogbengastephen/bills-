import { SuiClient, getFullnodeUrl } from '@mysten/sui/client'
import { Transaction } from '@mysten/sui/transactions'
import { normalizeSuiAddress } from '@mysten/sui/utils'

// Sui network configuration
export const SUI_NETWORKS = {
  mainnet: 'https://fullnode.mainnet.sui.io:443',
  testnet: 'https://fullnode.testnet.sui.io:443',
  devnet: 'https://fullnode.devnet.sui.io:443',
  localnet: 'http://127.0.0.1:9000'
} as const

export type SuiNetwork = keyof typeof SUI_NETWORKS

// Get the current network from environment
const currentNetwork = (process.env.NEXT_PUBLIC_SUI_NETWORK as SuiNetwork) || 'testnet'

// Initialize Sui client
export const suiClient = new SuiClient({
  url: SUI_NETWORKS[currentNetwork]
})

// Token addresses - Network specific
export const SUI_TOKEN_ADDRESSES = {
  // SUI token is the same across all networks
  SUI: '0x2::sui::SUI',
  
  // Testnet token addresses (using test tokens)
  testnet: {
    USDC: '0x2::usdc::USDC' // Test USDC on testnet
  },
  
  // Mainnet token addresses
  mainnet: {
    USDC: '0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN'
  },
  
  // Devnet token addresses (using test tokens)
  devnet: {
    USDC: '0x2::usdc::USDC'
  },
  
  // Localnet token addresses (using test tokens)
  localnet: {
    USDC: '0x2::usdc::USDC'
  }
} as const

// Get token addresses for current network
export function getTokenAddresses() {
  const network = currentNetwork
  const networkAddresses = SUI_TOKEN_ADDRESSES[network as keyof typeof SUI_TOKEN_ADDRESSES]
  
  if (typeof networkAddresses === 'object' && 'USDC' in networkAddresses) {
    return {
      SUI: SUI_TOKEN_ADDRESSES.SUI,
      USDC: networkAddresses.USDC
    }
  }
  
  // Fallback to testnet
  return {
    SUI: SUI_TOKEN_ADDRESSES.SUI,
    USDC: SUI_TOKEN_ADDRESSES.testnet.USDC
  }
}

// Token metadata - Dynamic based on network
export function getTokenMetadata() {
  const tokenAddresses = getTokenAddresses()
  
  return {
    SUI: {
      symbol: 'SUI',
      name: 'Sui Token',
      decimals: 9,
      icon: 'S',
      address: tokenAddresses.SUI
    },
    USDC: {
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      icon: 'U',
      address: tokenAddresses.USDC
    },
  }
}

// Export metadata for backward compatibility
export const SUI_TOKEN_METADATA = getTokenMetadata()

// Helper function to get token balance
export async function getTokenBalance(address: string, tokenType: string): Promise<string> {
  try {
    const normalizedAddress = normalizeSuiAddress(address)
    const tokenAddresses = getTokenAddresses()
    
    if (tokenType === 'SUI' || tokenType === tokenAddresses.SUI) {
      // Get SUI balance
      const balance = await suiClient.getBalance({
        owner: normalizedAddress,
        coinType: tokenAddresses.SUI
      })
      return (Number(balance.totalBalance) / Math.pow(10, 9)).toFixed(2)
    } else {
      // Get other token balances
      const coins = await suiClient.getCoins({
        owner: normalizedAddress,
        coinType: tokenType
      })
      
      const totalBalance = coins.data.reduce((sum, coin) => sum + Number(coin.balance), 0)
      const decimals = 6 // USDC has 6 decimals
      
      return (totalBalance / Math.pow(10, decimals)).toFixed(2)
    }
  } catch (error) {
    console.error('Error fetching token balance:', error)
    return '0.00'
  }
}

// Helper function to get all token balances
export async function getAllTokenBalances(address: string) {
  try {
    const tokenAddresses = getTokenAddresses()
    const [suiBalance, usdcBalance] = await Promise.all([
      getTokenBalance(address, 'SUI'),
      getTokenBalance(address, tokenAddresses.USDC)
    ])

    return {
      SUI: suiBalance,
      USDC: usdcBalance
    }
  } catch (error) {
    console.error('Error fetching all token balances:', error)
    return {
      SUI: '0.00',
      USDC: '0.00'
    }
  }
}

// Helper function to create a transfer transaction
export function createTransferTransaction(
  recipient: string,
  amount: string,
  tokenType: string,
  sender: string
): Transaction {
  const txb = new Transaction()
  
  const normalizedRecipient = normalizeSuiAddress(recipient)
  const normalizedSender = normalizeSuiAddress(sender)
  
  // Convert amount to smallest unit
  const decimals = tokenType === 'SUI' 
    ? 9 
    : 6 // USDC has 6 decimals
  
  const amountInSmallestUnit = Math.floor(parseFloat(amount) * Math.pow(10, decimals))
  
  if (tokenType === 'SUI') {
    // Transfer SUI
    const [coin] = txb.splitCoins(txb.gas, [amountInSmallestUnit])
    txb.transferObjects([coin], normalizedRecipient)
  } else {
    // Transfer other tokens
    const [coin] = txb.splitCoins(
      txb.object(tokenType),
      [amountInSmallestUnit]
    )
    txb.transferObjects([coin], normalizedRecipient)
  }
  
  return txb
}

// Helper function to estimate transaction gas
export async function estimateTransactionGas(txb: Transaction, sender: string): Promise<string> {
  try {
    const normalizedSender = normalizeSuiAddress(sender)
    const dryRunResult = await suiClient.dryRunTransactionBlock({
      transactionBlock: await txb.build({ client: suiClient })
    })
    
    // Convert gas to SUI (gas is in smallest unit)
    const gasInSui = Number(dryRunResult.effects.gasUsed.computationCost) / Math.pow(10, 9)
    return gasInSui.toFixed(6)
  } catch (error) {
    console.error('Error estimating gas:', error)
    return '0.001' // Default gas estimate
  }
}

// Helper function to get transaction details
export async function getTransactionDetails(txDigest: string) {
  try {
    const txDetails = await suiClient.getTransactionBlock({
      digest: txDigest,
      options: {
        showEffects: true,
        showInput: true,
        showEvents: true,
        showObjectChanges: true
      }
    })
    
    return txDetails
  } catch (error) {
    console.error('Error fetching transaction details:', error)
    return null
  }
}

// Helper function to format address for display
export function formatAddress(address: string, length = 8): string {
  if (!address) return ''
  const normalized = normalizeSuiAddress(address)
  return `${normalized.slice(0, length)}...${normalized.slice(-length)}`
}

// Helper function to validate Sui address
export function isValidSuiAddress(address: string): boolean {
  try {
    normalizeSuiAddress(address)
    return true
  } catch {
    return false
  }
}

// Network utilities
export function getNetworkDisplayName(network: SuiNetwork): string {
  const names = {
    mainnet: 'Mainnet',
    testnet: 'Testnet',
    devnet: 'Devnet',
    localnet: 'Localnet'
  }
  return names[network]
}

export function getCurrentNetwork(): SuiNetwork {
  return currentNetwork
}

export function getCurrentNetworkUrl(): string {
  return SUI_NETWORKS[currentNetwork]
}
