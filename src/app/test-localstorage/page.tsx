'use client'

import { useEffect, useState } from 'react'

export default function TestLocalStorage() {
  const [userData, setUserData] = useState(null)
  const [pendingData, setPendingData] = useState(null)

  useEffect(() => {
    const user = localStorage.getItem('user')
    const pending = localStorage.getItem('pendingVerification')
    
    setUserData(user ? JSON.parse(user) : null)
    setPendingData(pending ? JSON.parse(pending) : null)
  }, [])

  const clearAll = () => {
    localStorage.removeItem('user')
    localStorage.removeItem('pendingVerification')
    setUserData(null)
    setPendingData(null)
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">LocalStorage Debug</h1>
      
      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">User Data:</h2>
        <pre className="bg-gray-100 p-4 rounded">
          {userData ? JSON.stringify(userData, null, 2) : 'No user data'}
        </pre>
      </div>

      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">Pending Verification:</h2>
        <pre className="bg-gray-100 p-4 rounded">
          {pendingData ? JSON.stringify(pendingData, null, 2) : 'No pending data'}
        </pre>
      </div>

      <button 
        onClick={clearAll}
        className="bg-red-500 text-white px-4 py-2 rounded"
      >
        Clear All Data
      </button>
    </div>
  )
}
