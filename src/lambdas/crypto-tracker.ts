
const AWS = require('aws-sdk');
const sns = new AWS.SNS();

import { constants } from './constants'

exports.handler = async (event: any) => {
  console.log(`${new Date()} - ${JSON.stringify(event)}`)

  const res = await sns.publish({
    Message: 'hello from crypto tracker',
    TopicArn: constants.topicArn,
  }).promise();

  console.log(res);

  return {
    statusCode: 200, body: JSON.stringify(event)
  }
};
