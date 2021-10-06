import { Construct, Stack, StackProps, Duration} from 'monocdk'
import { NodejsFunction } from 'monocdk/aws-lambda-nodejs'
import { Topic } from 'monocdk/aws-sns'
import { LambdaSubscription } from 'monocdk/aws-sns-subscriptions'
import { Rule, Schedule } from 'monocdk/aws-events'
import { LambdaFunction} from 'monocdk/aws-events-targets'
import { MARKET_STACK_ACCESS_KEY, BOT_CHAT_ID, BOT_TOKEN } from '../src/constants'

import * as path from 'path';

export class TelegramBotStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const STACK_NAME = 'telegram-bot'

    const topic = new Topic(this, `${STACK_NAME}-topic`, {
      topicName: `${STACK_NAME}-topic`,
      displayName: `${STACK_NAME}-topic`
    });

    const cryptoTracker = 'crypto-tracker'
    const cryptopTrackerFunction = new NodejsFunction(this, `${STACK_NAME}-${cryptoTracker}`, {
      functionName: `${STACK_NAME}-${cryptoTracker}`,
      entry: path.join(__dirname, `../src/lambdas/${cryptoTracker}.ts`),
      timeout: Duration.seconds(10),
      environment: {
        TOPIC_ARN: topic.topicArn
      }
    });

    const stocksTracker = 'stocks-tracker'
    const stocksTrackerFunction = new NodejsFunction(this, `${STACK_NAME}-${stocksTracker}`, {
      functionName: `${STACK_NAME}-${stocksTracker}`,
      entry: path.join(__dirname, `../src/lambdas/${stocksTracker}.ts`),
      timeout: Duration.seconds(10),
      environment: {
        MARKET_STACK_ACCESS_KEY: MARKET_STACK_ACCESS_KEY,
        TOPIC_ARN: topic.topicArn
      }
    });

    const messageSender = 'message-sender'
    const messageSenderFunction = new NodejsFunction(this, `${STACK_NAME}-${messageSender}`, {
      functionName: `${STACK_NAME}-${messageSender}`,
      entry: path.join(__dirname, `../src/lambdas/${messageSender}.ts`),
      environment: {
        BOT_TOKEN: BOT_TOKEN,
        BOT_CHAT_ID: BOT_CHAT_ID,
      }
    });

    topic.addSubscription(new LambdaSubscription(messageSenderFunction))
    topic.grantPublish(cryptopTrackerFunction)
    topic.grantPublish(stocksTrackerFunction)

    const rule = new Rule(this, 'Rule', {
      schedule: Schedule.expression('cron(0 22 ? * MON-FRI *)')
    });

    rule.addTarget(new LambdaFunction(cryptopTrackerFunction))
    rule.addTarget(new LambdaFunction(stocksTrackerFunction))
  }
}
