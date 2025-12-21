/**
 * Example: How to Use the Debug System
 * مثال: كيفية استخدام نظام التصحيح
 *
 * This file shows examples of how to use the debugging system
 * in your controllers, services, and other parts of the backend.
 *
 * هذا الملف يوضح أمثلة لكيفية استخدام نظام التصحيح
 * في الـ controllers والـ services وأجزاء أخرى من الـ backend
 */

import { createLogger } from '../utils/logger.js';
import { trackQuery } from '../utils/dbLogger.js';

// ========================================
// EXAMPLE 1: Basic Controller Logging
// مثال 1: تسجيل أساسي في Controller
// ========================================

const logger = createLogger('ExampleController');

export const exampleController = async (request, reply) => {
  // Log incoming request info
  logger.info('Processing request', {
    userId: request.user?.id,
    params: request.params,
  });

  try {
    // Your business logic here
    const result = await someOperation();

    // Log success
    logger.success('Operation completed successfully', {
      resultId: result.id,
    });

    return result;
  } catch (error) {
    // Log error
    logger.error('Operation failed', {
      error: error.message,
      userId: request.user?.id,
    });

    throw error;
  }
};

// ========================================
// EXAMPLE 2: Service with Database Queries
// مثال 2: Service مع استعلامات قاعدة البيانات
// ========================================

const serviceLogger = createLogger('ExampleService');

export const exampleService = {
  async createSale(saleData) {
    serviceLogger.debug('Creating new sale', { saleData });

    // Track database query performance
    const result = await trackQuery('INSERT', 'sales', async () => {
      // Your database insert logic
      return await db.insert(sales).values(saleData).returning();
    });

    serviceLogger.success('Sale created', { saleId: result[0].id });
    return result[0];
  },

  async getSaleById(id) {
    serviceLogger.debug('Fetching sale', { id });

    const result = await trackQuery('SELECT', 'sales', async () => {
      return await db.select().from(sales).where(eq(sales.id, id));
    });

    if (result.length === 0) {
      serviceLogger.warn('Sale not found', { id });
      return null;
    }

    serviceLogger.debug('Sale found', { id, sale: result[0] });
    return result[0];
  },
};

// ========================================
// EXAMPLE 3: Performance Tracking in Routes
// مثال 3: تتبع الأداء في Routes
// ========================================

export const performanceExampleRoute = async (request, reply) => {
  // Start tracking performance
  const endTracking = request.trackPerformance('complexCalculation');

  try {
    // Simulate complex operation
    const result = await performComplexCalculation();

    // End tracking (automatically logs if > 1s)
    const duration = endTracking();

    logger.info('Calculation completed', { duration, itemCount: result.length });

    return result;
  } catch (error) {
    endTracking(); // Still track even on error
    throw error;
  }
};

// ========================================
// EXAMPLE 4: Debug Helper in Request
// مثال 4: مساعد التصحيح في الطلب
// ========================================

export const debugHelperExample = async (request, reply) => {
  // Use request.debug() for inline debugging
  request.debug('Starting validation', {
    bodyKeys: Object.keys(request.body),
  });

  const validatedData = validateInput(request.body);

  request.debug('Validation completed', {
    isValid: true,
    fieldCount: Object.keys(validatedData).length,
  });

  // Process data...
  const result = await processData(validatedData);

  request.debug('Processing completed', {
    resultSize: JSON.stringify(result).length,
  });

  return result;
};

// ========================================
// EXAMPLE 5: Different Log Levels
// مثال 5: مستويات تسجيل مختلفة
// ========================================

export const logLevelExamples = async (request, reply) => {
  const logger = createLogger('LogLevels');

  // TRACE - Most detailed, only in debug mode
  logger.trace('Variable dump', {
    variables: { x: 1, y: 2, z: 3 },
  });

  // DEBUG - Detailed info for debugging
  logger.debug('Processing step 1', {
    step: 1,
    data: request.body,
  });

  // INFO - General information
  logger.info('User action performed', {
    action: 'purchase',
    userId: request.user.id,
  });

  // SUCCESS - Successful operations (custom)
  logger.success('Payment processed', {
    amount: 100,
    method: 'card',
  });

  // WARN - Warnings, potential issues
  logger.warn('Low stock detected', {
    productId: 123,
    currentStock: 5,
    threshold: 10,
  });

  // ERROR - Errors and exceptions
  try {
    throw new Error('Something went wrong');
  } catch (error) {
    logger.error('Operation failed', {
      error: error.message,
      stack: error.stack,
    });
  }

  return { logged: true };
};

// ========================================
// EXAMPLE 6: Manual Query Logging
// مثال 6: تسجيل الاستعلامات يدوياً
// ========================================

import { logQuery } from '../utils/dbLogger.js';

export const manualQueryLogging = async () => {
  const startTime = Date.now();

  try {
    // Your database operation
    const result = await db.select().from(products);

    const duration = Date.now() - startTime;

    // Log the query
    logQuery(
      'SELECT',
      'products',
      {
        where: { status: 'active' },
        limit: 100,
      },
      duration
    );

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;

    logQuery(
      'SELECT',
      'products',
      {
        error: error.message,
        success: false,
      },
      duration
    );

    throw error;
  }
};

// ========================================
// EXAMPLE 7: Context-Specific Loggers
// مثال 7: Loggers خاصة بالسياق
// ========================================

// Create loggers for different parts of your app
const authLogger = createLogger('AuthService');
const paymentLogger = createLogger('PaymentService');
const notificationLogger = createLogger('NotificationService');

export const contextSpecificLogging = {
  async login(username, password) {
    authLogger.info('Login attempt', { username });

    try {
      // Authentication logic
      authLogger.success('Login successful', { username });
    } catch (error) {
      authLogger.error('Login failed', { username, error });
      throw error;
    }
  },

  async processPayment(amount, method) {
    paymentLogger.info('Processing payment', { amount, method });

    // Payment logic
    paymentLogger.success('Payment processed', { amount, method });
  },

  async sendNotification(userId, message) {
    notificationLogger.debug('Sending notification', { userId });

    // Send notification
    notificationLogger.info('Notification sent', { userId });
  },
};

// ========================================
// EXAMPLE 8: Performance Comparison
// مثال 8: مقارنة الأداء
// ========================================

export const performanceComparison = async () => {
  const logger = createLogger('Performance');

  // Method 1
  const start1 = Date.now();
  await method1();
  const duration1 = Date.now() - start1;
  logger.performance('method1', duration1);

  // Method 2
  const start2 = Date.now();
  await method2();
  const duration2 = Date.now() - start2;
  logger.performance('method2', duration2);

  // Compare
  logger.info('Performance comparison', {
    method1: `${duration1}ms`,
    method2: `${duration2}ms`,
    faster: duration1 < duration2 ? 'method1' : 'method2',
  });
};

// ========================================
// HOW TO ENABLE/DISABLE
// كيفية التفعيل/التعطيل
// ========================================

/*
Add to your .env file:

# Enable full debug mode
DEBUG_MODE=true

# Set log level (trace, debug, info, warn, error)
LOG_LEVEL=debug

# Enable request logging
DEBUG_REQUESTS=true

# Enable body logging
DEBUG_BODIES=true

# Enable SQL query logging
DEBUG_SQL=true

# Enable header logging
DEBUG_HEADERS=true
*/

// ========================================
// ACCESSING DEBUG ENDPOINTS
// الوصول إلى نقاط التصحيح
// ========================================

/*
Available endpoints when DEBUG_MODE=true:

GET  /debug/health        - Server health check
GET  /debug/stats         - Application statistics
GET  /debug/queries       - Query statistics
GET  /debug/queries/print - Print query stats to console
POST /debug/queries/reset - Reset query statistics
GET  /debug/config        - Current debug configuration
GET  /debug/routes        - List all routes
POST /debug/log           - Send test log
GET  /debug/error         - Trigger test error

Example:
curl http://localhost:3050/debug/stats
curl http://localhost:3050/debug/queries
*/
