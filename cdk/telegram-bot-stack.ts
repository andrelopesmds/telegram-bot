import { Construct, Stack, StackProps, Duration} from 'monocdk'
import { NodejsFunction } from 'monocdk/aws-lambda-nodejs'
import { Runtime, RuntimeFamily } from 'monocdk/aws-lambda'
import { Table, AttributeType } from 'monocdk/aws-dynamodb'
import { Rule, Schedule } from 'monocdk/aws-events'
import { LambdaFunction} from 'monocdk/aws-events-targets'
import { MARKET_STACK_ACCESS_KEY, BOT_CHAT_ID, BOT_TOKEN } from '../src/constants'

import * as path from 'path';


export class TelegramBotStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const STACK_NAME = 'telegram-bot'

    const tickersTable = new Table(this, 'tickers-table', {
      tableName: 'tickers-table',
      partitionKey: {
        name: 'key',
        type: AttributeType.STRING
      },
      readCapacity: 1,
      writeCapacity: 1
    });

    const tickerTracker = 'ticker-tracker'
    const tickerTrackerFunction = new NodejsFunction(this, `${STACK_NAME}-${tickerTracker}`, {
      functionName: `${STACK_NAME}-${tickerTracker}`,
      entry: path.join(__dirname, `../src/lambdas/${tickerTracker}.ts`),
      runtime: new Runtime('nodejs24.x', RuntimeFamily.NODEJS),
      timeout: Duration.seconds(30),
      environment: {
        MARKET_STACK_ACCESS_KEY: MARKET_STACK_ACCESS_KEY, // TODO - move this to Secrets Manager
        BOT_TOKEN: BOT_TOKEN, // TODO - move this to Secrets Manager
        BOT_CHAT_ID: BOT_CHAT_ID,
        TICKERS_TABLE_NAME: tickersTable.tableName
      }
    });

    tickersTable.grantReadData(tickerTrackerFunction)

    const rule = new Rule(this, 'Rule', {
      schedule: Schedule.expression('cron(0 22 ? * MON *)')
    });

    rule.addTarget(new LambdaFunction(tickerTrackerFunction))
  }
}
