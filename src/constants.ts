export const constants = {
  TOPIC_ARN: process.env.TOPIC_ARN ?? '',
  MARKET_STACK_ACCESS_KEY: process.env.MARKET_STACK_ACCESS_KEY ?? '',
  BOT_TOKEN: process.env.BOT_TOKEN ?? '',
  BOT_CHAT_ID: process.env.BOT_CHAT_ID ?? '',
  cryptoTickers: [
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
  ],
  stocksTickers: [
    {
      key: 'ABEV3.BVMF',
      name: 'AMBEV'
    },
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
}
