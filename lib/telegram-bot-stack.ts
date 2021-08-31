import * as cdk from '@aws-cdk/core';
import sns = require('@aws-cdk/aws-sns');
import subs = require('@aws-cdk/aws-sns-subscriptions');
import { Code, Function, Runtime } from '@aws-cdk/aws-lambda';
import * as path from 'path';

export class TelegramBotStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const STACK_NAME = 'telegram-bot'

    const cryptoTracker = 'crypto-tracker'
    const cryptopTrackerFunction = new Function(this, `${STACK_NAME}-${cryptoTracker}`, {
      functionName: `${STACK_NAME}-${cryptoTracker}`,
      runtime: Runtime.NODEJS_14_X,
      handler: `${cryptoTracker}.handler`,
      code: Code.fromAsset(path.join(__dirname, '../src/lambdas'))
    });

    const messageSender = 'message-sender'
    const messageSenderFunction = new Function(this, `${STACK_NAME}-${messageSender}`, {
      functionName: `${STACK_NAME}-${messageSender}`,
      runtime: Runtime.NODEJS_14_X,
      handler: `${messageSender}.handler`,
      code: Code.fromAsset(path.join(__dirname, '../src/lambdas'))
    });

    const topic = new sns.Topic(this, `${STACK_NAME}-topic`, {
      topicName: `${STACK_NAME}-topic`,
      displayName: `${STACK_NAME}-topic`
    });

    topic.addSubscription(new subs.LambdaSubscription(messageSenderFunction))
    topic.grantPublish(cryptopTrackerFunction)
  }
}
