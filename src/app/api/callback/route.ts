import { NextRequest, NextResponse } from 'next/server'
import { createBillPaymentContract } from '@/lib/bill-payment-contract'
import { getSuiClient } from '@/lib/sui'
import * as database from '@/lib/database'
import { logger } from '@/lib/logger'

/**
 * ClubKonnect Callback Endpoint
 * 
 * Receives webhooks from ClubKonnect API when transactions complete.
 * Automatically confirms or refunds payments based on ClubKonnect status.
 * 
 * Expected ClubKonnect Callback Format:
 * {
 *   "orderid": "string",
 *   "statuscode": "100" | "200" | "400",
 *   "status": "ORDER_RECEIVED" | "ORDER_COMPLETED" | "FAILED",
 *   "requestid": "string",
 *   "remark": "string",
 *   "mobilenetwork": "string",
 *   "mobilenumber": "string",
 *   "amountcharged": "string",
 *   "walletbalance": "string"
 * }
 */

interface ClubKonnectCallback {
  orderid?: string
  statuscode: string
  status: string
  requestid?: string
  remark?: string
  mobilenetwork?: string
  mobilenumber?: string
  amountcharged?: string
  walletbalance?: string
}

// Success status codes from ClubKonnect
const SUCCESS_STATUS_CODES = ['100', '200']
const SUCCESS_STATUSES = ['ORDER_RECEIVED', 'ORDER_COMPLETED', 'DELIVERED']

// Admin wallet private key or mnemonic (for automated confirms/refunds)
// In production, use secure key management (e.g., AWS KMS, HashiCorp Vault)
const ADMIN_WALLET_PRIVATE_KEY = process.env.ADMIN_WALLET_PRIVATE_KEY
const AUTO_CONFIRM_ENABLED = process.env.AUTO_CONFIRM_PAYMENTS === 'true'

export async function POST(request: NextRequest) {
  try {
    const body: ClubKonnectCallback = await request.json()
    
    logger.info('📞 Received ClubKonnect callback', {
      orderid: body.orderid,
      status: body.status,
      statuscode: body.statuscode,
      requestid: body.requestid
    })

    // Validate required fields
    if (!body.orderid && !body.requestid) {
      logger.warn('Invalid callback: missing orderid and requestid')
      return NextResponse.json(
        { success: false, error: 'Missing orderid or requestid' },
        { status: 400 }
      )
    }

    // Determine if transaction was successful
    const isSuccess = 
      SUCCESS_STATUS_CODES.includes(body.statuscode) ||
      SUCCESS_STATUSES.includes(body.status.toUpperCase())

    const transactionId = body.requestid || body.orderid || 'unknown'

    logger.info(`ClubKonnect callback result: ${isSuccess ? '✅ SUCCESS' : '❌ FAILED'}`, {
      transactionId,
      status: body.status,
      statuscode: body.statuscode
    })

    // Update database transaction status
    if (database.isDatabaseAvailable()) {
      try {
        await database.updateTransactionStatus(
          transactionId,
          body.remark || `ClubKonnect status: ${body.status}`,
          isSuccess ? 'SUCCESS' : 'FAILED'
        )
        logger.info('✅ Database transaction status updated', { transactionId })
      } catch (dbError) {
        logger.error('Failed to update database transaction', {
          transactionId,
          error: dbError
        })
      }
    }

    // Handle automated confirm/refund (if enabled)
    if (AUTO_CONFIRM_ENABLED && ADMIN_WALLET_PRIVATE_KEY) {
      logger.info('🤖 Auto-processing payment...', { transactionId, isSuccess })
      
      try {
        // Get transaction details from database to find pending payment ID
        const transactions = database.isDatabaseAvailable() 
          ? await database.getTransactions(10, 0)
          : []
        
        const transaction = transactions.find(tx => 
          tx.id === transactionId || 
          tx.clubkonnect_order_id === body.orderid
        )

        if (!transaction || !transaction.sui_pending_payment_id) {
          logger.warn('⚠️  Cannot auto-process: transaction or pending payment ID not found', {
            transactionId
          })
          return NextResponse.json({
            success: true,
            message: 'Callback received but manual processing required',
            action: 'manual'
          })
        }

        // Initialize contract SDK
        const suiClient = getSuiClient()
        const contract = createBillPaymentContract(suiClient, {
          packageId: process.env.NEXT_PUBLIC_CONTRACT_PACKAGE_ID || '',
          contractId: process.env.NEXT_PUBLIC_CONTRACT_OBJECT_ID || '',
          adminCapId: process.env.NEXT_PUBLIC_ADMIN_CAP_ID || '',
          upgradeCapId: process.env.NEXT_PUBLIC_UPGRADE_CAP_ID || ''
        })

        // Determine coin type (default to SUI)
        const coinType = transaction.token_type || '0x2::sui::SUI'

        // NOTE: Automated signing requires admin wallet integration
        // For now, we'll log the action and require manual confirmation
        logger.warn('⚠️  Automated signing not implemented - manual action required', {
          transactionId,
          action: isSuccess ? 'confirm' : 'refund',
          pendingPaymentId: transaction.sui_pending_payment_id,
          coinType
        })

        // TODO: Implement automated signing with admin wallet
        // This would require:
        // 1. Admin wallet private key/mnemonic
        // 2. Proper key management (secure vault)
        // 3. Signing transactions programmatically
        //
        // Example implementation:
        // const adminKeypair = Ed25519Keypair.fromSecretKey(...)
        // const signAndExecute = async (tx) => {
        //   return await suiClient.signAndExecuteTransactionBlock({
        //     transactionBlock: tx,
        //     signer: adminKeypair,
        //   })
        // }
        //
        // if (isSuccess) {
        //   await contract.confirmPayment(
        //     transaction.sui_pending_payment_id,
        //     coinType,
        //     signAndExecute
        //   )
        // } else {
        //   await contract.refundPayment(
        //     transaction.sui_pending_payment_id,
        //     coinType,
        //     body.remark || 'ClubKonnect service failed',
        //     signAndExecute
        //   )
        // }

        return NextResponse.json({
          success: true,
          message: 'Callback processed - manual confirmation required in admin dashboard',
          transaction_id: transactionId,
          pending_payment_id: transaction.sui_pending_payment_id,
          action: isSuccess ? 'confirm' : 'refund',
          requires_manual_action: true
        })

      } catch (error: any) {
        logger.error('Error in auto-processing callback', {
          transactionId,
          error: error.message
        })
        
        return NextResponse.json({
          success: true,
          message: 'Callback received but auto-processing failed',
          error: error.message,
          requires_manual_action: true
        })
      }
    }

    // Manual processing required
    logger.info('📝 Manual processing required in admin dashboard', { transactionId })
    
    return NextResponse.json({
      success: true,
      message: 'Callback received successfully',
      transaction_id: transactionId,
      status: isSuccess ? 'success' : 'failed',
      action: isSuccess ? 'confirm_pending' : 'refund_pending',
      requires_manual_action: true
    })

  } catch (error: any) {
    logger.error('Error processing ClubKonnect callback', {
      error: error.message,
      stack: error.stack
    })

    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error processing callback',
        message: error.message 
      },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint for testing callback setup
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const test = searchParams.get('test')

  if (test === 'true') {
    return NextResponse.json({
      success: true,
      message: 'ClubKonnect callback endpoint is active',
      endpoint: `${process.env.NEXT_PUBLIC_APP_URL}/api/callback`,
      auto_confirm_enabled: AUTO_CONFIRM_ENABLED,
      features: {
        database_logging: database.isDatabaseAvailable(),
        auto_processing: AUTO_CONFIRM_ENABLED && !!ADMIN_WALLET_PRIVATE_KEY,
        manual_processing: true
      }
    })
  }

  return NextResponse.json({
    success: false,
    error: 'Method not allowed. Use POST for ClubKonnect callbacks.'
  }, { status: 405 })
}

