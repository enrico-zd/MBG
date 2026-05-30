import { createPixverseClient, type PixverseClient, type PixverseClientConfig } from "./client.ts"

export type PixverseCreditsBreakdown = {
  accountId: number
  monthly: number
  package: number
  total: number
}

function isPixverseClient(input: PixverseClient | PixverseClientConfig): input is PixverseClient {
  return typeof (input as PixverseClient).getAccountBalance === "function"
}

export async function getPixverseCredits(input: PixverseClient | PixverseClientConfig): Promise<PixverseCreditsBreakdown> {
  const client = isPixverseClient(input) ? input : createPixverseClient(input)
  const balance = await client.getAccountBalance()
  const monthly = balance.credit_monthly
  const pkg = balance.credit_package

  return {
    accountId: balance.account_id,
    monthly,
    package: pkg,
    total: monthly + pkg,
  }
}
