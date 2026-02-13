import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

/**
 * Inserts or replaces an item in a DynamoDB table.
 *
 * Useful for setting up test fixtures in E2E and integration tests.
 * Use this to seed test data before triggering the flow you want to test.
 *
 * @param tableName - The name of the DynamoDB table
 * @param item - The item to insert, containing all attributes
 * @throws Error if the put operation fails
 *
 * @example
 * ```typescript
 * // Set up test data before running assertions
 * await putItem('users-table', {
 *   pk: 'USER#123',
 *   sk: 'PROFILE',
 *   name: 'Test User',
 *   email: 'test@example.com',
 *   status: 'PENDING'
 * });
 *
 * // Trigger your async flow...
 * // Then use getItem() to verify the record was updated
 * ```
 */
export async function putItem(
  tableName: string,
  item: Record<string, string | boolean | number | object>,
): Promise<void> {
  const client = new DynamoDBClient({});
  const docClient = DynamoDBDocumentClient.from(client);

  const params = {
    TableName: tableName,
    Item: item,
  };

  try {
    await docClient.send(new PutCommand(params));
  } catch (error) {
    console.error('Error putting item into DynamoDB table:', error);
    throw error;
  }
}
