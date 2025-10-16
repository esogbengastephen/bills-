import { supabase, supabaseAdmin, Database } from './supabase'
import { logger } from './logger'

type Transaction = Database['public']['Tables']['transactions']['Row']
type TransactionInsert = Database['public']['Tables']['transactions']['Insert']
type TransactionUpdate = Database['public']['Tables']['transactions']['Update']

type UserActivity = Database['public']['Tables']['user_activities']['Row']
type UserActivityInsert = Database['public']['Tables']['user_activities']['Insert']

type WalletConnection = Database['public']['Tables']['wallet_connections']['Row']
type WalletConnectionInsert = Database['public']['Tables']['wallet_connections']['Insert']
type WalletConnectionUpdate = Database['public']['Tables']['wallet_connections']['Update']

type AdminSetting = Database['public']['Tables']['admin_settings']['Row']
type AdminSettingInsert = Database['public']['Tables']['admin_settings']['Insert']
type AdminSettingUpdate = Database['public']['Tables']['admin_settings']['Update']

export class SupabaseService {
  /**
   * Transaction Operations
   */
  async createTransaction(data: TransactionInsert): Promise<Transaction | null> {
    try {
      const { data: transaction, error } = await supabaseAdmin
        .from('transactions')
        .insert(data)
        .select()
        .single()

      if (error) {
        logger.error('Error creating transaction', { error: error.message, data })
        return null
      }

      logger.info('Transaction created successfully', { transactionId: transaction.id })
      return transaction
    } catch (error: any) {
      logger.error('Error creating transaction', { error: error.message, data })
      return null
    }
  }

  async getTransaction(txDigest: string): Promise<Transaction | null> {
    try {
      const { data: transaction, error } = await supabaseAdmin
        .from('transactions')
        .select('*')
        .eq('tx_digest', txDigest)
        .single()

      if (error) {
        logger.error('Error fetching transaction', { error: error.message, txDigest })
        return null
      }

      return transaction
    } catch (error: any) {
      logger.error('Error fetching transaction', { error: error.message, txDigest })
      return null
    }
  }

  async updateTransaction(txDigest: string, updates: TransactionUpdate): Promise<Transaction | null> {
    try {
      const { data: transaction, error } = await supabaseAdmin
        .from('transactions')
        .update(updates)
        .eq('tx_digest', txDigest)
        .select()
        .single()

      if (error) {
        logger.error('Error updating transaction', { error: error.message, txDigest, updates })
        return null
      }

      logger.info('Transaction updated successfully', { transactionId: transaction.id })
      return transaction
    } catch (error: any) {
      logger.error('Error updating transaction', { error: error.message, txDigest, updates })
      return null
    }
  }

  async getTransactionsByUser(userAddress: string, limit = 50): Promise<Transaction[]> {
    try {
      const { data: transactions, error } = await supabaseAdmin
        .from('transactions')
        .select('*')
        .eq('user_address', userAddress)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        logger.error('Error fetching user transactions', { error: error.message, userAddress })
        return []
      }

      return transactions || []
    } catch (error: any) {
      logger.error('Error fetching user transactions', { error: error.message, userAddress })
      return []
    }
  }

  async getAllTransactions(limit = 100): Promise<Transaction[]> {
    try {
      const { data: transactions, error } = await supabaseAdmin
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        logger.error('Error fetching all transactions', { error: error.message })
        return []
      }

      return transactions || []
    } catch (error: any) {
      logger.error('Error fetching all transactions', { error: error.message })
      return []
    }
  }

  /**
   * User Activity Operations
   */
  async logUserActivity(data: UserActivityInsert): Promise<UserActivity | null> {
    try {
      const { data: activity, error } = await supabaseAdmin
        .from('user_activities')
        .insert(data)
        .select()
        .single()

      if (error) {
        logger.error('Error logging user activity', { error: error.message, data })
        return null
      }

      return activity
    } catch (error: any) {
      logger.error('Error logging user activity', { error: error.message, data })
      return null
    }
  }

  async getUserActivities(userAddress: string, limit = 50): Promise<UserActivity[]> {
    try {
      const { data: activities, error } = await supabaseAdmin
        .from('user_activities')
        .select('*')
        .eq('user_address', userAddress)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        logger.error('Error fetching user activities', { error: error.message, userAddress })
        return []
      }

      return activities || []
    } catch (error: any) {
      logger.error('Error fetching user activities', { error: error.message, userAddress })
      return []
    }
  }

  /**
   * Wallet Connection Operations
   */
  async logWalletConnection(data: WalletConnectionInsert): Promise<WalletConnection | null> {
    try {
      // Check if connection already exists
      const { data: existing } = await supabaseAdmin
        .from('wallet_connections')
        .select('*')
        .eq('user_address', data.user_address)
        .eq('wallet_type', data.wallet_type)
        .single()

      if (existing) {
        // Update existing connection
        const { data: connection, error } = await supabaseAdmin
          .from('wallet_connections')
          .update({
            connection_count: existing.connection_count + 1,
            last_connected_at: new Date().toISOString()
          })
          .eq('id', existing.id)
          .select()
          .single()

        if (error) {
          logger.error('Error updating wallet connection', { error: error.message, data })
          return null
        }

        return connection
      } else {
        // Create new connection
        const { data: connection, error } = await supabaseAdmin
          .from('wallet_connections')
          .insert(data)
          .select()
          .single()

        if (error) {
          logger.error('Error creating wallet connection', { error: error.message, data })
          return null
        }

        return connection
      }
    } catch (error: any) {
      logger.error('Error logging wallet connection', { error: error.message, data })
      return null
    }
  }

  async getWalletConnections(userAddress: string): Promise<WalletConnection[]> {
    try {
      const { data: connections, error } = await supabaseAdmin
        .from('wallet_connections')
        .select('*')
        .eq('user_address', userAddress)
        .order('last_connected_at', { ascending: false })

      if (error) {
        logger.error('Error fetching wallet connections', { error: error.message, userAddress })
        return []
      }

      return connections || []
    } catch (error: any) {
      logger.error('Error fetching wallet connections', { error: error.message, userAddress })
      return []
    }
  }

  /**
   * Admin Settings Operations
   */
  async getAdminSetting(key: string): Promise<AdminSetting | null> {
    try {
      const { data: setting, error } = await supabaseAdmin
        .from('admin_settings')
        .select('*')
        .eq('setting_key', key)
        .single()

      if (error) {
        logger.error('Error fetching admin setting', { error: error.message, key })
        return null
      }

      return setting
    } catch (error: any) {
      logger.error('Error fetching admin setting', { error: error.message, key })
      return null
    }
  }

  async setAdminSetting(key: string, value: any, description?: string): Promise<AdminSetting | null> {
    try {
      const { data: setting, error } = await supabaseAdmin
        .from('admin_settings')
        .upsert({
          setting_key: key,
          setting_value: value,
          description: description
        })
        .select()
        .single()

      if (error) {
        logger.error('Error setting admin setting', { error: error.message, key, value })
        return null
      }

      logger.info('Admin setting updated', { key, value })
      return setting
    } catch (error: any) {
      logger.error('Error setting admin setting', { error: error.message, key, value })
      return null
    }
  }

  async getAllAdminSettings(): Promise<AdminSetting[]> {
    try {
      const { data: settings, error } = await supabaseAdmin
        .from('admin_settings')
        .select('*')
        .order('setting_key')

      if (error) {
        logger.error('Error fetching admin settings', { error: error.message })
        return []
      }

      return settings || []
    } catch (error: any) {
      logger.error('Error fetching admin settings', { error: error.message })
      return []
    }
  }

  /**
   * Analytics Operations
   */
  async getTransactionStats(): Promise<{
    totalTransactions: number
    totalVolume: number
    successRate: number
    averageTransactionValue: number
  }> {
    try {
      const { data: stats, error } = await supabaseAdmin
        .rpc('get_transaction_stats')

      if (error) {
        logger.error('Error fetching transaction stats', { error: error.message })
        return {
          totalTransactions: 0,
          totalVolume: 0,
          successRate: 0,
          averageTransactionValue: 0
        }
      }

      return stats || {
        totalTransactions: 0,
        totalVolume: 0,
        successRate: 0,
        averageTransactionValue: 0
      }
    } catch (error: any) {
      logger.error('Error fetching transaction stats', { error: error.message })
      return {
        totalTransactions: 0,
        totalVolume: 0,
        successRate: 0,
        averageTransactionValue: 0
      }
    }
  }

  /**
   * Health Check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin
        .from('transactions')
        .select('id')
        .limit(1)

      return !error
    } catch (error: any) {
      logger.error('Supabase health check failed', { error: error.message })
      return false
    }
  }
}

// Export singleton instance
export const supabaseService = new SupabaseService()
