'use client'

import { useState } from 'react'

interface ServiceCardProps {
  icon: string
  title: string
  onClick: () => void
}

export default function ServiceCard({ icon, title, onClick }: ServiceCardProps) {
  const [isPressed, setIsPressed] = useState(false)

  return (
    <button
      className={`
        service-card
        ${isPressed ? 'scale-95' : 'hover:scale-105'}
        focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
        dark:focus:ring-offset-gray-900
      `}
      onClick={onClick}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      aria-label={`${title} service`}
    >
      <span className="material-icons text-gray-600 dark:text-gray-400 mb-2 text-3xl">
        {icon}
      </span>
      <h2 className="font-medium text-sm text-gray-900 dark:text-gray-100">
        {title}
      </h2>
    </button>
  )
}
