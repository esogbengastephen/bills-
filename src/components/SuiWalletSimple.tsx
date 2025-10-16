'use client'

import { useState, useEffect } from 'react'
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519'
import { SuiClient } from '@mysten/sui/client'

// Simple Sui wallet using keypairs (secret key + public key)
export function SuiWalletSimple() {
  const [keypair, setKeypair] = useState<Ed25519Keypair | null>(null)
  const [balance, setBalance] = useState<string>('0')
  const [isLoading, setIsLoading] = useState(false)
  const [secretKeyInput, setSecretKeyInput] = useState('')
  const [showKeyInput, setShowKeyInput] = useState(false)

  // Initialize Sui client for testnet
  const suiClient = new SuiClient({
    url: 'https://fullnode.testnet.sui.io:443'
  })

  // Generate new keypair
  const generateNewKeypair = () => {
    const newKeypair = new Ed25519Keypair()
    setKeypair(newKeypair)
    setShowKeyInput(false)
    console.log('Generated new keypair:')
    console.log('Secret Key:', newKeypair.getSecretKey())
    console.log('Public Key:', newKeypair.getPublicKey().toBase64())
    console.log('Address:', newKeypair.getPublicKey().toSuiAddress())
  }

  // Load keypair from secret key
  const loadFromSecretKey = () => {
    try {
      const loadedKeypair = Ed25519Keypair.fromSecretKey(secretKeyInput)
      setKeypair(loadedKeypair)
      setShowKeyInput(false)
      setSecretKeyInput('')
      console.log('Loaded keypair from secret key:')
      console.log('Public Key:', loadedKeypair.getPublicKey().toBase64())
      console.log('Address:', loadedKeypair.getPublicKey().toSuiAddress())
    } catch (error) {
      alert('Invalid secret key format')
      console.error('Error loading keypair:', error)
    }
  }

  // Get balance for current address
  const getBalance = async () => {
    if (!keypair) return

    setIsLoading(true)
    try {
      const address = keypair.getPublicKey().toSuiAddress()
      const balance = await suiClient.getBalance({
        owner: address,
        coinType: '0x2::sui::SUI'
      })
      setBalance((parseInt(balance.totalBalance) / 1e9).toFixed(4))
    } catch (error) {
      console.error('Error fetching balance:', error)
      setBalance('0')
    } finally {
      setIsLoading(false)
    }
  }

  // Load balance when keypair changes
  useEffect(() => {
    if (keypair) {
      getBalance()
    }
  }, [keypair])

  if (!keypair) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Sui Wallet (Simple Keypair)</h3>
        
        <div className="space-y-4">
          <button
            onClick={generateNewKeypair}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Generate New Wallet
          </button>
          
          <div className="text-center text-gray-500">or</div>
          
          <button
            onClick={() => setShowKeyInput(!showKeyInput)}
            className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Load from Secret Key
          </button>
          
          {showKeyInput && (
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Enter your secret key..."
                value={secretKeyInput}
                onChange={(e) => setSecretKeyInput(e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
              <button
                onClick={loadFromSecretKey}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
              >
                Load Wallet
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  const address = keypair.getPublicKey().toSuiAddress()
  const publicKey = keypair.getPublicKey().toBase64()

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Sui Wallet (Simple Keypair)</h3>
      
      <div className="space-y-4">
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Address:</div>
          <div className="text-sm font-mono break-all text-gray-900 dark:text-gray-100">
            {address}
          </div>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Public Key:</div>
          <div className="text-sm font-mono break-all text-gray-900 dark:text-gray-100">
            {publicKey}
          </div>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Balance:</div>
          <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {isLoading ? 'Loading...' : `${balance} SUI`}
          </div>
          <button
            onClick={getBalance}
            disabled={isLoading}
            className="mt-2 text-sm bg-blue-600 text-white py-1 px-3 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Refresh Balance
          </button>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={() => {
              navigator.clipboard.writeText(address)
              alert('Address copied to clipboard!')
            }}
            className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Copy Address
          </button>
          
          <button
            onClick={() => {
              navigator.clipboard.writeText(publicKey)
              alert('Public key copied to clipboard!')
            }}
            className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Copy Public Key
          </button>
        </div>
        
        <button
          onClick={() => {
            setKeypair(null)
            setBalance('0')
            setSecretKeyInput('')
            setShowKeyInput(false)
          }}
          className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
        >
          Disconnect Wallet
        </button>
      </div>
    </div>
  )
}

export function NetworkIndicator() {
  return (
    <div className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
      TESTNET
    </div>
  )
}