import { Construct, Stack, StackProps} from 'monocdk'
import { NodejsFunction } from 'monocdk/aws-lambda-nodejs'
import { Topic } from 'monocdk/aws-sns'
import { LambdaSubscription } from 'monocdk/aws-sns-subscriptions'

import * as path from 'path';

export class TelegramBotStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const STACK_NAME = 'telegram-bot'

    const cryptoTracker = 'crypto-tracker'
    const cryptopTrackerFunction = new NodejsFunction(this, `${STACK_NAME}-${cryptoTracker}`, {
      functionName: `${STACK_NAME}-${cryptoTracker}`,
      entry: path.join(__dirname, `../src/lambdas/${cryptoTracker}.ts`)
    });

    const messageSender = 'message-sender'
    const messageSenderFunction = new NodejsFunction(this, `${STACK_NAME}-${messageSender}`, {
      functionName: `${STACK_NAME}-${messageSender}`,
      entry: path.join(__dirname, `../src/lambdas/${messageSender}.ts`)
    });

    const topic = new Topic(this, `${STACK_NAME}-topic`, {
      topicName: `${STACK_NAME}-topic`,
      displayName: `${STACK_NAME}-topic`
    });

    topic.addSubscription(new LambdaSubscription(messageSenderFunction))
    topic.grantPublish(cryptopTrackerFunction)
  }
}
