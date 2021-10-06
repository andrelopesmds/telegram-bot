import { mockClient } from 'aws-sdk-client-mock';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { handler } from '../src/lambdas/stocks-tracker'
import { stocksTickers } from '../src/constants'

import superagent = require('superagent')

const mockedValue = {
  body: {
    close: 13
  }
}

const snsMock = mockClient(SNSClient);
jest.mock('superagent', () => ({
  get: jest.fn().mockImplementation(() => mockedValue)
}))

describe('stocks tracker tests', () => {
  beforeEach(() => {
    snsMock.reset();
    snsMock.on(PublishCommand).resolves({});
  });

  test('should get price of each ticker from api', async () => {
    const nStocks = stocksTickers.length
    const mock = jest.spyOn(superagent, 'get')

    await handler({});

    expect(mock).toHaveBeenCalledTimes(nStocks)
  });

  test('should call sns once to publish the whole message', async () => {
    await handler({});

    expect(snsMock.calls()).toHaveLength(1);
  });
})
