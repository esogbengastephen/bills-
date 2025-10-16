import { NextRequest, NextResponse } from 'next/server'
import { 
  suiClient, 
  getAllTokenBalances, 
  getTokenBalance, 
  createTransferTransaction,
  estimateTransactionGas,
  getTransactionDetails,
  isValidSuiAddress,
  SUI_TOKEN_ADDRESSES,
  SUI_TOKEN_METADATA
} from '@/lib/sui'

// Get token balances for an address
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get('address')
    const tokenType = searchParams.get('tokenType')

    if (!address) {
      return NextResponse.json({ error: 'Address is required' }, { status: 400 })
    }

    if (!isValidSuiAddress(address)) {
      return NextResponse.json({ error: 'Invalid Sui address' }, { status: 400 })
    }

    if (tokenType) {
      // Get specific token balance
      const balance = await getTokenBalance(address, tokenType)
      return NextResponse.json({ balance, tokenType })
    } else {
      // Get all token balances
      const balances = await getAllTokenBalances(address)
      return NextResponse.json({ balances, address })
    }
  } catch (error) {
    console.error('Error fetching balances:', error)
    return NextResponse.json(
      { error: 'Failed to fetch token balances' },
      { status: 500 }
    )
  }
}

// Create a transfer transaction
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      sender, 
      recipient, 
      amount, 
      tokenType,
      estimateGas = false 
    } = body

    // Validate required fields
    if (!sender || !recipient || !amount || !tokenType) {
      return NextResponse.json(
        { error: 'Missing required fields: sender, recipient, amount, tokenType' },
        { status: 400 }
      )
    }

    // Validate addresses
    if (!isValidSuiAddress(sender) || !isValidSuiAddress(recipient)) {
      return NextResponse.json(
        { error: 'Invalid Sui address' },
        { status: 400 }
      )
    }

    // Validate amount
    const amountNum = parseFloat(amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      )
    }

    // Create transaction
    const txb = createTransferTransaction(recipient, amount, tokenType, sender)

    if (estimateGas) {
      // Estimate gas cost
      const gasEstimate = await estimateTransactionGas(txb, sender)
      return NextResponse.json({ 
        gasEstimate,
        transaction: await txb.build({ client: suiClient })
      })
    }

    // Return transaction for signing
    const transaction = await txb.build({ client: suiClient })
    
    return NextResponse.json({ 
      transaction,
      message: 'Transaction created successfully. Sign and execute to complete the transfer.'
    })
  } catch (error) {
    console.error('Error creating transaction:', error)
    return NextResponse.json(
      { error: 'Failed to create transaction' },
      { status: 500 }
    )
  }
}

// Get transaction details
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { txDigest } = body

    if (!txDigest) {
      return NextResponse.json(
        { error: 'Transaction digest is required' },
        { status: 400 }
      )
    }

    const txDetails = await getTransactionDetails(txDigest)
    
    if (!txDetails) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ transaction: txDetails })
  } catch (error) {
    console.error('Error fetching transaction details:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transaction details' },
      { status: 500 }
    )
  }
}
