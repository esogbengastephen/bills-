import { NextResponse } from 'next/server'
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client'

export async function GET() {
  try {
    // Debug: Log environment variables
    console.log('Environment variables:', {
      packageId: process.env.NEXT_PUBLIC_CONTRACT_PACKAGE_ID,
      contractId: process.env.NEXT_PUBLIC_CONTRACT_OBJECT_ID,
      adminCapId: process.env.NEXT_PUBLIC_ADMIN_CAP_ID,
      upgradeCapId: process.env.NEXT_PUBLIC_UPGRADE_CAP_ID,
    })

    const suiClient = new SuiClient({ 
      url: getFullnodeUrl(process.env.NEXT_PUBLIC_SUI_NETWORK as any || 'testnet') 
    })

    // Use hardcoded contract configuration (latest deployed shared contract)
    const contractConfig = {
      packageId: '0x05504afc763907fb831e1da34373813205490e5ed03a96f8b8c0bfe70667f8b3',
      contractId: '0xcf56c97f73a0305239723d77fb8a01ba405abe677099b2531be1c11e61cfbfd7',
      adminCapId: '0x5e11dbbdd053494f49e6febbada888483ead02e3092e31d7a1661b2d792cfdda',
      upgradeCapId: '0xcf71e5f0ba59036b3ec9ccaea0f70a718304679516ea562815db1210137ac69c',
    }

    // Check if contract object exists and get its details
    const contractObject = await suiClient.getObject({
      id: contractConfig.contractId,
      options: {
        showContent: true,
        showType: true,
      },
    })

    if (!contractObject.data?.content || contractObject.data.content.dataType !== 'moveObject') {
      throw new Error('Contract object not found or invalid')
    }

    const fields = (contractObject.data.content as any).fields
    const hasUserId = fields.clubkonnect_user_id && fields.clubkonnect_user_id.length > 0
    const hasApiKey = fields.clubkonnect_api_key && fields.clubkonnect_api_key.length > 0
    const hasApiUrl = fields.clubkonnect_api_url && fields.clubkonnect_api_url.length > 0

    return NextResponse.json({
      success: true,
      contractConfig: {
        packageId: contractConfig.packageId,
        contractId: contractConfig.contractId,
        adminCapId: contractConfig.adminCapId,
        upgradeCapId: contractConfig.upgradeCapId,
      },
      contractDetails: {
        objectType: contractObject.data.type,
        owner: contractObject.data.owner,
        version: contractObject.data.version,
        digest: contractObject.data.digest,
      },
      credentials: {
        hasCredentials: hasUserId && hasApiKey && hasApiUrl,
        userId: fields.clubkonnect_user_id,
        apiKey: fields.clubkonnect_api_key ? '***SET***' : 'NOT_SET',
        apiUrl: fields.clubkonnect_api_url,
      },
      treasury: {
        balance: fields.treasury_balance,
        totalTransactions: fields.total_transactions,
        totalVolume: fields.total_volume,
      }
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to check contract configuration',
      details: error instanceof Error ? error.message : 'Unknown error',
      contractConfig: {
        packageId: process.env.NEXT_PUBLIC_CONTRACT_PACKAGE_ID,
        contractId: process.env.NEXT_PUBLIC_CONTRACT_OBJECT_ID,
        adminCapId: process.env.NEXT_PUBLIC_ADMIN_CAP_ID,
        upgradeCapId: process.env.NEXT_PUBLIC_UPGRADE_CAP_ID,
      }
    })
  }
}
