import { TelegramBotStack } from "../cdk/telegram-bot-stack";
import { App } from "monocdk";
import { haveResourceLike, countResources, expect as expectCdk, countResourcesLike } from '@monocdk-experiment/assert'

describe('cdk tests', () => {
  let stack: TelegramBotStack;

  beforeAll(() => {
    const app = new App()
    stack = new TelegramBotStack(app, 'stack-id')
  })

  test('should create a topic', () => {
    expectCdk(stack).to(countResources('AWS::SNS::Topic', 1))

    expectCdk(stack).to(haveResourceLike('AWS::SNS::Topic', {
      TopicName: 'telegram-bot-topic'
    }))
  })

  test('should create lambdas', () => {
    expectCdk(stack).to(countResources('AWS::Lambda::Function', 2))

    expectCdk(stack).to(haveResourceLike('AWS::Lambda::Function', {
      FunctionName: 'telegram-bot-ticker-tracker',
      Runtime: 'nodejs14.x'
    }))

    expectCdk(stack).to(haveResourceLike('AWS::Lambda::Function', {
      FunctionName: 'telegram-bot-message-sender',
      Runtime: 'nodejs14.x'
    }))
  })

  test('should create permissions to invoke lambdas', () => {
    expectCdk(stack).to(countResources('AWS::Lambda::Permission', 2))

    expectCdk(stack).to(countResourcesLike('AWS::Lambda::Permission', 1, {
      Action: 'lambda:InvokeFunction',
      Principal: 'events.amazonaws.com'
    }))

    expectCdk(stack).to(countResourcesLike('AWS::Lambda::Permission', 1, {
      Action: 'lambda:InvokeFunction',
      Principal: 'sns.amazonaws.com'
    }))
  })

  test('should create rule to trigger the lambdas ...', () => {
    expectCdk(stack).to(countResources('AWS::Events::Rule', 1))

    expectCdk(stack).to(haveResourceLike('AWS::Events::Rule', {
      ScheduleExpression: 'cron(0 22 ? * MON,TUE,WED,THU *)',
      State: 'ENABLED'
    }))
  })

  test('should a role for each lambda', () => {
    expectCdk(stack).to(countResources('AWS::IAM::Role', 2))
  })

  test('should subscribe a lambda to an sns topic', () => {
    expectCdk(stack).to(countResources('AWS::SNS::Subscription', 1))

    expectCdk(stack).to(haveResourceLike('AWS::SNS::Subscription', {
      Protocol: 'lambda'
    }))
  })

  test('should create policies to publish to sns', () => {
    expectCdk(stack).to(countResourcesLike('AWS::IAM::Policy', 1, {
      PolicyDocument: {
        Statement: [{
          Action: 'sns:Publish',
          Effect: 'Allow',
        }],
        Version: '2012-10-17'
      }
    }))
  })
})