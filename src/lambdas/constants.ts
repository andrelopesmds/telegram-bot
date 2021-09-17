export const constants = {
  topicArn: 'arn:aws:sns:us-east-1:125523035986:telegram-bot-topic', // TODO
  accessKey: process.env.ACCESS_KEY,
  BOT_TOKEN: '',
  BOT_CHAT_ID: '',
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
