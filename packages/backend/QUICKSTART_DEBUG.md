# 🚀 Quick Start - Debug System

## Enable Debugging (3 Steps)

### 1. Edit `.env`

Open `packages/backend/.env` and uncomment these lines:

```env
DEBUG_MODE=true
LOG_LEVEL=debug
DEBUG_REQUESTS=true
DEBUG_SQL=true
```

### 2. Start Server

```bash
cd packages/backend
pnpm dev
```

### 3. Watch the Logs!

You'll see detailed logs like:

```
INFO  [Debugger:Request] API Request { method: 'GET', url: '/api/sales' }
DEBUG [Database] Database Query { operation: 'SELECT', table: 'sales', duration: 45ms }
INFO  [Debugger:Response] GET /api/sales - 200 (52ms)
```

---

## Use in Your Code

### Add Logger to Controller

```javascript
import { createLogger } from './utils/logger.js';

const logger = createLogger('MyController');

export const myController = async (request, reply) => {
  logger.info('Handling request', { userId: request.user?.id });

  try {
    const result = await doSomething();
    logger.success('Operation completed', { resultId: result.id });
    return result;
  } catch (error) {
    logger.error('Operation failed', { error: error.message });
    throw error;
  }
};
```

### Track Database Queries

```javascript
import { trackQuery } from './utils/dbLogger.js';

// Automatically logs query and execution time
const users = await trackQuery('SELECT', 'users', async () => {
  return await db.select().from(users);
});
```

### Track Performance

```javascript
export const slowOperation = async (request, reply) => {
  const endTracking = request.trackPerformance('operationName');

  // Your code here
  const result = await doWork();

  endTracking(); // Logs duration automatically
  return result;
};
```

---

## Debug Endpoints

Visit these URLs in your browser or use curl:

```bash
# Server health & stats
http://localhost:3050/debug/health
http://localhost:3050/debug/stats

# Query statistics
http://localhost:3050/debug/queries

# List all routes
http://localhost:3050/debug/routes

# Current configuration
http://localhost:3050/debug/config
```

---

## Log Levels

```javascript
logger.debug('Detailed debugging info'); // Development only
logger.info('General information'); // Always logged
logger.success('Success message'); // Highlighted
logger.warn('Warning message'); // Yellow warning
logger.error('Error occurred', { error }); // Red error
```

---

## Disable for Production

```env
DEBUG_MODE=false
LOG_LEVEL=error
DEBUG_REQUESTS=false
DEBUG_SQL=false
```

---

## Files Added (No Existing Code Changed!)

✅ `src/utils/logger.js` - Enhanced logger utility
✅ `src/utils/dbLogger.js` - Database query logger
✅ `src/plugins/debugger.js` - Fastify debug plugin
✅ `src/routes/debugRoutes.js` - Debug API endpoints
✅ `DEBUG_GUIDE.md` - Complete documentation
✅ `DEBUG_README.md` - Overview
✅ `EXAMPLES_DEBUG.js` - Code examples
✅ `.env.debug` - Configuration template

Modified files (only additions):

- `src/server.js` - Added plugin & route registration
- `.env` - Added debug settings (commented out)

---

## Need Help?

📖 **Full Documentation**: See `DEBUG_GUIDE.md`
💡 **Code Examples**: See `EXAMPLES_DEBUG.js`
⚙️ **All Options**: See `.env.debug`

---

**That's it! Happy debugging! 🐛✨**
