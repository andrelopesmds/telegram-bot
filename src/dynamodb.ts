import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import { Ticker, TickerType } from './ticker.interface';
import { TICKERS_TABLE_NAME } from './constants';

export const getTickers = async (): Promise<Ticker[]> => {
    const client = new DynamoDBClient({});

    const command = new ScanCommand({
      TableName: TICKERS_TABLE_NAME
    });

    const results = await client.send(command)

    return results.Items?.map(item => {
      return {
        key: item.key.S as unknown as string,
        name: item.name.S as unknown as string,
        target: item.target ? parseFloat(item.target.N as string) : undefined,
        type: item.type.S as unknown as TickerType
      }
    }) ?? []
}
