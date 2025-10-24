'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

interface WalletContextType {
  walletAddress: string | null
  isConnected: boolean
  connectWallet: (address: string) => void
  disconnectWallet: () => void
  isLoading: boolean
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export function WalletProvider({ children }: { children: ReactNode }) {
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Load wallet address from localStorage on mount
    const savedAddress = localStorage.getItem('walletAddress')
    if (savedAddress) {
      setWalletAddress(savedAddress)
      setIsConnected(true)
    }
    setIsLoading(false)
  }, [])

  const connectWallet = async (address: string) => {
    try {
      // Save to localStorage
      localStorage.setItem('walletAddress', address)
      setWalletAddress(address)
      setIsConnected(true)

      // Get current user data
      const userData = localStorage.getItem('user')
      if (userData) {
        const user = JSON.parse(userData)
        
        // Update user data with wallet address
        const updatedUserData = {
          ...user,
          walletAddress: address
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
      // Remove from localStorage
      localStorage.removeItem('walletAddress')
      setWalletAddress(null)
      setIsConnected(false)

      // Get current user data
      const userData = localStorage.getItem('user')
      if (userData) {
        const user = JSON.parse(userData)
        
        // Update user data to remove wallet address
        const updatedUserData = {
          ...user,
          walletAddress: null
        }
        localStorage.setItem('user', JSON.stringify(updatedUserData))

        // Update wallet address in Supabase (set to null)
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
          console.log('Wallet address removed from Supabase successfully')
        } else {
          console.error('Failed to remove wallet address from Supabase')
        }
      }
    } catch (error) {
      console.error('Error disconnecting wallet:', error)
    }
  }

  return (
    <WalletContext.Provider value={{
      walletAddress,
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
