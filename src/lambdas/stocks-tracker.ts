
const AWS = require('aws-sdk');
const sns = new AWS.SNS();

import superagent = require('superagent');

import { constants } from './constants'


exports.handler = async (event: any) => {
  console.log(`${new Date()} - ${JSON.stringify(event)}`)
  let message = ''

  for (const ticker of constants.stocksTickers) {
    const { body } = await superagent.get(`http://api.marketstack.com/v1/tickers/${ticker.key}/eod/latest?access_key=${constants.accessKey}`)
    console.log(body);

    const price = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(body.close);
    message = message + ticker.value + ": " + JSON.stringify(price) + "\n"
  }
  
  const res = await sns.publish({
    Message: 'hello from crypto tracker: ' + message,
    TopicArn: constants.topicArn,
  }).promise();

  console.log(res);

  return {
    statusCode: 200, body: JSON.stringify(event)
  }
};
