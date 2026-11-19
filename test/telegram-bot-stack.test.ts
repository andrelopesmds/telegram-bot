import { TelegramBotStack } from "../cdk/telegram-bot-stack";
import { App } from "monocdk";
import { haveResourceLike, countResources, expect as expectCdk, countResourcesLike, arrayWith, objectLike } from '@monocdk-experiment/assert'

describe('cdk tests', () => {
  let stack: TelegramBotStack;
  let resources: Record<string, any>;

  beforeAll(() => {
    const app = new App()
    stack = new TelegramBotStack(app, 'stack-id')
    resources = app.synth().getStackArtifact(stack.artifactId).template.Resources
  })

  test('should not create SNS resources', () => {
    expectCdk(stack).to(countResources('AWS::SNS::Topic', 0))
    expectCdk(stack).to(countResources('AWS::SNS::Subscription', 0))
  })

  test('should create one lambda to fetch tickers and send to Telegram', () => {
    expectCdk(stack).to(countResources('AWS::Lambda::Function', 1))

    expectCdk(stack).to(haveResourceLike('AWS::Lambda::Function', {
      FunctionName: 'telegram-bot-ticker-tracker',
      Runtime: 'nodejs24.x',
      Timeout: 30
    }))

    const lambda = Object.values(resources).find((resource: any) =>
      resource.Type === 'AWS::Lambda::Function') as any
    const variables = lambda.Properties.Environment.Variables

    expect(Object.keys(variables)).toEqual(expect.arrayContaining([
      'BOT_TOKEN', 'BOT_CHAT_ID', 'MARKET_STACK_ACCESS_KEY', 'TICKERS_TABLE_NAME'
    ]))
    expect(variables).not.toHaveProperty('TOPIC_ARN')
  })

  test('should allow only EventBridge to invoke the lambda', () => {
    expectCdk(stack).to(countResources('AWS::Lambda::Permission', 1))

    expectCdk(stack).to(countResourcesLike('AWS::Lambda::Permission', 1, {
      Action: 'lambda:InvokeFunction',
      Principal: 'events.amazonaws.com'
    }))
  })

  test('should create a rule to trigger the lambda', () => {
    expectCdk(stack).to(countResources('AWS::Events::Rule', 1))

    expectCdk(stack).to(haveResourceLike('AWS::Events::Rule', {
      ScheduleExpression: 'cron(0 22 ? * MON *)',
      State: 'ENABLED'
    }))
  })

  test('should create one lambda role', () => {
    expectCdk(stack).to(countResources('AWS::IAM::Role', 1))
  })

  test('should not grant SNS permissions', () => {
    const policies = Object.values(resources).filter((resource: any) =>
      resource.Type === 'AWS::IAM::Policy')

    expect(JSON.stringify(policies)).not.toContain('sns:')
  })

  test('should create policies to read from dynamodb', () => {
    expectCdk(stack).to(countResourcesLike('AWS::IAM::Policy', 1, {
      PolicyDocument: {
        Statement: arrayWith(objectLike({
          Action: [
            'dynamodb:BatchGetItem',
            'dynamodb:GetRecords',
            'dynamodb:GetShardIterator',
            'dynamodb:Query',
            'dynamodb:GetItem',
            'dynamodb:Scan',
            'dynamodb:ConditionCheckItem'
          ],
          Effect: 'Allow',
        })),
        Version: '2012-10-17'
      }
    }))
  })
})
