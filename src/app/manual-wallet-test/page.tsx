'use client'

import { useState } from 'react'

export default function ManualWalletTest() {
  const [connectionResult, setConnectionResult] = useState<string>('')
  const [isConnecting, setIsConnecting] = useState(false)

  const testDirectConnection = async () => {
    setIsConnecting(true)
    setConnectionResult('')

    try {
      // Check if Sui Wallet is available
      const wallet = (window as any).suiWallet || (window as any).__sui_wallet__
      
      if (!wallet) {
        setConnectionResult('❌ Sui Wallet extension not found. Please install and enable it.')
        return
      }

      setConnectionResult('✅ Sui Wallet detected! Attempting connection...')

      // Try to connect
      if (typeof wallet.connect === 'function') {
        const result = await wallet.connect()
        setConnectionResult(`✅ Connection successful! Result: ${JSON.stringify(result)}`)
      } else if (typeof wallet.requestPermissions === 'function') {
        await wallet.requestPermissions()
        setConnectionResult('✅ Permissions requested successfully!')
      } else {
        setConnectionResult('⚠️ Wallet detected but no connection method found')
      }

      // Try to get accounts
      if (typeof wallet.getAccounts === 'function') {
        const accounts = await wallet.getAccounts()
        setConnectionResult(prev => prev + `\n📋 Accounts: ${JSON.stringify(accounts)}`)
      }

    } catch (error: any) {
      setConnectionResult(`❌ Connection failed: ${error.message}`)
    } finally {
      setIsConnecting(false)
    }
  }

  const checkExtensionStatus = () => {
    let result = '🔍 Checking for Sui Wallet extension...\n\n'
    
    // Check multiple possible wallet objects
    const possibleWallets = [
      'suiWallet',
      '__sui_wallet__',
      'sui',
      'SuiWallet',
      '__sui_wallet_kit__'
    ]
    
    let foundAny = false
    possibleWallets.forEach(name => {
      const obj = (window as any)[name]
      if (obj && typeof obj === 'object') {
        result += `✅ Found window.${name}\n`
        result += `   Available methods: ${Object.keys(obj).join(', ')}\n\n`
        foundAny = true
      } else {
        result += `❌ window.${name} not found\n`
      }
    })
    
    // Check all window properties for anything wallet-related
    const windowProps = Object.keys(window).filter(key => 
      key.toLowerCase().includes('sui') || 
      key.toLowerCase().includes('wallet') ||
      key.toLowerCase().includes('dapp')
    )
    
    if (windowProps.length > 0) {
      result += `🔍 Found wallet-related properties: ${windowProps.join(', ')}\n\n`
      
      // Check each property for wallet-like objects
      windowProps.forEach(prop => {
        const obj = (window as any)[prop]
        if (obj && typeof obj === 'object' && (obj.connect || obj.getAccounts)) {
          result += `✅ Found wallet object at window.${prop}\n`
          result += `   Methods: ${Object.keys(obj).join(', ')}\n\n`
          foundAny = true
        }
      })
    }
    
    if (!foundAny) {
      result += '❌ No Sui Wallet objects found\n\n'
      result += 'Please check:\n'
      result += '• Extension is installed\n'
      result += '• Extension is enabled\n'
      result += '• Extension is pinned to toolbar\n'
      result += '• Refresh the page\n'
      result += '• Try opening Sui Wallet directly first'
    } else {
      result += '🎉 Sui Wallet detected! You can now try connecting.'
    }
    
    setConnectionResult(result)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">
          Manual Wallet Test
        </h1>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Direct Connection Test</h2>
          
          <div className="space-y-4">
            <button
              onClick={checkExtensionStatus}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Check Extension Status
            </button>
            
            <button
              onClick={() => {
                // Try to open Sui Wallet extension
                const wallet = (window as any).suiWallet || (window as any).__sui_wallet__
                if (wallet && typeof wallet.open === 'function') {
                  wallet.open()
                } else {
                  alert('Sui Wallet not detected. Please make sure the extension is installed and enabled.')
                }
              }}
              className="w-full bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
            >
              Open Sui Wallet
            </button>
            
            <button
              onClick={testDirectConnection}
              disabled={isConnecting}
              className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
            >
              {isConnecting ? 'Connecting...' : 'Test Direct Connection'}
            </button>
          </div>
          
          {connectionResult && (
            <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-900 rounded">
              <pre className="text-sm whitespace-pre-wrap">{connectionResult}</pre>
            </div>
          )}
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900 p-4 rounded-lg">
          <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
            Quick Fix Steps:
          </h3>
          <ol className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
            <li>1. Go to <code>chrome://extensions/</code></li>
            <li>2. Find "Sui Wallet" and make sure it's ENABLED</li>
            <li>3. Click the puzzle piece icon in Chrome toolbar</li>
            <li>4. Pin "Sui Wallet" to your toolbar</li>
            <li>5. Click the Sui Wallet icon to open it</li>
            <li>6. Create/import an account if needed</li>
            <li>7. Switch to TESTNET in Sui Wallet</li>
            <li>8. Refresh this page (F5)</li>
            <li>9. Click "Check Extension Status" above</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
