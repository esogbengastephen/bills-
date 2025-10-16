// src/lib/transaction-logger.ts

export interface TransactionLog {
  id: string
  timestamp: number
  userAddress: string
  serviceType: 'airtime' | 'data' | 'electricity' | 'tv'
  tokenType: string
  amount: number
  serviceDetails: any
  txDigest: string
  status: 'pending' | 'success' | 'failed'
  error?: string
  errorCode?: string
}

class TransactionLogger {
  private logs: TransactionLog[] = []

  async logTransaction(log: Omit<TransactionLog, 'id' | 'timestamp'>) {
    const transactionLog: TransactionLog = {
      ...log,
      id: this.generateId(),
      timestamp: Date.now()
    }
    
    this.logs.push(transactionLog)
    
    // Try to log to database
    try {
      const { logTransaction } = await import('./database')
      await logTransaction({
        userAddress: log.userAddress,
        serviceType: log.serviceType,
        tokenType: log.tokenType,
        amount: log.amount,
        serviceDetails: log.serviceDetails,
        txDigest: log.txDigest,
        status: log.status as any,
        error: log.error,
      })
    } catch (error) {
      console.warn('Database logging failed, using in-memory only:', error)
    }
    
    // Log to console for debugging
    console.log('Transaction logged:', transactionLog)
    
    return transactionLog.id
  }

  async getTransactions(): Promise<TransactionLog[]> {
    try {
      // Try to get from database first
      const { getTransactions } = await import('./database')
      const dbTransactions = await getTransactions(100)
      
      // Convert database format to client format
      const dbLogs = dbTransactions.map(tx => ({
        id: tx.id,
        timestamp: tx.createdAt.getTime(),
        userAddress: tx.userAddress,
        serviceType: tx.serviceType as any,
        tokenType: tx.tokenType,
        amount: tx.amount,
        serviceDetails: tx.serviceDetails as any,
        txDigest: tx.txDigest,
        status: tx.status as any,
        error: tx.error || undefined,
        errorCode: undefined,
      }))
      
      // Merge with in-memory logs (avoid duplicates)
      const existingIds = new Set(dbLogs.map(log => log.id))
      const memoryLogs = this.logs.filter(log => !existingIds.has(log.id))
      
      return [...dbLogs, ...memoryLogs].sort((a, b) => b.timestamp - a.timestamp)
    } catch (error) {
      console.warn('Database fetch failed, using in-memory logs:', error)
      return [...this.logs]
    }
  }

  getTransactionsByUser(userAddress: string): TransactionLog[] {
    return this.logs.filter(log => log.userAddress === userAddress)
  }

  getTransactionsByService(serviceType: string): TransactionLog[] {
    return this.logs.filter(log => log.serviceType === serviceType)
  }

  updateTransactionStatus(id: string, status: 'success' | 'failed', error?: string, errorCode?: string) {
    const log = this.logs.find(l => l.id === id)
    if (log) {
      log.status = status
      if (error) log.error = error
      if (errorCode) log.errorCode = errorCode
    }
  }

  private generateId(): string {
    return `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Get statistics
  getStats() {
    const total = this.logs.length
    const successful = this.logs.filter(l => l.status === 'success').length
    const failed = this.logs.filter(l => l.status === 'failed').length
    const pending = this.logs.filter(l => l.status === 'pending').length
    
    const totalVolume = this.logs
      .filter(l => l.status === 'success')
      .reduce((sum, l) => sum + l.amount, 0)

    const serviceBreakdown = this.logs.reduce((acc, log) => {
      acc[log.serviceType] = (acc[log.serviceType] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      total,
      successful,
      failed,
      pending,
      successRate: total > 0 ? (successful / total) * 100 : 0,
      totalVolume,
      serviceBreakdown
    }
  }
}

export const transactionLogger = new TransactionLogger()
