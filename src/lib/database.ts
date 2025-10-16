import { PrismaClient } from '@prisma/client'

// Global Prisma client instance
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

let prisma: PrismaClient | null = null

try {
  prisma = globalForPrisma.prisma ?? new PrismaClient()
  if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
} catch (error) {
  console.warn('Prisma client initialization failed:', error)
  prisma = null
}

// Helper function to check if database is available
function isDatabaseAvailable(): boolean {
  return prisma !== null
}

// Transaction logging functions
export interface TransactionData {
  userAddress: string
  serviceType: 'airtime' | 'data' | 'electricity' | 'tv'
  tokenType: string
  amount: number
  serviceDetails: any
  txDigest: string
  status: 'success' | 'failed' | 'pending' | 'retried' | 'cancelled'
  error?: string
}

export async function logTransaction(data: TransactionData) {
  if (!isDatabaseAvailable()) {
    console.warn('Database not available, skipping transaction log')
    return null
  }

  try {
    const transaction = await prisma!.transaction.create({
      data: {
        userAddress: data.userAddress,
        serviceType: data.serviceType,
        tokenType: data.tokenType,
        amount: data.amount,
        serviceDetails: data.serviceDetails,
        txDigest: data.txDigest,
        status: data.status,
        error: data.error,
      },
    })

    // Update wallet connection stats
    await updateWalletStats(data.userAddress, data.amount, data.status === 'success')

    return transaction
  } catch (error) {
    console.error('Error logging transaction:', error)
    throw error
  }
}

export async function getTransactions(limit: number = 50, offset: number = 0) {
  if (!isDatabaseAvailable()) {
    console.warn('Database not available, returning empty transactions')
    return []
  }

  try {
    const transactions = await prisma!.transaction.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    })
    return transactions
  } catch (error) {
    console.error('Error fetching transactions:', error)
    throw error
  }
}

export async function getTransactionsByUser(userAddress: string, limit: number = 20) {
  if (!isDatabaseAvailable()) {
    console.warn('Database not available, returning empty user transactions')
    return []
  }

  try {
    const transactions = await prisma!.transaction.findMany({
      where: { userAddress },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
    return transactions
  } catch (error) {
    console.error('Error fetching user transactions:', error)
    throw error
  }
}

export async function updateTransactionStatus(txDigest: string, status: string, error?: string) {
  if (!isDatabaseAvailable()) {
    console.warn('Database not available, skipping transaction status update')
    return null
  }

  try {
    const transaction = await prisma!.transaction.update({
      where: { txDigest },
      data: { 
        status,
        error: error || null,
        updatedAt: new Date(),
      },
    })
    return transaction
  } catch (error) {
    console.error('Error updating transaction status:', error)
    throw error
  }
}

// User activity logging functions
export interface UserActivityData {
  userAddress: string
  action: string
  details?: any
  ipAddress?: string
  userAgent?: string
}

export async function logUserActivity(data: UserActivityData) {
  if (!isDatabaseAvailable()) {
    console.warn('Database not available, skipping user activity log')
    return null
  }

  try {
    const activity = await prisma!.userActivity.create({
      data: {
        userAddress: data.userAddress,
        action: data.action,
        details: data.details,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    })

    // Update wallet connection last seen
    await updateWalletLastSeen(data.userAddress)

    return activity
  } catch (error) {
    console.error('Error logging user activity:', error)
    throw error
  }
}

export async function getUserActivities(userAddress: string, limit: number = 20) {
  if (!isDatabaseAvailable()) {
    console.warn('Database not available, returning empty user activities')
    return []
  }

  try {
    const activities = await prisma!.userActivity.findMany({
      where: { userAddress },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
    return activities
  } catch (error) {
    console.error('Error fetching user activities:', error)
    throw error
  }
}

// Wallet connection management
export async function updateWalletStats(userAddress: string, amount: number, isSuccess: boolean) {
  if (!isDatabaseAvailable()) {
    console.warn('Database not available, skipping wallet stats update')
    return
  }

  try {
    const existing = await prisma!.walletConnection.findUnique({
      where: { userAddress },
    })

    if (existing) {
      await prisma!.walletConnection.update({
        where: { userAddress },
        data: {
          lastSeen: new Date(),
          totalTransactions: existing.totalTransactions + 1,
          totalVolume: existing.totalVolume + (isSuccess ? amount : 0),
        },
      })
    } else {
      await prisma!.walletConnection.create({
        data: {
          userAddress,
          totalTransactions: 1,
          totalVolume: isSuccess ? amount : 0,
        },
      })
    }
  } catch (error) {
    console.error('Error updating wallet stats:', error)
    throw error
  }
}

export async function updateWalletLastSeen(userAddress: string) {
  if (!isDatabaseAvailable()) {
    console.warn('Database not available, skipping wallet last seen update')
    return
  }

  try {
    const existing = await prisma!.walletConnection.findUnique({
      where: { userAddress },
    })

    if (existing) {
      await prisma!.walletConnection.update({
        where: { userAddress },
        data: { lastSeen: new Date() },
      })
    } else {
      await prisma!.walletConnection.create({
        data: { userAddress },
      })
    }
  } catch (error) {
    console.error('Error updating wallet last seen:', error)
    throw error
  }
}

export async function getWalletConnections(limit: number = 50) {
  if (!isDatabaseAvailable()) {
    console.warn('Database not available, returning empty wallet connections')
    return []
  }

  try {
    const connections = await prisma!.walletConnection.findMany({
      orderBy: { lastSeen: 'desc' },
      take: limit,
    })
    return connections
  } catch (error) {
    console.error('Error fetching wallet connections:', error)
    throw error
  }
}

// Admin settings management
export async function getAdminSetting(key: string) {
  if (!isDatabaseAvailable()) {
    console.warn('Database not available, returning null for admin setting')
    return null
  }

  try {
    const setting = await prisma!.adminSettings.findUnique({
      where: { key },
    })
    return setting?.value
  } catch (error) {
    console.error('Error fetching admin setting:', error)
    throw error
  }
}

export async function setAdminSetting(key: string, value: string, description?: string) {
  if (!isDatabaseAvailable()) {
    console.warn('Database not available, skipping admin setting update')
    return null
  }

  try {
    const setting = await prisma!.adminSettings.upsert({
      where: { key },
      update: { value, description },
      create: { key, value, description },
    })
    return setting
  } catch (error) {
    console.error('Error setting admin setting:', error)
    throw error
  }
}

// Analytics functions
export async function getTransactionStats() {
  if (!isDatabaseAvailable()) {
    console.warn('Database not available, returning empty transaction stats')
    return {
      totalTransactions: 0,
      totalVolume: 0,
      byStatus: [],
    }
  }

  try {
    const stats = await prisma!.transaction.groupBy({
      by: ['status'],
      _count: { status: true },
      _sum: { amount: true },
    })

    const totalTransactions = await prisma!.transaction.count()
    const totalVolume = await prisma!.transaction.aggregate({
      _sum: { amount: true },
    })

    return {
      totalTransactions,
      totalVolume: totalVolume._sum.amount || 0,
      byStatus: stats,
    }
  } catch (error) {
    console.error('Error fetching transaction stats:', error)
    throw error
  }
}

export async function getWalletStats() {
  if (!isDatabaseAvailable()) {
    console.warn('Database not available, returning empty wallet stats')
    return {
      totalWallets: 0,
      activeWallets: 0,
      topWallets: [],
    }
  }

  try {
    const totalWallets = await prisma!.walletConnection.count()
    const activeWallets = await prisma!.walletConnection.count({
      where: {
        lastSeen: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
    })

    const topWallets = await prisma!.walletConnection.findMany({
      orderBy: { totalVolume: 'desc' },
      take: 10,
    })

    return {
      totalWallets,
      activeWallets,
      topWallets,
    }
  } catch (error) {
    console.error('Error fetching wallet stats:', error)
    throw error
  }
}
