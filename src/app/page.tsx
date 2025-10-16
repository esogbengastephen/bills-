'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ServiceCard from '@/components/ServiceCard'
import { SimpleWalletDisplay, NetworkIndicator, WalletProvider } from '@/components/SimpleWallet'

// Services data
const services = [
  { icon: 'phone_iphone', title: 'Buy Airtime', id: 'airtime' },
  { icon: 'wifi', title: 'Buy Data', id: 'data' },
  { icon: 'tv', title: 'TV Subscription', id: 'tv' },
  { icon: 'lightbulb', title: 'Electricity Bills', id: 'electricity' },
]

export default function Home() {
  const router = useRouter()

  const handleServiceClick = (serviceId: string) => {
    console.log(`Service clicked: ${serviceId}`)
    
    // Navigate to appropriate service page
    switch (serviceId) {
      case 'data':
        router.push('/data-purchase')
        break
      case 'airtime':
        router.push('/airtime-purchase')
        break
      case 'tv':
        router.push('/tv-subscription')
        break
      case 'electricity':
        router.push('/electricity-bills')
        break
      default:
        console.log(`Service ${serviceId} not implemented yet`)
    }
  }

  return (
    <WalletProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Mobile Container */}
        <div className="mobile-container py-6">
          {/* Header */}
        {/* Wallet Display - Centered at top */}
        <div className="flex justify-center mb-6">
          <SimpleWalletDisplay />
        </div>

        <header className="mb-6">
          <div className="flex items-center justify-center">
            <NetworkIndicator />
          </div>
        </header>

        {/* Main Content */}
        <main className="space-y-6">
          {/* Services Grid */}
          <div className="grid grid-cols-2 gap-3">
            {services.map((service) => (
              <ServiceCard
                key={service.id}
                icon={service.icon}
                title={service.title}
                onClick={() => handleServiceClick(service.id)}
              />
            ))}
          </div>

          {/* Promotional Banner */}
          <div className="bg-gradient-to-r from-primary to-indigo-700 p-4 rounded-xl text-white flex items-center justify-between shadow-lg">
            <div>
              <h3 className="font-bold text-lg">Get 50% Off!</h3>
              <p className="text-sm opacity-90">On your first data purchase</p>
            </div>
            <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <span className="material-icons text-white text-lg">sell</span>
            </div>
          </div>

          {/* Transaction History Link */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mr-3">
                  <span className="material-icons text-gray-600 dark:text-gray-400">
                    history
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Transaction History
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    View all your payments
                  </p>
                </div>
              </div>
              <button
                onClick={() => router.push('/transaction-history')}
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                <span className="material-icons">arrow_forward_ios</span>
              </button>
            </div>
          </div>
        </main>
        </div>

        {/* Material Icons Font */}
        <link
          href="https://fonts.googleapis.com/icon?family=Material+Icons"
          rel="stylesheet"
        />
      </div>
    </WalletProvider>
  )
}
