export interface Ticker {
  key: string
  name: string
  type: TickerType
  target?: number
}

export enum TickerType {
  Stocks = 'Stocks',
  Crypto = 'Crypto'
}
