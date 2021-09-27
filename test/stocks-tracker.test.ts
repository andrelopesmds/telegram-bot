import { mockClient } from 'aws-sdk-client-mock';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { handler } from '../src/lambdas/stocks-tracker'

const snsMock = mockClient(SNSClient);


describe('stocks tracker tests', () => {
  beforeEach(() => {
    snsMock.reset();
  });
  
  test('', async () => {
    snsMock.on(PublishCommand).resolves({});
    
    await handler({});
  
    expect(snsMock.calls()).toHaveLength(1);
  });
})
