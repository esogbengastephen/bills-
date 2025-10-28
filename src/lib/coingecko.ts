// CoinGecko API service for real-time cryptocurrency price conversion
export interface CoinGeckoPrice {
  sui: {
    ngn: number // Nigerian Naira
    usd: number // USD for reference
  }
}

export interface PriceConversion {
  suiAmount: number
  nairaAmount: number
  usdAmount: number
  exchangeRate: number // SUI to NGN rate
  lastUpdated: string
}

class CoinGeckoService {
  private baseUrl = 'https://api.coingecko.com/api/v3'
  private cache: Map<string, { data: CoinGeckoPrice; timestamp: number }> = new Map()
  private cacheTimeout = 60000 // 1 minute cache

  // Get SUI price in NGN and USD
  async getSuiPrice(): Promise<CoinGeckoPrice> {
    const cacheKey = 'sui-price'
    const cached = this.cache.get(cacheKey)
    
    // Return cached data if still valid
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/simple/price?ids=sui&vs_currencies=ngn,usd&include_24hr_change=true`
      )
      
      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status}`)
      }

      const data: CoinGeckoPrice = await response.json()
      
      // Cache the result
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      })

      return data
    } catch (error) {
      console.error('Error fetching SUI price from CoinGecko:', error)
      
      // Return cached data if available, even if expired
      if (cached) {
        console.warn('Using cached price data due to API error')
        return cached.data
      }
      
      // Fallback to default rates if no cache
      return {
        sui: {
          ngn: 2500, // Fallback rate: 1 SUI = ₦2,500
          usd: 1.5   // Fallback rate: 1 SUI = $1.50
        }
      }
    }
  }

  // Get USDC price in NGN and USD (USDC ~ $1; we fetch NGN rate)
  async getUsdcPrice(): Promise<{ usdc: { ngn: number; usd: number } }> {
    const cacheKey = 'usdc-price'
    const cached = this.cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      const c: any = cached.data
      if (c?.usdc) return { usdc: { ngn: c.usdc.ngn, usd: c.usdc.usd } }
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/simple/price?ids=usd-coin&vs_currencies=ngn,usd`
      )
      if (!response.ok) throw new Error(`CoinGecko API error: ${response.status}`)
      const data = await response.json()
      const result = { usdc: { ngn: data['usd-coin']?.ngn ?? 1500, usd: data['usd-coin']?.usd ?? 1 } }
      this.cache.set(cacheKey, { data: result as unknown as CoinGeckoPrice, timestamp: Date.now() })
      return result
    } catch (error) {
      console.error('Error fetching USDC price from CoinGecko:', error)
      if (cached) {
        const c: any = cached.data
        if (c?.usdc) return { usdc: { ngn: c.usdc.ngn, usd: c.usdc.usd } }
      }
      return { usdc: { ngn: 1500, usd: 1 } }
    }
  }

  // Convert SUI amount to Naira
  async convertSuiToNaira(suiAmount: number): Promise<PriceConversion> {
    const priceData = await this.getSuiPrice()
    const exchangeRate = priceData.sui.ngn
    const nairaAmount = suiAmount * exchangeRate
    const usdAmount = suiAmount * priceData.sui.usd

    return {
      suiAmount,
      nairaAmount,
      usdAmount,
      exchangeRate,
      lastUpdated: new Date().toISOString()
    }
  }

  // Convert Naira amount to SUI
  async convertNairaToSui(nairaAmount: number): Promise<PriceConversion> {
    const priceData = await this.getSuiPrice()
    const exchangeRate = priceData.sui.ngn
    const suiAmount = nairaAmount / exchangeRate
    const usdAmount = suiAmount * priceData.sui.usd

    return {
      suiAmount,
      nairaAmount,
      usdAmount,
      exchangeRate,
      lastUpdated: new Date().toISOString()
    }
  }

  // Convert USDC amount to Naira
  async convertUsdcToNaira(usdcAmount: number): Promise<PriceConversion> {
    const priceData = await this.getUsdcPrice()
    const exchangeRate = priceData.usdc.ngn
    const nairaAmount = usdcAmount * exchangeRate
    const usdAmount = usdcAmount * priceData.usdc.usd
    return {
      suiAmount: usdcAmount, // reuse as generic token amount
      nairaAmount,
      usdAmount,
      exchangeRate,
      lastUpdated: new Date().toISOString()
    }
  }

  // Convert Naira to USDC
  async convertNairaToUsdc(nairaAmount: number): Promise<PriceConversion> {
    const priceData = await this.getUsdcPrice()
    const exchangeRate = priceData.usdc.ngn
    const usdcAmount = nairaAmount / exchangeRate
    const usdAmount = usdcAmount * priceData.usdc.usd
    return {
      suiAmount: usdcAmount, // reuse as generic token amount
      nairaAmount,
      usdAmount,
      exchangeRate,
      lastUpdated: new Date().toISOString()
    }
  }

  // Get current exchange rate
  async getExchangeRate(): Promise<number> {
    const priceData = await this.getSuiPrice()
    return priceData.sui.ngn
  }

  // Format currency for display
  formatCurrency(amount: number, currency: 'NGN' | 'USD' | 'SUI'): string {
    switch (currency) {
      case 'NGN':
        return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      case 'USD':
        return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      case 'SUI':
        return `${amount.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 })} SUI`
      default:
        return amount.toString()
    }
  }

  // Clear cache (useful for testing)
  clearCache(): void {
    this.cache.clear()
  }
}

// Export singleton instance
export const coinGeckoService = new CoinGeckoService()

// Export utility functions
export async function getSuiToNairaRate(): Promise<number> {
  return await coinGeckoService.getExchangeRate()
}

export async function convertSuiToNaira(suiAmount: number): Promise<PriceConversion> {
  return await coinGeckoService.convertSuiToNaira(suiAmount)
}

export async function convertNairaToSui(nairaAmount: number): Promise<PriceConversion> {
  return await coinGeckoService.convertNairaToSui(nairaAmount)
}

export async function convertUsdcToNaira(usdcAmount: number): Promise<PriceConversion> {
  return await coinGeckoService.convertUsdcToNaira(usdcAmount)
}

export async function convertNairaToUsdc(nairaAmount: number): Promise<PriceConversion> {
  return await coinGeckoService.convertNairaToUsdc(nairaAmount)
}

export function formatCurrency(amount: number, currency: 'NGN' | 'USD' | 'SUI'): string {
  return coinGeckoService.formatCurrency(amount, currency)
}
