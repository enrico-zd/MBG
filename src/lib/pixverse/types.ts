export type PixverseEnvelope<TResp> = {
  ErrCode: number
  ErrMsg: string
  Resp: TResp
}

export type PixverseAccountBalanceResp = {
  account_id: number
  credit_monthly: number
  credit_package: number
}

