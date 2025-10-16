'use client'

import { SuiWalletSimple } from '@/components/SuiWalletSimple'

export default function SimpleWalletTest() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">
          Simple Sui Keypair Wallet Test
        </h1>
        
        <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg mb-6">
          <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">How it works:</h3>
          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <li>• <strong>Generate New Wallet:</strong> Creates a new Ed25519 keypair with secret key + public key</li>
            <li>• <strong>Load from Secret Key:</strong> Import existing wallet using your secret key</li>
            <li>• <strong>No Extension Required:</strong> Works directly with Sui SDK using keypairs</li>
            <li>• <strong>Real Balance:</strong> Shows actual SUI balance from Sui testnet</li>
            <li>• <strong>Copy Keys:</strong> Copy address and public key to clipboard</li>
          </ul>
        </div>

        <SuiWalletSimple />
        
        <div className="mt-6 bg-green-50 dark:bg-green-900 p-4 rounded-lg">
          <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">Benefits:</h3>
          <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
            <li>✅ No browser extension dependencies</li>
            <li>✅ Works offline (except for balance queries)</li>
            <li>✅ Simple secret key + public key approach</li>
            <li>✅ Direct integration with Sui SDK</li>
            <li>✅ Perfect for testing and development</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
