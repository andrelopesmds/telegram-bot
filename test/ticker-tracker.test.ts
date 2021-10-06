import { mockClient } from 'aws-sdk-client-mock';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { handler } from '../src/lambdas/ticker-tracker'
import { cryptoTickers, stocksTickers } from '../src/constants'

import superagent = require('superagent')

const mockedValueStocks = {
  body: {
    ticker: {
      last: 13
    }
  }
}

const mockedValueCryptos = {
  body: {
    close: 2
  }
}

const snsMock = mockClient(SNSClient);
jest.mock('superagent', () => ({
  get: jest.fn().mockImplementation((url: string) => {
    return url.includes('market') ? mockedValueCryptos : mockedValueStocks
  })
}))

describe('crypto tracker tests', () => {
  beforeEach(() => {
    snsMock.reset();
    snsMock.on(PublishCommand).resolves({});
  });
  
  test('should get price of each ticker from api', async () => {
    const countTickers = cryptoTickers.length + stocksTickers.length
    const mock = jest.spyOn(superagent, 'get')
    
    await handler({});
  
    expect(mock).toHaveBeenCalledTimes(countTickers)
  });

  test('should call sns once to publish the whole message', async () => {
    await handler({});
  
    expect(snsMock.calls()).toHaveLength(1);
  });
})
