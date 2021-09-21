import { SNS } from 'aws-sdk';
import { getPrice } from '../helper'
import { constants } from '../constants'
import { TickerType } from '../ticker.interface'

const sns = new SNS();

exports.handler = async (event: any) => {
  console.log(`${new Date()} - ${JSON.stringify(event)}`)
  let message = ''
  
  for (const ticker of constants.stocksTickers) {
    const price = await getPrice(ticker, TickerType.Stocks)
    message = message + ticker.name + ': ' + price + '\n'
  }
  
  const res = await sns.publish({
    Message: message,
    TopicArn: constants.TOPIC_ARN,
  }).promise();

  console.log({...res, message })

  return {
    statusCode: 200, body: JSON.stringify(event)
  }
};
