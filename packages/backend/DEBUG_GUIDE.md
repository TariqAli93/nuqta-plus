# 🔍 Debugging Guide - دليل التصحيح

Complete guide for debugging the nuqtaplus backend system.

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Environment Variables](#environment-variables)
3. [Logger Usage](#logger-usage)
4. [Debug Endpoints](#debug-endpoints)
5. [Database Query Tracking](#database-query-tracking)
6. [Performance Monitoring](#performance-monitoring)
7. [Best Practices](#best-practices)

---

## 🚀 Quick Start

### 1. Enable Debug Mode

Add to your `.env` file:

```env
DEBUG_MODE=true
LOG_LEVEL=debug
DEBUG_REQUESTS=true
DEBUG_SQL=true
```

### 2. Register Debug Plugin

The debug plugin is automatically registered in `server.js`. No additional setup needed!

### 3. Start Server

```bash
pnpm dev
```

You'll now see detailed logs for all requests, responses, and database queries.

---

## ⚙️ Environment Variables

### General Debugging

| Variable     | Values                        | Default       | Description                    |
| ------------ | ----------------------------- | ------------- | ------------------------------ |
| `DEBUG_MODE` | `true/false`                  | `false`       | Enable comprehensive debugging |
| `LOG_LEVEL`  | `trace/debug/info/warn/error` | `info`        | Logging verbosity              |
| `NODE_ENV`   | `development/production`      | `development` | Environment mode               |

### Request/Response Debugging

| Variable         | Values       | Default | Description                     |
| ---------------- | ------------ | ------- | ------------------------------- |
| `DEBUG_REQUESTS` | `true/false` | `false` | Log all HTTP requests/responses |
| `DEBUG_BODIES`   | `true/false` | `false` | Log request/response bodies     |
| `DEBUG_HEADERS`  | `true/false` | `false` | Log HTTP headers                |

### Database Debugging

| Variable    | Values       | Default | Description                     |
| ----------- | ------------ | ------- | ------------------------------- |
| `DEBUG_SQL` | `true/false` | `false` | Log all SQL queries with timing |

---

## 📝 Logger Usage

### Import the Logger

```javascript
import { createLogger } from './utils/logger.js';

const logger = createLogger('MyController');
```

### Log Levels

```javascript
// Info - General information
logger.info('User logged in', { userId: 123, username: 'john' });

// Success - Successful operations
logger.success('Sale created successfully', { saleId: 456 });

// Warning - Potential issues
logger.warn('Low stock detected', { productId: 789, stock: 5 });

// Error - Errors and exceptions
logger.error('Failed to save data', { error: err.message });

// Debug - Detailed debugging info (only in debug mode)
logger.debug('Processing payment', { amount: 100, method: 'cash' });

// Trace - Very detailed tracing (only in debug mode)
logger.trace('Variable state', { variables: { x: 1, y: 2 } });
```

### Special Logging Methods

```javascript
// Log database queries
logger.query('SELECT', { table: 'users', where: { id: 1 } });

// Log HTTP requests
logger.request('GET', '/api/sales', { userId: 123 });

// Log HTTP responses
logger.response('GET', '/api/sales', 200, 45); // 45ms duration

// Log performance metrics
logger.performance('calculateTotal', 150, { items: 10 });
```

---

## 🌐 Debug Endpoints

When `DEBUG_MODE=true` or `NODE_ENV=development`, the following endpoints are available:

### Health Check

```
GET /debug/health
```

Returns server health status, uptime, and memory usage.

### Application Statistics

```
GET /debug/stats
```

Returns comprehensive statistics including:

- Uptime
- Memory usage
- Database query statistics
- Process information

### Query Statistics

```
GET /debug/queries
```

Returns database query statistics:

- Total queries
- Queries by type (SELECT, INSERT, UPDATE, DELETE)
- Queries by table
- Slow query log

### Print Query Stats to Console

```
GET /debug/queries/print
```

Prints detailed query statistics to the server console.

### Reset Query Statistics

```
POST /debug/queries/reset
```

Resets all query statistics counters.

### Configuration Info

```
GET /debug/config
```

Returns current debug configuration (sanitized, no secrets).

### List All Routes

```
GET /debug/routes
```

Lists all registered API routes in the application.

### Send Test Log

```
POST /debug/log
Body: {
  "level": "info",
  "message": "Test message",
  "data": { "key": "value" }
}
```

Sends a test log message to verify logging is working.

### Trigger Test Error

```
GET /debug/error
```

Triggers a test error to verify error handling.

---

## 💾 Database Query Tracking

### Automatic Query Logging

When `DEBUG_SQL=true`, all queries are automatically logged with:

- Operation type (SELECT, INSERT, UPDATE, DELETE)
- Table name
- Query parameters
- Execution time
- Success/failure status

### Manual Query Tracking

```javascript
import { trackQuery } from './utils/dbLogger.js';

// Wrap your database operation
const result = await trackQuery('SELECT', 'users', async () => {
  return await db.select().from(users).where(eq(users.id, userId));
});
```

### Slow Query Detection

Queries taking more than 100ms are automatically flagged as slow and logged with warnings:

```
⚠️  WARN [Database] Slow query detected { operation: 'SELECT', table: 'sales', duration: 342 }
```

### Query Statistics

Access query statistics programmatically:

```javascript
import { getQueryStats } from './utils/dbLogger.js';

const stats = getQueryStats();
console.log(stats);
// {
//   total: 1234,
//   byType: { SELECT: 800, INSERT: 200, UPDATE: 150, DELETE: 84 },
//   byTable: { users: 300, sales: 500, products: 434 },
//   slowQueries: [...]
// }
```

---

## ⚡ Performance Monitoring

### Request-Level Performance Tracking

Use the `trackPerformance` helper added to each request:

```javascript
export const myController = async (request, reply) => {
  const endTracking = request.trackPerformance('myController');

  try {
    // Your logic here
    const result = await someOperation();

    return result;
  } finally {
    const duration = endTracking(); // Logs performance automatically
  }
};
```

### Custom Performance Logging

```javascript
import { createLogger } from './utils/logger.js';

const logger = createLogger('MyService');

const startTime = Date.now();
// ... operation ...
const duration = Date.now() - startTime;

logger.performance('operationName', duration, { items: 100 });
```

---

## 🎯 Best Practices

### 1. Use Context-Specific Loggers

```javascript
// ✅ Good - Clear context
const logger = createLogger('SaleController');
logger.info('Sale created', { saleId: 123 });

// ❌ Bad - Generic logger
logger.info('Something happened');
```

### 2. Include Relevant Metadata

```javascript
// ✅ Good - Rich context
logger.info('Payment processed', {
  saleId: 123,
  amount: 100.5,
  method: 'cash',
  userId: 456,
});

// ❌ Bad - Vague
logger.info('Payment done');
```

### 3. Use Appropriate Log Levels

```javascript
// ✅ Good - Correct levels
logger.debug('Validating input data', { data }); // Development only
logger.info('Sale created successfully'); // General info
logger.warn('Low stock alert', { productId }); // Warnings
logger.error('Failed to save', { error }); // Errors

// ❌ Bad - Everything as info
logger.info('Validating...');
logger.info('Error happened');
```

### 4. Sanitize Sensitive Data

```javascript
// ✅ Good - No sensitive data
logger.info('User login attempt', {
  username: 'john',
  // password is automatically sanitized
});

// ❌ Bad - Exposing sensitive data
logger.info('Raw credentials', { username, password });
```

### 5. Disable Debug in Production

```env
# .env.production
DEBUG_MODE=false
LOG_LEVEL=error
DEBUG_REQUESTS=false
DEBUG_SQL=false
```

### 6. Track Performance for Slow Operations

```javascript
// For operations that might be slow
const endTracking = request.trackPerformance('complexCalculation');
const result = await performComplexCalculation();
endTracking(); // Automatically warns if > 1s
```

---

## 📊 Example Output

### Request Logging

```
INFO [Debugger:Request] API Request {
  requestId: "req-1",
  method: "POST",
  url: "/api/sales",
  ip: "127.0.0.1",
  userAgent: "Mozilla/5.0..."
}
```

### Query Logging

```
DEBUG [Database] Database Query {
  operation: "SELECT",
  table: "sales",
  where: { customerId: 123 },
  duration: 45
}
```

### Performance Warning

```
WARN [SaleController:Performance] generateReport took 1250ms {
  requestId: "req-1",
  method: "GET",
  url: "/api/sales/report"
}
```

---

## 🚨 Troubleshooting

### Logs Not Showing

1. Check `LOG_LEVEL` - set to `debug` for detailed logs
2. Verify `DEBUG_MODE=true` in `.env`
3. Restart the server after changing `.env`

### Too Many Logs

1. Set `DEBUG_MODE=false` for normal operation
2. Adjust `LOG_LEVEL` to `info` or `warn`
3. Disable specific debug flags: `DEBUG_REQUESTS=false`, `DEBUG_SQL=false`

### Performance Issues

If logging affects performance:

1. Disable `DEBUG_BODIES=false` (body logging is expensive)
2. Set `LOG_LEVEL=warn` (only warnings and errors)
3. Disable `DEBUG_SQL=false` (query logging adds overhead)

---

## 📚 Additional Resources

- [Pino Documentation](https://getpino.io/)
- [Fastify Logging Guide](https://fastify.dev/docs/latest/Reference/Logging/)
- Project specific: See `/src/utils/logger.js` for implementation

---

**Happy Debugging! 🐛✨**
