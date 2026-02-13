import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
import { delay } from '../utils';

/**
 * Key schema for DynamoDB item retrieval.
 */
export interface KeySchema {
  /** Partition key value */
  pk: string;
  /** Optional sort key value */
  sk?: string;
}

/**
 * Retrieves an item from a DynamoDB table with automatic retry logic.
 *
 * Useful for E2E and integration tests where you need to verify that a record
 * has been created in DynamoDB after triggering an async flow. The function
 * will poll the table until the item is found or max retries are exhausted.
 *
 * @param keys - The partition key (and optional sort key) to look up
 * @param tableName - The name of the DynamoDB table
 * @param maxIterations - Maximum number of retry attempts (default: 10)
 * @param delayInSeconds - Delay between retry attempts in seconds (default: 2)
 * @returns The retrieved DynamoDB item
 * @throws Error if the record is not found after all retry attempts
 *
 * @example
 * ```typescript
 * // Wait for a record to appear after triggering an async process
 * const item = await getItem(
 *   { pk: 'USER#123', sk: 'PROFILE' },
 *   'my-table',
 *   15,  // max 15 attempts
 *   3    // 3 seconds between attempts
 * );
 * expect(item.status).toBe('ACTIVE');
 * ```
 */
export async function getItem(
  keys: KeySchema,
  tableName: string,
  maxIterations = 10,
  delayInSeconds = 2,
): Promise<Record<string, string | boolean | number | object>> {
  const client = new DynamoDBClient({});
  const docClient = DynamoDBDocumentClient.from(client);

  const params = {
    TableName: tableName,
    Key: {
      pk: keys.pk,
      ...(keys.sk && { sk: keys.sk }),
    },
  };

  let iteration = 1;
  while (iteration <= maxIterations) {
    try {
      const response = await docClient.send(new GetCommand(params));
      if (response.Item) {
        return response.Item;
      }
    } catch (error) {
      console.error('error getting item:', error);
      throw error;
    }
    await delay(delayInSeconds);

    iteration++;
  }

  throw new Error('record not found');
}
