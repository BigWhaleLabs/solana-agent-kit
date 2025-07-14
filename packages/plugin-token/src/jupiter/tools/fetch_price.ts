import type { PublicKey } from '@solana/web3.js'

/**
 * Fetch the price of a given token quoted in USD using Jupiter API v3
 * @param tokenId The token mint address
 * @returns The price of the token quoted in USD
 */
export async function fetchPrice(tokenId: PublicKey): Promise<string> {
  try {
    const response = await fetch(
      `https://lite-api.jup.ag/price/v3?ids=${tokenId.toBase58()}`
    )
    if (!response.ok) {
      throw new Error(`Failed to fetch price: ${response.statusText}`)
    }
    const data = await response.json()
    const tokenData = data[tokenId.toBase58()]
    if (!tokenData?.usdPrice) {
      throw new Error('Price data not available for the given token.')
    }
    return tokenData.usdPrice.toString()
  } catch (error: any) {
    throw new Error(`Price fetch failed: ${error.message}`)
  }
}
