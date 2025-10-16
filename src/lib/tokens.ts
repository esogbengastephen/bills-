import { SUI_TOKEN_METADATA } from './sui'

export interface Token {
  symbol: string
  name: string
  balance: string
  icon: string
}

export const SUI_TOKENS: Token[] = [
  { 
    symbol: SUI_TOKEN_METADATA.SUI.symbol, 
    name: SUI_TOKEN_METADATA.SUI.name, 
    balance: '0.00', 
    icon: SUI_TOKEN_METADATA.SUI.icon 
  },
  { 
    symbol: SUI_TOKEN_METADATA.USDC.symbol, 
    name: SUI_TOKEN_METADATA.USDC.name, 
    balance: '0.00', 
    icon: SUI_TOKEN_METADATA.USDC.icon 
  },
]

export const DEFAULT_TOKEN = SUI_TOKENS[0] // SUI as default
