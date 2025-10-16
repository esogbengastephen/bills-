// src/lib/clubkonnect-errors.ts

export interface ClubKonnectError {
  code: string
  message: string
  userFriendlyMessage: string
  isRetryable: boolean
  category: 'balance' | 'network' | 'validation' | 'system' | 'unknown'
}

export const CLUBKONNECT_ERROR_MAP: Record<string, ClubKonnectError> = {
  // Balance-related errors
  'INSUFFICIENT_BALANCE': {
    code: 'INSUFFICIENT_BALANCE',
    message: 'Insufficient balance in ClubKonnect account',
    userFriendlyMessage: 'Service temporarily unavailable. Please try again later.',
    isRetryable: false,
    category: 'balance'
  },
  'LOW_BALANCE': {
    code: 'LOW_BALANCE',
    message: 'Low balance in ClubKonnect account',
    userFriendlyMessage: 'Service temporarily unavailable. Please try again later.',
    isRetryable: false,
    category: 'balance'
  },

  // Network-related errors
  'NETWORK_ERROR': {
    code: 'NETWORK_ERROR',
    message: 'Network connection error',
    userFriendlyMessage: 'Network error. Please check your connection and try again.',
    isRetryable: true,
    category: 'network'
  },
  'TIMEOUT': {
    code: 'TIMEOUT',
    message: 'Request timeout',
    userFriendlyMessage: 'Request timed out. Please try again.',
    isRetryable: true,
    category: 'network'
  },
  'SERVICE_UNAVAILABLE': {
    code: 'SERVICE_UNAVAILABLE',
    message: 'Service temporarily unavailable',
    userFriendlyMessage: 'Service temporarily unavailable. Please try again in a few minutes.',
    isRetryable: true,
    category: 'network'
  },

  // Validation errors
  'INVALID_PHONE_NUMBER': {
    code: 'INVALID_PHONE_NUMBER',
    message: 'Invalid phone number format',
    userFriendlyMessage: 'Please enter a valid phone number.',
    isRetryable: false,
    category: 'validation'
  },
  'INVALID_AMOUNT': {
    code: 'INVALID_AMOUNT',
    message: 'Invalid amount specified',
    userFriendlyMessage: 'Please enter a valid amount.',
    isRetryable: false,
    category: 'validation'
  },
  'INVALID_SERVICE': {
    code: 'INVALID_SERVICE',
    message: 'Invalid service ID',
    userFriendlyMessage: 'Invalid service selected. Please refresh and try again.',
    isRetryable: false,
    category: 'validation'
  },
  'INVALID_DATAPLAN': {
    code: 'INVALID_DATAPLAN',
    message: 'Invalid data plan selected',
    userFriendlyMessage: 'Invalid data plan. Please select a different plan.',
    isRetryable: false,
    category: 'validation'
  },
  'MISSING_DATAPLAN': {
    code: 'MISSING_DATAPLAN',
    message: 'Data plan not specified',
    userFriendlyMessage: 'Please select a data plan.',
    isRetryable: false,
    category: 'validation'
  },

  // System errors
  'INTERNAL_ERROR': {
    code: 'INTERNAL_ERROR',
    message: 'Internal server error',
    userFriendlyMessage: 'An unexpected error occurred. Please try again.',
    isRetryable: true,
    category: 'system'
  },
  'API_ERROR': {
    code: 'API_ERROR',
    message: 'API error occurred',
    userFriendlyMessage: 'Service error. Please try again.',
    isRetryable: true,
    category: 'system'
  },
  'AUTHENTICATION_FAILED': {
    code: 'AUTHENTICATION_FAILED',
    message: 'Authentication failed',
    userFriendlyMessage: 'Authentication error. Please contact support.',
    isRetryable: false,
    category: 'system'
  },
  'RATE_LIMITED': {
    code: 'RATE_LIMITED',
    message: 'Rate limit exceeded',
    userFriendlyMessage: 'Too many requests. Please wait a moment and try again.',
    isRetryable: true,
    category: 'system'
  }
}

export function mapClubKonnectError(errorStatus: string, errorMessage?: string): ClubKonnectError {
  const normalizedStatus = (errorStatus || '').toUpperCase().trim()
  
  // Direct match
  if (CLUBKONNECT_ERROR_MAP[normalizedStatus]) {
    return CLUBKONNECT_ERROR_MAP[normalizedStatus]
  }

  // Partial matches for common patterns
  if (normalizedStatus.includes('INSUFFICIENT') || normalizedStatus.includes('BALANCE')) {
    return CLUBKONNECT_ERROR_MAP['INSUFFICIENT_BALANCE']
  }

  if (normalizedStatus.includes('INVALID') && normalizedStatus.includes('PHONE')) {
    return CLUBKONNECT_ERROR_MAP['INVALID_PHONE_NUMBER']
  }

  if (normalizedStatus.includes('INVALID') && normalizedStatus.includes('AMOUNT')) {
    return CLUBKONNECT_ERROR_MAP['INVALID_AMOUNT']
  }

  if (normalizedStatus.includes('INVALID') && normalizedStatus.includes('SERVICE')) {
    return CLUBKONNECT_ERROR_MAP['INVALID_SERVICE']
  }

  if (normalizedStatus.includes('NETWORK') || normalizedStatus.includes('CONNECTION')) {
    return CLUBKONNECT_ERROR_MAP['NETWORK_ERROR']
  }

  if (normalizedStatus.includes('TIMEOUT')) {
    return CLUBKONNECT_ERROR_MAP['TIMEOUT']
  }

  if (normalizedStatus.includes('UNAVAILABLE')) {
    return CLUBKONNECT_ERROR_MAP['SERVICE_UNAVAILABLE']
  }

  if (normalizedStatus.includes('RATE') || normalizedStatus.includes('LIMIT')) {
    return CLUBKONNECT_ERROR_MAP['RATE_LIMITED']
  }

  // Default fallback
  return {
    code: normalizedStatus || 'UNKNOWN_ERROR',
    message: errorMessage || 'Unknown error occurred',
    userFriendlyMessage: 'An unexpected error occurred. Please try again.',
    isRetryable: true,
    category: 'unknown'
  }
}

export function isRetryableError(errorStatus: string): boolean {
  const mappedError = mapClubKonnectError(errorStatus)
  return mappedError.isRetryable
}

export function getUserFriendlyMessage(errorStatus: string, errorMessage?: string): string {
  const mappedError = mapClubKonnectError(errorStatus, errorMessage)
  return mappedError.userFriendlyMessage
}
