import { Ticker } from "./ticker.interface";

export const TOPIC_ARN = process.env.TOPIC_ARN ?? '';
export const MARKET_STACK_ACCESS_KEY = process.env.MARKET_STACK_ACCESS_KEY ?? ''
export const BOT_TOKEN = process.env.BOT_TOKEN ?? ''
export const BOT_CHAT_ID = process.env.BOT_CHAT_ID ?? ''

export const cryptoTickers: Ticker[] = [
  {
    key: 'BTC',
    name: 'Bitcoin'
  },
  {
    key: 'ETH',
    name: 'Ethereum'
  },
  {
    key: 'LTC',
    name: 'Litecoin'
  }
]
export const stocksTickers: Ticker[] = [
  {
    key: 'BIDI11.BVMF',
    name: 'Banco Inter'
  },
  {
    key: 'BBAS3.BVMF',
    name: 'Banco do Brasil'
  },
  {
    key: 'BBSE3.BVMF',
    name: 'BB Seguridade'
  },
  {
    key: 'MGLU3.BVMF',
    name: 'Magazine Luiza'
  },
  {
    key: 'MRVE3.BVMF',
    name: 'MRV'
  },
  {
    key: 'TAEE11.BVMF',
    name: 'Taesa Unit'
  }
]
