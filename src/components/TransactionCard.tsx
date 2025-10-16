interface Transaction {
  id: string
  user_address: string
  service_type: string
  token_type: string
  amount: number
  service_details: any
  tx_digest: string
  status: string
  created_at: string
  updated_at: string
}

interface TransactionCardProps {
  transaction: Transaction
}

const getTransactionIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case 'airtime':
      return 'phone_iphone'
    case 'data':
      return 'wifi'
    case 'electricity':
      return 'lightbulb'
    case 'tv':
      return 'tv'
    default:
      return 'receipt'
  }
}

const getServiceDisplayName = (serviceType: string) => {
  switch (serviceType.toLowerCase()) {
    case 'airtime':
      return 'Airtime Purchase'
    case 'data':
      return 'Data Purchase'
    case 'electricity':
      return 'Electricity Bill'
    case 'tv':
      return 'TV Subscription'
    default:
      return 'Payment'
  }
}

const formatServiceDetails = (serviceType: string, serviceDetails: any) => {
  try {
    const details = typeof serviceDetails === 'string' ? JSON.parse(serviceDetails) : serviceDetails
    
    switch (serviceType.toLowerCase()) {
      case 'airtime':
        return `${details.network || 'Unknown'} - ${details.phoneNumber || 'N/A'}`
      case 'data':
        return `${details.network || 'Unknown'} - ${details.dataPlan || 'N/A'}`
      case 'electricity':
        return `Meter #${details.meterNumber || 'N/A'}`
      case 'tv':
        return `${details.provider || 'Unknown'} - ${details.plan || 'N/A'}`
      default:
        return 'Payment Details'
    }
  } catch {
    return 'Payment Details'
  }
}

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'success':
    case 'confirmed':
      return 'text-green-500'
    case 'pending':
      return 'text-yellow-500'
    case 'failed':
    case 'refunded':
      return 'text-red-500'
    default:
      return 'text-gray-500'
  }
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 1) {
    return 'Today'
  } else if (diffDays === 2) {
    return 'Yesterday'
  } else if (diffDays <= 7) {
    return `${diffDays - 1} days ago`
  } else {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    })
  }
}

export default function TransactionCard({ transaction }: TransactionCardProps) {
  return (
    <div className="transaction-card">
      <div className="flex items-center">
        <div className="p-2 mr-3">
          <span className="material-icons text-gray-600 dark:text-gray-400 text-xl">
            {getTransactionIcon(transaction.service_type)}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 dark:text-gray-100 truncate text-sm">
            {getServiceDisplayName(transaction.service_type)}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
            {formatServiceDetails(transaction.service_type, transaction.service_details)}
          </p>
        </div>
      </div>
      <div className="text-right flex-shrink-0 ml-2">
        <p className={`font-medium text-sm ${getStatusColor(transaction.status)}`}>
          {transaction.amount.toFixed(2)} {transaction.token_type}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {formatDate(transaction.created_at)}
        </p>
      </div>
    </div>
  )
}
