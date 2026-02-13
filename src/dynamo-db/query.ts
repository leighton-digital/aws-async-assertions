import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  QueryCommand,
  type QueryCommandInput,
  type QueryCommandOutput,
} from '@aws-sdk/lib-dynamodb';
import { delay } from '../utils';

const client = new DynamoDBClient({});
const dynamoDb = DynamoDBDocumentClient.from(client);

/**
 * Parameters for querying a DynamoDB table.
 */
export interface QueryParams {
  /** The name of the DynamoDB table to query */
  tableName: string;
  /** The key condition expression (e.g., 'pk = :pk AND sk BEGINS_WITH :prefix') */
  keyConditionExpression: string;
  /** Values for the key condition expression placeholders */
  // biome-ignore lint/suspicious/noExplicitAny: record use
  expressionAttributeValues: Record<string, any>;
  /** Optional mapping of expression attribute name placeholders */
  expressionAttributeNames?: Record<string, string>;
  /** Optional GSI or LSI name to query */
  indexName?: string;
  /** Maximum number of items to return */
  limit?: number;
  /** Optional filter expression applied after the query */
  filterExpression?: string;
  /** Values for filter expression placeholders */
  // biome-ignore lint/suspicious/noExplicitAny: record use
  filterAttributeValues?: Record<string, any>;
  /** Whether to use strongly consistent reads */
  consistentRead?: boolean;
  /** Pagination token from a previous query */
  // biome-ignore lint/suspicious/noExplicitAny: record use
  lastEvaluatedKey?: Record<string, any>;
  /** Sort order - true for ascending, false for descending (default: true) */
  scanIndexForward?: boolean;
  /** Maximum number of retry attempts (default: 10) */
  maxIterations?: number;
  /** Delay between retry attempts in seconds (default: 2) */
  delayInSeconds?: number;
}

/**
 * Queries a DynamoDB table with automatic retry logic.
 *
 * Designed for E2E and integration tests where you need to verify that records
 * exist in DynamoDB after triggering an async flow. The function will poll
 * the table until results are found or max retries are exhausted.
 *
 * @typeParam T - The expected type of items returned
 * @param params - Query parameters including table name, key conditions, and retry settings
 * @returns Object containing the matched items and optional pagination token
 * @throws Error if no results are found after all retry attempts
 *
 * @example
 * ```typescript
 * // Query for all orders belonging to a user after triggering order creation
 * const { items } = await query<Order>({
 *   tableName: 'orders-table',
 *   keyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
 *   expressionAttributeValues: {
 *     ':pk': 'USER#123',
 *     ':prefix': 'ORDER#'
 *   },
 *   maxIterations: 15,
 *   delayInSeconds: 2
 * });
 *
 * expect(items).toHaveLength(1);
 * expect(items[0].status).toBe('CONFIRMED');
 * ```
 *
 * @example
 * ```typescript
 * // Query with a filter and using a GSI
 * const { items } = await query<Event>({
 *   tableName: 'events-table',
 *   indexName: 'status-index',
 *   keyConditionExpression: 'status = :status',
 *   expressionAttributeValues: { ':status': 'PENDING' },
 *   filterExpression: 'createdAt > :date',
 *   filterAttributeValues: { ':date': '2024-01-01' }
 * });
 * ```
 */
export async function query<T>({
  tableName,
  keyConditionExpression,
  expressionAttributeValues,
  expressionAttributeNames,
  indexName,
  limit,
  filterExpression,
  filterAttributeValues,
  consistentRead,
  lastEvaluatedKey,
  scanIndexForward = true,
  maxIterations = 10,
  delayInSeconds = 2,
}: QueryParams): Promise<{
  items: T[];
  // biome-ignore lint/suspicious/noExplicitAny: record use
  lastEvaluatedKey?: Record<string, any>;
}> {
  const baseParams: QueryCommandInput = {
    TableName: tableName,
    KeyConditionExpression: keyConditionExpression,
    ExpressionAttributeValues: expressionAttributeValues,
    IndexName: indexName,
    Limit: limit,
    ConsistentRead: consistentRead ?? false,
    ExclusiveStartKey: lastEvaluatedKey,
    ScanIndexForward: scanIndexForward,
  };

  if (expressionAttributeNames) {
    baseParams.ExpressionAttributeNames = expressionAttributeNames;
  }

  if (filterExpression) {
    baseParams.FilterExpression = filterExpression;
    if (filterAttributeValues) {
      baseParams.ExpressionAttributeValues = {
        ...baseParams.ExpressionAttributeValues,
        ...filterAttributeValues,
      };
    }
  }

  let iteration = 1;
  while (iteration <= maxIterations) {
    try {
      const data: QueryCommandOutput = await dynamoDb.send(
        new QueryCommand(baseParams),
      );
      const items: T[] = (data.Items as T[]) ?? [];

      if (items.length > 0 || data.LastEvaluatedKey) {
        return { items, lastEvaluatedKey: data.LastEvaluatedKey };
      }
    } catch (error) {
      console.error(`error querying dynamoDB: ${error}`);
      throw error;
    }

    await delay(delayInSeconds);
    iteration++;
  }

  throw new Error('query returned no results after max retries');
}
