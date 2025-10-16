'use client'

import { useState } from 'react'
import { SuiWalletConnectButton, NetworkIndicator } from './SuiWalletStandard'
import { SuiWalletSimple, NetworkIndicator as SimpleNetworkIndicator } from './SuiWalletSimple'

// Default to simple keypair wallet
const USE_SIMPLE_WALLET = process.env.NEXT_PUBLIC_USE_SIMPLE_WALLET !== 'false'

export function WalletToggle() {
  const [useSimpleWallet, setUseSimpleWallet] = useState(USE_SIMPLE_WALLET)

  if (useSimpleWallet) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-green-600 dark:text-green-400">Simple Keypair Wallet</span>
          <button
            onClick={() => setUseSimpleWallet(false)}
            className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded"
          >
            Switch to Extension
          </button>
        </div>
        <div className="flex justify-between items-center">
          <SimpleNetworkIndicator />
          <SuiWalletSimple />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600 dark:text-gray-400">Wallet Extension Mode</span>
        <button
          onClick={() => setUseSimpleWallet(true)}
          className="text-xs bg-blue-200 dark:bg-blue-700 px-2 py-1 rounded"
        >
          Switch to Simple
        </button>
      </div>
      <div className="flex justify-between items-center">
        <NetworkIndicator />
        <SuiWalletConnectButton />
      </div>
    </div>
  )
}
