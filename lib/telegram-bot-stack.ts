import * as cdk from '@aws-cdk/core';
import lambda = require('@aws-cdk/aws-lambda');
import { Code } from '@aws-cdk/aws-lambda';
import * as path from 'path';

export class TelegramBotStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const STACK_NAME = 'telegram-bot'

    // The code that defines your stack goes here
    new lambda.Function(this, `${STACK_NAME}-message-sender`, {
      functionName: `${STACK_NAME}-message-sender`,
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: 'message-sender.handler',
      code: Code.fromAsset(path.join(__dirname, '../src/lambdas'))
    });
  }
}
