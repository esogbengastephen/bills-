// TypeScript declarations for Sui Wallet Extension

interface SuiWallet {
  getAccounts(): Promise<string[]>
  requestPermissions(): Promise<string[]>
  hasPermissions(): Promise<boolean>
  executeMoveCall(params: {
    packageObjectId: string
    module: string
    function: string
    typeArguments?: string[]
    arguments?: any[]
    gasBudget?: number
  }): Promise<any>
  signAndExecuteTransaction(params: {
    transaction: any
    options?: any
  }): Promise<any>
  getBalance(params: {
    coinType?: string
  }): Promise<any>
  getCoins(params: {
    coinType?: string
  }): Promise<any>
  getOwnedObjects(params?: {
    filter?: any
    options?: any
  }): Promise<any>
  getTransactionBlock(params: {
    digest: string
  }): Promise<any>
  getTransactionBlocks(params?: {
    filter?: any
    options?: any
  }): Promise<any>
  signMessage(params: {
    message: string | Uint8Array
  }): Promise<any>
  requestPermissions(): Promise<string[]>
  disconnect(): Promise<void>
}

declare global {
  interface Window {
    suiWallet?: SuiWallet
    sui?: SuiWallet
  }
}

export {}
