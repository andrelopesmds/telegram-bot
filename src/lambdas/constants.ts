export const constants = {
  topicArn: 'arn:aws:sns:us-east-1:125523035986:telegram-bot-topic', // TODO
  accessKey: process.env.ACCESS_KEY,
  BOT_TOKEN: '',
  BOT_CHAT_ID: '',
  cryptoTickers: [
    {
      key: 'BTC',
      value: 'Bitcoin'
    },
    {
      key: 'ETH',
      value: 'Ethereum'
    },
    {
      key: 'LTC',
      value: 'Litecoin'
    }
  ],
  stocksTickers: [
    {
      key: 'ABEV3.BVMF',
      value: 'AMBEV'
    },
    {
      key: 'BIDI11.BVMF',
      value: 'Banco Inter'
    },
    {
      key: 'BBAS3.BVMF',
      value: 'Banco do Brasil'
    },
    {
      key: 'BBSE3.BVMF',
      value: 'BB Seguridade'
    },
    {
      key: 'MGLU3.BVMF',
      value: 'Magazine Luiza'
    },
    {
      key: 'MRVE3.BVMF',
      value: 'MRV'
    },
    {
      key: 'TAEE11.BVMF',
      value: 'Taesa Unit'
    }
  ]
}
