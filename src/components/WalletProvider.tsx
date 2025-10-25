'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

interface WalletContextType {
  walletAddress: string | null
  walletAddresses: string[]
  isConnected: boolean
  connectWallet: (address: string) => void
  disconnectWallet: () => void
  isLoading: boolean
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export function WalletProvider({ children }: { children: ReactNode }) {
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [walletAddresses, setWalletAddresses] = useState<string[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Load wallet addresses from localStorage on mount
    const savedAddresses = localStorage.getItem('walletAddresses')
    console.log('WalletProvider: Loading saved addresses:', savedAddresses)
    
    if (savedAddresses) {
      try {
        const addresses = JSON.parse(savedAddresses)
        console.log('WalletProvider: Parsed addresses:', addresses)
        setWalletAddresses(addresses)
        if (addresses.length > 0) {
          setWalletAddress(addresses[0]) // Use first address as primary
          setIsConnected(true)
          console.log('WalletProvider: Set primary address:', addresses[0])
        }
      } catch (error) {
        console.error('Error parsing saved wallet addresses:', error)
      }
    }
    setIsLoading(false)
  }, [])

  const connectWallet = async (address: string) => {
    try {
      console.log('WalletProvider: Connecting wallet:', address)
      console.log('WalletProvider: Current addresses:', walletAddresses)
      
      // Add to addresses array if not already present
      const newAddresses = walletAddresses.includes(address) 
        ? walletAddresses 
        : [...walletAddresses, address]
      
      console.log('WalletProvider: New addresses array:', newAddresses)
      
      setWalletAddresses(newAddresses)
      setWalletAddress(address)
      setIsConnected(true)

      // Save to localStorage
      localStorage.setItem('walletAddresses', JSON.stringify(newAddresses))
      localStorage.setItem('walletAddress', address)
      console.log('WalletProvider: Saved to localStorage')

      // Get current user data
      const userData = localStorage.getItem('user')
      if (userData) {
        const user = JSON.parse(userData)
        
        // Update user data with wallet address
        const updatedUserData = {
          ...user,
          walletAddress: address,
          walletAddresses: newAddresses
        }
        localStorage.setItem('user', JSON.stringify(updatedUserData))

        // Store wallet address in Supabase
        const response = await fetch('/api/auth/wallet', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: user.email,
            walletAddress: address
          })
        })

        if (response.ok) {
          console.log('Wallet address stored in Supabase successfully')
        } else {
          console.error('Failed to store wallet address in Supabase')
        }
      }
    } catch (error) {
      console.error('Error connecting wallet:', error)
    }
  }

  const disconnectWallet = async () => {
    try {
      console.log('WalletProvider: Disconnecting wallet')
      
      // Clear all addresses
      setWalletAddresses([])
      setWalletAddress(null)
      setIsConnected(false)

      // Remove from localStorage
      localStorage.removeItem('walletAddresses')
      localStorage.removeItem('walletAddress')
      console.log('WalletProvider: Removed from localStorage')

      // Get current user data
      const userData = localStorage.getItem('user')
      if (userData) {
        const user = JSON.parse(userData)
        
        // Update user data to remove wallet addresses
        const updatedUserData = {
          ...user,
          walletAddress: null,
          walletAddresses: []
        }
        localStorage.setItem('user', JSON.stringify(updatedUserData))

        // Update wallet addresses in Supabase (set to empty array)
        const response = await fetch('/api/auth/wallet', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: user.email,
            walletAddress: null
          })
        })

        if (response.ok) {
          console.log('Wallet addresses removed from Supabase successfully')
        } else {
          console.error('Failed to remove wallet addresses from Supabase')
        }
      }
    } catch (error) {
      console.error('Error disconnecting wallet:', error)
    }
  }

  return (
    <WalletContext.Provider value={{
      walletAddress,
      walletAddresses,
      isConnected,
      connectWallet,
      disconnectWallet,
      isLoading
    }}>
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const context = useContext(WalletContext)
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider')
  }
  return context
}
