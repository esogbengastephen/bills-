import { NextRequest, NextResponse } from 'next/server'
import { supabaseService } from '@/lib/supabase-service'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    // Test Supabase connection
    const isHealthy = await supabaseService.healthCheck()
    
    if (!isHealthy) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Supabase connection failed',
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      )
    }

    // Test basic operations
    const settings = await supabaseService.getAllAdminSettings()
    const stats = await supabaseService.getTransactionStats()

    logger.info('Supabase connection test successful', {
      settingsCount: settings.length,
      stats
    })

    return NextResponse.json({
      success: true,
      message: 'Supabase connection successful',
      data: {
        health: 'OK',
        settingsCount: settings.length,
        stats,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error: any) {
    logger.error('Supabase connection test failed', { error: error.message })
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Supabase connection test failed',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, ...data } = body

    switch (action) {
      case 'test-transaction':
        // Test creating a transaction
        const testTransaction = await supabaseService.createTransaction({
          user_address: data.userAddress || 'test-user',
          service_type: 'test',
          token_type: 'SUI',
          amount: 0.001,
          service_details: { test: true },
          tx_digest: `test-${Date.now()}`,
          status: 'success'
        })

        if (!testTransaction) {
          return NextResponse.json(
            { success: false, error: 'Failed to create test transaction' },
            { status: 400 }
          )
        }

        return NextResponse.json({
          success: true,
          message: 'Test transaction created successfully',
          data: testTransaction
        })

      case 'test-activity':
        // Test logging user activity
        const testActivity = await supabaseService.logUserActivity({
          user_address: data.userAddress || 'test-user',
          activity_type: 'test',
          activity_data: { test: true }
        })

        if (!testActivity) {
          return NextResponse.json(
            { success: false, error: 'Failed to log test activity' },
            { status: 400 }
          )
        }

        return NextResponse.json({
          success: true,
          message: 'Test activity logged successfully',
          data: testActivity
        })

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        )
    }

  } catch (error: any) {
    logger.error('Supabase test operation failed', { error: error.message })
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Supabase test operation failed'
      },
      { status: 500 }
    )
  }
}
