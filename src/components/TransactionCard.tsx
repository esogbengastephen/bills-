interface Transaction {
  id: string
  type: 'airtime' | 'data' | 'electricity' | 'tv'
  title: string
  description: string
  amount: number
  date: string
  status: 'success' | 'pending' | 'failed'
}

interface TransactionCardProps {
  transaction: Transaction
}

const getTransactionIcon = (type: string) => {
  switch (type) {
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

const getStatusColor = (status: string) => {
  switch (status) {
    case 'success':
      return 'text-green-500'
    case 'pending':
      return 'text-yellow-500'
    case 'failed':
      return 'text-red-500'
    default:
      return 'text-gray-500'
  }
}

export default function TransactionCard({ transaction }: TransactionCardProps) {
  return (
    <div className="transaction-card">
      <div className="flex items-center">
        <div className="p-2 mr-3">
          <span className="material-icons text-gray-600 dark:text-gray-400 text-xl">
            {getTransactionIcon(transaction.type)}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 dark:text-gray-100 truncate text-sm">
            {transaction.title}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
            {transaction.description}
          </p>
        </div>
      </div>
      <div className="text-right flex-shrink-0 ml-2">
        <p className={`font-medium text-sm ${getStatusColor(transaction.status)}`}>
          {transaction.amount > 0 ? '+' : ''}${Math.abs(transaction.amount).toFixed(2)}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {transaction.date}
        </p>
      </div>
    </div>
  )
}
