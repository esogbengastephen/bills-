'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SuiClientProvider, WalletProvider, createNetworkConfig } from '@mysten/dapp-kit'
import { ReactNode } from 'react'

// Create a query client
const queryClient = new QueryClient()

// Define networks using createNetworkConfig (Wallet Standard approach)
const { networkConfig } = createNetworkConfig({
  localnet: { url: 'http://127.0.0.1:9000' },
  devnet: { url: 'https://fullnode.devnet.sui.io:443' },
  testnet: { url: 'https://fullnode.testnet.sui.io:443' },
  mainnet: { url: 'https://fullnode.mainnet.sui.io:443' },
})

// Wallet provider wrapper
export function SuiWalletProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networkConfig} defaultNetwork="testnet">
        <WalletProvider>
          {children}
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  )
}