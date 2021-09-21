import { SNS } from 'aws-sdk';
import { getPrice } from '../helper'
import { constants } from '../constants'
import { TickerType } from '../ticker.interface';

const sns = new SNS();

exports.handler = async (event: any) => {
  console.log(`Event: ${JSON.stringify(event)}`)
  let message = ''

  for (const ticker of constants.cryptoTickers) {
    const price = await getPrice(ticker, TickerType.Crypto)
    message = message + ticker.name + ': ' + price + '\n'
  }
  
  await sns.publish({
    Message: message,
    TopicArn: constants.TOPIC_ARN,
  }).promise();

  console.log(`Message published ${message}`);
};
