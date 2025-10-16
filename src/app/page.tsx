'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ServiceCard from '@/components/ServiceCard'
import { SimpleWalletDisplay, NetworkIndicator, WalletProvider } from '@/components/SimpleWallet'
import TransactionCard from '@/components/TransactionCard'

// Mock data
const services = [
  { icon: 'phone_iphone', title: 'Buy Airtime', id: 'airtime' },
  { icon: 'wifi', title: 'Buy Data', id: 'data' },
  { icon: 'tv', title: 'TV Subscription', id: 'tv' },
  { icon: 'lightbulb', title: 'Electricity Bills', id: 'electricity' },
]

const transactions = [
  {
    id: '1',
    type: 'airtime' as const,
    title: 'Airtime Purchase',
    description: 'MTN - 08012345678',
    amount: 10.00,
    date: 'Oct 26',
    status: 'success' as const,
  },
  {
    id: '2',
    type: 'electricity' as const,
    title: 'Electricity Bill',
    description: 'Meter #123456',
    amount: -50.00,
    date: 'Oct 25',
    status: 'success' as const,
  },
  {
    id: '3',
    type: 'data' as const,
    title: 'Data Purchase',
    description: 'Airtel - 5GB',
    amount: 5.00,
    date: 'Oct 24',
    status: 'success' as const,
  },
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

          {/* Transaction History */}
          <div>
            <h2 className="text-lg font-bold mb-3 text-gray-900 dark:text-gray-100">
              Transaction History
            </h2>
            <div className="space-y-2">
              {transactions.map((transaction) => (
                <TransactionCard
                  key={transaction.id}
                  transaction={transaction}
                />
              ))}
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
