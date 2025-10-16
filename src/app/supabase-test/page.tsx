import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export default async function SupabaseTestPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  // Test connection by trying to fetch from transactions table
  const { data: transactions, error } = await supabase
    .from('transactions')
    .select('*')
    .limit(5)

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
            Supabase Connection Test
          </h1>
          
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-red-800 dark:text-red-200 mb-4">
              ❌ Connection Failed
            </h2>
            <p className="text-red-700 dark:text-red-300 mb-4">
              Error: {error.message}
            </p>
            <div className="bg-red-100 dark:bg-red-900/40 p-4 rounded">
              <p className="text-sm text-red-800 dark:text-red-200">
                <strong>Possible solutions:</strong>
              </p>
              <ul className="list-disc list-inside text-sm text-red-700 dark:text-red-300 mt-2">
                <li>Make sure you've run the SQL schema in Supabase</li>
                <li>Check that your environment variables are correct</li>
                <li>Verify the tables exist in your Supabase project</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Supabase Connection Test
        </h1>
        
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-green-800 dark:text-green-200 mb-4">
            ✅ Connection Successful!
          </h2>
          <p className="text-green-700 dark:text-green-300">
            Supabase is connected and working properly.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Transactions Table Test
          </h2>
          
          {transactions && transactions.length > 0 ? (
            <div>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Found {transactions.length} transactions:
              </p>
              <div className="space-y-4">
                {transactions.map((tx: any) => (
                  <div key={tx.id} className="border border-gray-200 dark:border-gray-700 rounded p-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-900 dark:text-white">ID:</span>
                        <span className="text-gray-600 dark:text-gray-400 ml-2">{tx.id}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-900 dark:text-white">User:</span>
                        <span className="text-gray-600 dark:text-gray-400 ml-2">{tx.user_address}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-900 dark:text-white">Service:</span>
                        <span className="text-gray-600 dark:text-gray-400 ml-2">{tx.service_type}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-900 dark:text-white">Amount:</span>
                        <span className="text-gray-600 dark:text-gray-400 ml-2">{tx.amount} {tx.token_type}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-900 dark:text-white">Status:</span>
                        <span className="text-gray-600 dark:text-gray-400 ml-2">{tx.status}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-900 dark:text-white">Created:</span>
                        <span className="text-gray-600 dark:text-gray-400 ml-2">
                          {new Date(tx.created_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                No transactions found. This is normal for a new database.
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Try making a transaction in your app to see data here.
              </p>
            </div>
          )}
        </div>

        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">
            Next Steps:
          </h2>
          <ul className="list-disc list-inside text-blue-700 dark:text-blue-300 space-y-1">
            <li>Go to your Supabase dashboard to view the data</li>
            <li>Test creating transactions in your app</li>
            <li>Check the admin dashboard for analytics</li>
            <li>Set up Row Level Security policies if needed</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
