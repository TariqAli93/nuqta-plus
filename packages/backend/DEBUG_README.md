# 🔍 Backend Debugging System

A comprehensive debugging system has been added to your nuqtaplus backend **without modifying any existing code**.

## 📦 What Was Added

### 1. **Enhanced Logger** (`src/utils/logger.js`)

- Context-aware logging with multiple levels
- Automatic sensitive data sanitization
- Performance tracking
- Database query logging
- Colored output for better readability

### 2. **Debug Plugin** (`src/plugins/debugger.js`)

- Automatic request/response logging
- Request body logging (sanitized)
- Performance monitoring
- User context tracking
- Slow request detection

### 3. **Database Query Logger** (`src/utils/dbLogger.js`)

- Tracks all database operations
- Measures query execution time
- Detects slow queries (> 100ms)
- Provides statistics by operation type and table
- Query analytics and reporting

### 4. **Debug Routes** (`src/routes/debugRoutes.js`)

- `/debug/health` - Health check
- `/debug/stats` - Application statistics
- `/debug/queries` - Query statistics
- `/debug/config` - Configuration info
- `/debug/routes` - List all routes
- More endpoints for testing and monitoring

### 5. **Documentation**

- `DEBUG_GUIDE.md` - Complete debugging guide
- `EXAMPLES_DEBUG.js` - Code examples
- `.env.debug` - Debug configuration template

## 🚀 Quick Start

### Enable Debug Mode

Edit your `.env` file and uncomment these lines:

```env
DEBUG_MODE=true
LOG_LEVEL=debug
DEBUG_REQUESTS=true
DEBUG_SQL=true
```

### Start Server

```bash
pnpm dev
```

You'll now see detailed logs like:

```
INFO  [Debugger:Request] API Request { method: 'GET', url: '/api/sales', ... }
DEBUG [Database] Database Query { operation: 'SELECT', table: 'sales', duration: 45 }
INFO  [Debugger:Response] GET /api/sales - 200 (52ms)
```

## 📊 Using the Logger

### In Your Controllers

```javascript
import { createLogger } from './utils/logger.js';

const logger = createLogger('SaleController');

export const createSale = async (request, reply) => {
  logger.info('Creating sale', { userId: request.user.id });

  try {
    const sale = await saleService.create(request.body);
    logger.success('Sale created', { saleId: sale.id });
    return sale;
  } catch (error) {
    logger.error('Failed to create sale', { error: error.message });
    throw error;
  }
};
```

### In Your Services

```javascript
import { trackQuery } from './utils/dbLogger.js';

const result = await trackQuery('SELECT', 'sales', async () => {
  return await db.select().from(sales).where(eq(sales.id, id));
});
```

### Performance Tracking

```javascript
export const complexOperation = async (request, reply) => {
  const endTracking = request.trackPerformance('complexOperation');

  // Your code here

  endTracking(); // Automatically logs duration
};
```

## 🔍 Debug Endpoints

When debug mode is enabled, access these endpoints:

```bash
# Get server statistics
curl http://localhost:3050/debug/stats

# Get query statistics
curl http://localhost:3050/debug/queries

# List all routes
curl http://localhost:3050/debug/routes

# Get configuration
curl http://localhost:3050/debug/config
```

## ⚙️ Environment Variables

| Variable         | Description                                 | Default |
| ---------------- | ------------------------------------------- | ------- |
| `DEBUG_MODE`     | Enable full debug mode                      | `false` |
| `LOG_LEVEL`      | Logging level (trace/debug/info/warn/error) | `info`  |
| `DEBUG_REQUESTS` | Log all HTTP requests                       | `false` |
| `DEBUG_BODIES`   | Log request/response bodies                 | `false` |
| `DEBUG_HEADERS`  | Log HTTP headers                            | `false` |
| `DEBUG_SQL`      | Log SQL queries                             | `false` |

## 🎯 Features

### ✅ Request Tracking

- Automatically logs all incoming requests
- Tracks request duration
- Logs response status codes
- Captures user context

### ✅ Database Monitoring

- Logs all database queries
- Measures query execution time
- Detects slow queries
- Provides query statistics

### ✅ Performance Monitoring

- Tracks operation duration
- Warns about slow operations
- Provides performance metrics

### ✅ Error Tracking

- Captures all errors
- Logs error details and stack traces
- Tracks error frequency

### ✅ Security

- Automatically sanitizes sensitive data
- Passwords, tokens, secrets are redacted
- Safe for production use

## 📝 Log Levels

```javascript
logger.trace('Very detailed info'); // Only in debug mode
logger.debug('Debugging info'); // Development only
logger.info('General information'); // Always logged
logger.success('Success messages'); // Highlighted success
logger.warn('Warning messages'); // Potential issues
logger.error('Error messages'); // Errors
```

## 🚨 Production Use

For production, disable debug features:

```env
DEBUG_MODE=false
LOG_LEVEL=warn
DEBUG_REQUESTS=false
DEBUG_SQL=false
```

Debug routes are automatically disabled in production.

## 📚 Documentation

- **Full Guide**: See `DEBUG_GUIDE.md` for detailed documentation
- **Examples**: See `EXAMPLES_DEBUG.js` for code examples
- **Config Template**: See `.env.debug` for all options

## 🛠️ What Was NOT Changed

- ✅ No existing controllers modified
- ✅ No existing services modified
- ✅ No existing routes modified
- ✅ No existing logic changed
- ✅ Only **additions**, no deletions

Everything is optional and can be enabled/disabled via environment variables.

## 📞 Support

For questions or issues:

1. Check `DEBUG_GUIDE.md`
2. Check `EXAMPLES_DEBUG.js`
3. Visit debug endpoints for diagnostics

---

**Happy Debugging! 🐛✨**
