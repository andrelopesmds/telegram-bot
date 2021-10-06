import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { getPrice } from '../helper'
import { cryptoTickers, stocksTickers, TOPIC_ARN } from '../constants'
import { TickerType, Ticker } from '../ticker.interface';

const sns = new SNSClient({});

export const handler = async (event: any): Promise<void> => {
  console.log(`Event: ${JSON.stringify(event)}`)

  let message = 'Cryptos: \n'
  message = message + await getMessage(cryptoTickers, TickerType.Crypto)

  message = message + '\nStocks: \n'
  message = message + await getMessage(stocksTickers, TickerType.Stocks)
  
  await sns.send(new PublishCommand({
    Message: message,
    TopicArn: TOPIC_ARN,
  }))

  console.log(`Published message: ${message}`);
};

const getMessage = async (tickers: Ticker[], tickerType: TickerType): Promise<string> => {
  let message = ''

  for (const ticker of tickers) {
    const price = await getPrice(ticker, tickerType)
    message = message + ticker.name + ': ' + price + '\n'
  }

  return message
}
