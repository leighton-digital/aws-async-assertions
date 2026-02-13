<img width="50px" height="50px" align="right" alt="Cloud Blocks logo" src="https://raw.githubusercontent.com/leighton-digital/aws-async-assertions/HEAD/images/aws-async-assertions.png?sanitize=true" title="Leighton AWS Async Assertions"/>

# AWS Async Assertions

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/leighton-digital/aws-async-assertions/blob/main/LICENSE)
![Maintained](https://img.shields.io/maintenance/yes/2026)
![Code style: Biome](https://img.shields.io/badge/code%20style-biome-60A5FA?logo=biome)

A lightweight utility library for **E2E and integration testing** of AWS serverless applications. Trigger your async C locally and use these utilities to verify that records exist in AWS services like DynamoDB.

📖 [View the full documentation](https://leighton-digital.github.io/aws-async-assertions/)

---

## Why?

Testing serverless applications is challenging because operations are often asynchronous. When you trigger a Lambda function or API endpoint, the resulting data might not appear in your data stores immediately. This library provides utilities with built-in retry logic to poll AWS services until your expected data appears—or until a timeout is reached.

### Testing Tip: Audit Records

Consider writing `AUDIT#` records to DynamoDB at key points in your async workflows. This provides:

- **Traceability** — Track the flow of requests through your system
- **Testability** — Query for audit records to verify specific steps completed
- **Debugging** — Understand where failures occur in complex flows

```typescript
// In your Lambda function
await putItem('events-table', {
  pk: `ORDER#${orderId}`,
  sk: `AUDIT#${Date.now()}#PAYMENT_PROCESSED`,
  timestamp: new Date().toISOString(),
  correlationId,
  status: 'SUCCESS'
});

// In your test
const { items } = await query<AuditRecord>({
  tableName: 'events-table',
  keyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
  expressionAttributeValues: {
    ':pk': `ORDER#${orderId}`,
    ':prefix': 'AUDIT#'
  }
});

expect(items.some(i => i.sk.includes('PAYMENT_PROCESSED'))).toBe(true);
```

---

## Installation

```bash
npm install aws-async-assertions
# or
pnpm add aws-async-assertions
# or
yarn add aws-async-assertions
```

---

## Quick Start

```typescript
import { getItem, query, httpCall, generateAccessToken } from 'aws-async-assertions';

describe('Order Creation E2E', () => {
  it('should create an order and persist to DynamoDB', async () => {
    // 1. Get an auth token
    const token = await generateAccessToken(
      'https://auth.example.com',
      process.env.CLIENT_ID,
      process.env.CLIENT_SECRET
    );

    // 2. Trigger the async flow via API
    const order = await httpCall(
      'https://api.example.com',
      '/orders',
      'POST',
      { productId: 'PROD-123', quantity: 2 },
      { Authorization: `Bearer ${token}` }
    );

    // 3. Wait for and verify the record in DynamoDB (with automatic retries)
    const item = await getItem(
      { pk: `ORDER#${order.id}`, sk: 'DETAILS' },
      'orders-table',
      15,  // max 15 attempts
      2    // 2 seconds between attempts
    );

    expect(item.status).toBe('CONFIRMED');
    expect(item.quantity).toBe(2);
  });
});
```

---

## API Reference

### DynamoDB Utilities

#### `getItem(keys, tableName, maxIterations?, delayInSeconds?)`

Retrieves a single item from DynamoDB with automatic retry logic.

```typescript
const item = await getItem(
  { pk: 'USER#123', sk: 'PROFILE' },
  'users-table',
  10,  // retry up to 10 times
  2    // wait 2 seconds between retries
);
```

#### `query(params)`

Queries DynamoDB with automatic retry logic. Supports GSIs, filters, and pagination.

```typescript
const { items } = await query<Order>({
  tableName: 'orders-table',
  keyConditionExpression: 'pk = :pk',
  expressionAttributeValues: { ':pk': 'USER#123' },
  indexName: 'gsi1',
  maxIterations: 10,
  delayInSeconds: 2
});
```

#### `putItem(tableName, item)`

Inserts or replaces an item in DynamoDB. Useful for setting up test fixtures.

```typescript
await putItem('users-table', {
  pk: 'USER#123',
  sk: 'PROFILE',
  name: 'Test User',
  status: 'ACTIVE'
});
```

### HTTP Utilities

#### `httpCall<T>(endpoint, resource, method, payload?, headers?)`

Makes HTTP requests with a 10-second timeout.

```typescript
const response = await httpCall<CreateOrderResponse>(
  'https://api.example.com',
  '/orders',
  'POST',
  { productId: 'PROD-123' },
  { Authorization: 'Bearer token' }
);
```

#### `generateAccessToken(url, clientId, clientSecret, scopes?)`

Generates an OAuth 2.0 access token using the client credentials flow.

```typescript
const token = await generateAccessToken(
  'https://auth.example.com',
  'my-client-id',
  'my-client-secret',
  ['read:orders', 'write:orders']
);
```

### General Utilities

#### `delay(delayInSeconds)`

Pauses execution for a specified duration.

```typescript
await delay(5); // Wait 5 seconds
```

#### `generateRandomId(length?)`

Generates a random UUID-based identifier for unique test data.

```typescript
const userId = generateRandomId();     // Full UUID: "a1b2c3d4-e5f6-..."
const shortId = generateRandomId(8);   // Truncated: "a1b2c3d4"
```

---

## Project Structure

```text
.
├── src/
│   ├── dynamo-db/          # DynamoDB utilities (getItem, putItem, query)
│   ├── utils/              # General utilities (delay, httpCall, etc.)
│   └── index.ts            # Main exports
├── docs-site/              # Docusaurus documentation site
└── README.md
```

---

## Development

### Prerequisites

- Node.js >= 20
- pnpm 10.29.2

### Setup

```bash
git clone https://github.com/leighton-digital/aws-async-assertions.git
cd aws-async-assertions
pnpm install
```

### Commands

```bash
# Build the library
pnpm build

# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Generate documentation
pnpm docs:generate
```

### Code Quality

This project uses:

- **[Biome](https://biomejs.dev/)**: Fast linting and formatting
- **[TypeScript](https://www.typescriptlang.org/)**: Type checking
- **[Jest](https://jestjs.io/)**: Testing framework
- **[SWC](https://swc.rs/)**: Fast TypeScript compilation

---

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Submit a pull request

---

## License

MIT License — see the [LICENSE](https://github.com/leighton-digital/aws-async-assertions/blob/main/LICENSE) file for details.

---

Built with ❤️ by [Leighton Digital](https://github.com/leighton-digital)

<img src="https://raw.githubusercontent.com/leighton-digital/aws-async-assertions/HEAD/images/leighton-logo.svg" width="200" alt="Leighton Digital logo" />
