import { SNS } from 'aws-sdk';
import { formatPrice } from '../lambdas/helper'
import { constants } from './constants'
import { Ticker } from './ticker.interface'

import superagent = require('superagent');

const sns = new SNS();

exports.handler = async (event: any) => {
  console.log(`${new Date()} - ${JSON.stringify(event)}`)
  let message = ''
  
  for (const ticker of constants.stocksTickers) {
    const price = await getPrice(ticker)
    message = message + ticker.name + ': ' + price + '\n'
  }
  
  const res = await sns.publish({
    Message: message,
    TopicArn: constants.topicArn,
  }).promise();

  console.log({...res, message })

  return {
    statusCode: 200, body: JSON.stringify(event)
  }
};

const getPrice = async (ticker: Ticker): Promise<string> => {
  const { body } = await superagent.get(`http://api.marketstack.com/v1/tickers/${ticker.key}/eod/latest?access_key=${constants.accessKey}`)
  console.log(body);

  return formatPrice(body.close);
}
