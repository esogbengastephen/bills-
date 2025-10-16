// src/lib/logger.ts

interface LogLevel {
  ERROR: 'error'
  WARN: 'warn'
  INFO: 'info'
  DEBUG: 'debug'
}

const LOG_LEVELS: LogLevel = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug'
}

interface LogEntry {
  timestamp: string
  level: string
  message: string
  context?: Record<string, any>
  userId?: string
  transactionId?: string
  service?: string
}

class Logger {
  private redactSensitiveData(data: any): any {
    if (typeof data === 'string') {
      // Redact API keys, passwords, and other sensitive strings
      return data
        .replace(/api[_-]?key["\s]*[:=]["\s]*[a-zA-Z0-9_-]+/gi, 'api_key: [REDACTED]')
        .replace(/password["\s]*[:=]["\s]*[^\s]+/gi, 'password: [REDACTED]')
        .replace(/token["\s]*[:=]["\s]*[a-zA-Z0-9_-]+/gi, 'token: [REDACTED]')
        .replace(/secret["\s]*[:=]["\s]*[a-zA-Z0-9_-]+/gi, 'secret: [REDACTED]')
        .replace(/key["\s]*[:=]["\s]*[a-zA-Z0-9_-]+/gi, 'key: [REDACTED]')
    }

    if (typeof data === 'object' && data !== null) {
      const redacted = { ...data }
      
      // Redact sensitive fields
      const sensitiveFields = ['apiKey', 'api_key', 'password', 'token', 'secret', 'key', 'userId', 'user_id']
      sensitiveFields.forEach(field => {
        if (redacted[field]) {
          redacted[field] = '[REDACTED]'
        }
      })

      // Recursively redact nested objects
      Object.keys(redacted).forEach(key => {
        if (typeof redacted[key] === 'object' && redacted[key] !== null) {
          redacted[key] = this.redactSensitiveData(redacted[key])
        }
      })

      return redacted
    }

    return data
  }

  private formatLogEntry(level: string, message: string, context?: Record<string, any>): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: context ? this.redactSensitiveData(context) : undefined
    }
  }

  private writeLog(entry: LogEntry) {
    const logString = JSON.stringify(entry)
    
    // Write to console with appropriate level
    switch (entry.level) {
      case LOG_LEVELS.ERROR:
        console.error(logString)
        break
      case LOG_LEVELS.WARN:
        console.warn(logString)
        break
      case LOG_LEVELS.INFO:
        console.info(logString)
        break
      case LOG_LEVELS.DEBUG:
        console.debug(logString)
        break
      default:
        console.log(logString)
    }
  }

  error(message: string, context?: Record<string, any>) {
    this.writeLog(this.formatLogEntry(LOG_LEVELS.ERROR, message, context))
  }

  warn(message: string, context?: Record<string, any>) {
    this.writeLog(this.formatLogEntry(LOG_LEVELS.WARN, message, context))
  }

  info(message: string, context?: Record<string, any>) {
    this.writeLog(this.formatLogEntry(LOG_LEVELS.INFO, message, context))
  }

  debug(message: string, context?: Record<string, any>) {
    this.writeLog(this.formatLogEntry(LOG_LEVELS.DEBUG, message, context))
  }

  // Service-specific logging methods
  logTransaction(userId: string, transactionId: string, service: string, action: string, context?: Record<string, any>) {
    this.info(`Transaction ${action}`, {
      userId,
      transactionId,
      service,
      action,
      ...context
    })
  }

  logApiCall(endpoint: string, method: string, statusCode: number, responseTime: number, context?: Record<string, any>) {
    this.info(`API call ${method} ${endpoint}`, {
      endpoint,
      method,
      statusCode,
      responseTime,
      ...context
    })
  }

  logWalletConnection(userId: string, walletAddress: string, action: 'connect' | 'disconnect') {
    this.info(`Wallet ${action}`, {
      userId,
      walletAddress,
      action
    })
  }

  logServicePurchase(userId: string, service: string, amount: number, tokenType: string, status: 'success' | 'failed', error?: string) {
    this.info(`Service purchase ${status}`, {
      userId,
      service,
      amount,
      tokenType,
      status,
      error
    })
  }

  logContractInteraction(contractId: string, functionName: string, userId: string, status: 'success' | 'failed', error?: string) {
    this.info(`Contract interaction ${status}`, {
      contractId,
      functionName,
      userId,
      status,
      error
    })
  }
}

export const logger = new Logger()
export { LOG_LEVELS }
