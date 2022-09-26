import { PublishCommand, SNSClient } from '@aws-sdk/client-sns';
import { TOPIC_ARN } from './constants'

export const sendMessage = async (message: string): Promise<void> => {
  const sns = new SNSClient({});

  await sns.send(new PublishCommand({
    Message: message,
    TopicArn: TOPIC_ARN
  }))
}
