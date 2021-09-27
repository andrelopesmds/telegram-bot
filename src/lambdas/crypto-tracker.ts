import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { getPrice } from '../helper'
import { constants } from '../constants'
import { TickerType } from '../ticker.interface';

const sns = new SNSClient({});

export const handler = async (event: any): Promise<void> => {
  console.log(`Event: ${JSON.stringify(event)}`)
  let message = ''

  for (const ticker of constants.cryptoTickers) {
    const price = await getPrice(ticker, TickerType.Crypto)
    message = message + ticker.name + ': ' + price + '\n'
  }
  
  await sns.send(new PublishCommand({
    Message: message,
    TopicArn: constants.TOPIC_ARN,
  }))

  console.log(`Message published ${message}`);
};
