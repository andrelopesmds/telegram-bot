
const AWS = require('aws-sdk');
const sns = new AWS.SNS();

import superagent = require('superagent');

import { constants } from './constants'


exports.handler = async (event: any) => {
  console.log(`${new Date()} - ${JSON.stringify(event)}`)
  let message = ''

  for (const ticker of constants.cryptoTickers) {
    const { body } = await superagent.get('https://www.mercadobitcoin.net/api/' + ticker.key + '/ticker/')
    console.log(body);

    const price = body.ticker.last; // format this
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
