import { mockClient } from 'aws-sdk-client-mock';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { handler } from '../src/lambdas/crypto-tracker'
import { cryptoTickers } from '../src/constants'

import superagent = require('superagent')

const mockedValue = {
  body: {
    ticker: {
      last: 13
    }
  }
}

const snsMock = mockClient(SNSClient);
jest.mock('superagent', () => ({
  get: jest.fn().mockImplementation(() => mockedValue)
}))

describe('crypto tracker tests', () => {
  beforeEach(() => {
    snsMock.reset();
    snsMock.on(PublishCommand).resolves({});
  });
  
  test('should get price of each ticker from api', async () => {
    const nCrypto = cryptoTickers.length
    const mock = jest.spyOn(superagent, 'get')
    
    await handler({});
  
    expect(mock).toHaveBeenCalledTimes(nCrypto)
  });

  test('should call sns once to publish the whole message', async () => {
    await handler({});
  
    expect(snsMock.calls()).toHaveLength(1);
  });
})
