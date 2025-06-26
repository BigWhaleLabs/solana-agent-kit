import { TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { LAMPORTS_PER_SOL, type PublicKey } from '@solana/web3.js'
import { SolanaAgentKit } from 'solana-agent-kit'
import { getTokenMetadata } from './utils/tokenMetadata'

/**
 * Get the token balances of a Solana wallet
 * @param agent - SolanaAgentKit instance
 * @param token_address - Optional SPL token mint address. If not provided, returns SOL balance
 * @returns Promise resolving to the balance as an object containing sol balance and token balances with their respective mints, symbols, names and decimals
 */
export async function get_token_balance(
  agent: SolanaAgentKit,
  walletAddress?: PublicKey
): Promise<{
  sol: number
  tokens: Array<{
    tokenAddress: string
    name: string
    symbol: string
    balance: number
    decimals: number
  }>
}> {
  const targetWallet = walletAddress ?? agent.wallet.publicKey

  let lamportsBalance = 0
  try {
    lamportsBalance = await agent.connection.getBalance(targetWallet)
  } catch {
    lamportsBalance = 0
  }

  let tokenAccountData: { value: any[] } = { value: [] }
  try {
    tokenAccountData = await agent.connection.getParsedTokenAccountsByOwner(
      targetWallet,
      {
        programId: TOKEN_PROGRAM_ID,
      }
    )
  } catch {
    tokenAccountData = { value: [] }
  }

  const removedZeroBalance = tokenAccountData.value.filter(
    (v: any) => v.account.data.parsed.info.tokenAmount.uiAmount !== 0
  )

  const tokenBalances = await Promise.all(
    removedZeroBalance.map(async (v: any) => {
      const mint = v.account.data.parsed.info.mint
      let mintInfo: { name: string | null; symbol: string | null } = {
        name: null,
        symbol: null,
      }

      try {
        mintInfo = await getTokenMetadata(agent.connection, mint)
      } catch {
        mintInfo = { name: null, symbol: null }
      }

      return {
        tokenAddress: mint,
        name: mintInfo.name ?? '',
        symbol: mintInfo.symbol ?? '',
        balance: v.account.data.parsed.info.tokenAmount.uiAmount as number,
        decimals: v.account.data.parsed.info.tokenAmount.decimals as number,
      }
    })
  )

  const solBalance = lamportsBalance / LAMPORTS_PER_SOL

  return {
    sol: solBalance,
    tokens: tokenBalances,
  }
}
