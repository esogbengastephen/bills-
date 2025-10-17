import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { transactionId, status, error: errorMessage, clubkonnectOrderId, clubkonnectRequestId } = body

    if (!transactionId || !status) {
      return NextResponse.json(
        { error: 'Transaction ID and status are required' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Update the transaction
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    }

    if (errorMessage) {
      updateData.error = errorMessage
    }

    if (clubkonnectOrderId) {
      updateData.clubkonnect_order_id = clubkonnectOrderId
    }

    if (clubkonnectRequestId) {
      updateData.clubkonnect_request_id = clubkonnectRequestId
    }

    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .update(updateData)
      .eq('id', transactionId)
      .select()
      .single()

    if (transactionError) {
      console.error('Error updating transaction:', transactionError)
      return NextResponse.json(
        { error: 'Failed to update transaction' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      transaction
    })

  } catch (error) {
    console.error('Error in update transaction API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const transactionId = request.nextUrl.searchParams.get('id')

    if (!transactionId) {
      return NextResponse.json(
        { error: 'Transaction ID is required' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Get the transaction
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .single()

    if (transactionError) {
      console.error('Error fetching transaction:', transactionError)
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      transaction
    })

  } catch (error) {
    console.error('Error in get transaction API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
