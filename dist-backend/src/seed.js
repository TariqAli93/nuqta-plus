import db, { saveDatabase } from './db.js';
import { roles, permissions, rolePermissions } from './models/index.js';
import { sql, eq } from 'drizzle-orm';

async function seed() {
  console.log('🌱 Starting database seeding...\n');

  try {
    // Helper: Count rows of a table
    const countTable = async (table) => {
      const result = await db
        .select({ count: sql`count(*)` })
        .from(table)
        .get();
      return Number(result?.count || 0);
    };

    // Helper: Insert if table empty (preserve existing data)
    const insertIfEmpty = async (table, data, label) => {
      const count = await countTable(table);
      if (count === 0) {
        await db.insert(table).values(data);
        console.log(`✓ ${label} inserted`);
      } else {
        console.log(`↩️ ${label} already exist`);
      }
    };

    // Helper: Ensure role exists and return role row
    const ensureRole = async (name, description) => {
      const [existing] = await db.select().from(roles).where(eq(roles.name, name)).limit(1);
      if (existing) return existing;
      const [newRole] = await db.insert(roles).values({ name, description }).returning();
      console.log(`✓ Role '${name}' created`);
      return newRole;
    };

    // ========== ROLES ==========
    console.log('→ Creating roles...');
    await insertIfEmpty(
      roles,
      [
        { name: 'admin', description: 'Administrator with full access' },
        { name: 'cashier', description: 'Cashier role with limited access' },
      ],
      'Roles'
    );
    // جميع الصلاحيات المتاحة في النظام - الأدمن يحصل على كل شيء
    const permissionsList = {
      users: ['view', 'create', 'read', 'update', 'delete'],
      permissions: ['view', 'create', 'read', 'update', 'delete'],
      roles: ['view', 'create', 'read', 'update', 'delete'],
      customers: ['view', 'create', 'read', 'update', 'delete'],
      products: ['view', 'create', 'read', 'update', 'delete'],
      sales: ['view', 'create', 'read', 'update', 'delete'],
      categories: ['view', 'create', 'read', 'update', 'delete'],
      reports: ['view', 'read'],
      dashboard: ['view', 'read'],
      settings: ['view', 'read', 'update', 'create', 'delete'],
    };

    // صلاحيات الكاشير - محددة بدقة وفقاً للمتطلبات
    const cashierPermissions = {
      // الإعدادات: القراءة والعرض فقط (بدون تعديل أو حذف)
      settings: ['view', 'read'],

      // الأصناف: جميع الصلاحيات الكاملة (ملاحظة: حذف مقتصر على الأدمن فقط، سيتم سحب delete لاحقاً)
      categories: ['view', 'create', 'read', 'update', 'delete'],

      // المنتجات: العرض والقراءة والتعديل (بدون إنشاء أو حذف)
      products: ['view', 'read', 'update'],

      // المبيعات: جميع الصلاحيات ما عدا الحذف
      sales: ['view', 'create', 'read', 'update'],

      // العملاء: جميع الصلاحيات ما عدا الحذف
      customers: ['view', 'create', 'read', 'update'],

      // لوحة التحكم: الوصول الكامل مع صلاحية القراءة فقط
      dashboard: ['view', 'read'],

      // التقارير: العرض والقراءة فقط
      reports: ['view', 'read'],
    };

    // ========== PERMISSIONS ==========
    console.log('\n→ Creating permissions...');
    // Build full permission objects and insert missing ones
    const allPermissionObjs = Object.entries(permissionsList).flatMap(([resource, actions]) =>
      actions.map((action) => ({
        resource,
        action,
        name: `${action}:${resource}`,
        description: `${action.charAt(0).toUpperCase() + action.slice(1)} permission for ${resource}`,
      }))
    );

    // Existing permission names
    const existingPermissions = await db.select({ name: permissions.name }).from(permissions).all();
    const existingNames = new Set(existingPermissions.map((p) => p.name));

    const toInsert = allPermissionObjs.filter((p) => !existingNames.has(p.name));
    if (toInsert.length) {
      await db.insert(permissions).values(toInsert);
      console.log(`✓ Inserted ${toInsert.length} new permissions`);
    } else {
      console.log('↩️ No new permissions to insert');
    }

    // ========== ROLES ↔ PERMISSIONS ==========
    console.log('\n→ Assigning permissions to roles...');

    // Ensure roles exist
    const adminRole = await ensureRole('admin', 'Administrator with full access');
    const cashierRole = await ensureRole('cashier', 'Cashier role with limited access');

    // Refresh all permissions
    const allPerms = await db.select().from(permissions).all();

    // Helper to get permission ids by name
    const permIdsByName = (names) =>
      allPerms.filter((p) => names.includes(p.name)).map((p) => p.id);

    // Build admin permission names (all permissions)
    const adminPermissionNames = allPerms.map((p) => p.name);

    // For cashier: gather names from cashierPermissions mapping
    // but ensure delete is reserved for admin only
    const cashierPermissionNames = Object.entries(cashierPermissions).flatMap(
      ([resource, actions]) =>
        actions
          .filter((action) => action !== 'delete') // Admin-only deletion enforcement
          .map((action) => `${action}:${resource}`)
    );

    // Remove duplicates and ensure names are present in allPerms
    const distinctCashierPerms = Array.from(new Set(cashierPermissionNames)).filter((name) =>
      allPerms.some((p) => p.name === name)
    );

    // Delete existing mappings and re-insert for safety (idempotency)
    await db.delete(rolePermissions).where(eq(rolePermissions.roleId, adminRole.id));
    const adminValues = permIdsByName(adminPermissionNames).map((permissionId) => ({
      roleId: adminRole.id,
      permissionId,
    }));
    if (adminValues.length) await db.insert(rolePermissions).values(adminValues);

    await db.delete(rolePermissions).where(eq(rolePermissions.roleId, cashierRole.id));
    const cashierValues = permIdsByName(distinctCashierPerms).map((permissionId) => ({
      roleId: cashierRole.id,
      permissionId,
    }));
    if (cashierValues.length) await db.insert(rolePermissions).values(cashierValues);

    console.log(
      '✓ Role-permission mapping completed (admin: all, cashier: limited without delete)'
    );

    // ========== DEFAULT CUSTOMER ==========
    // console.log('\n→ Creating default customer...');
    // await insertIfEmpty(
    //   customers,
    //   [
    //     {
    //       name: 'عميل افتراضي',
    //     },
    //   ],
    //   'Customers'
    // );

    // // ========== CURRENCY SETTINGS ==========
    // console.log('\n→ Creating currency settings...');
    // const settingsCount = await countTable(settings);
    // if (settingsCount === 0) {
    //   await db.insert(settings).values([
    //     {
    //       key: 'currency.default',
    //       value: 'IQD',
    //       description: 'العملة الافتراضية للنظام',
    //     },
    //     {
    //       key: 'currency.usd_rate',
    //       value: '1500',
    //       description: 'سعر صرف الدولار الأمريكي مقابل الدينار العراقي',
    //     },
    //     {
    //       key: 'currency.iqd_rate',
    //       value: '1',
    //       description: 'سعر صرف الدينار العراقي (العملة المرجعية)',
    //     },
    //   ]);
    //   console.log('✓ Currency settings inserted');
    // } else {
    //   console.log('↩️ Settings already exist');
    // }

    // // ========== CURRENCY SETTINGS TABLE ==========
    // console.log('\n→ Creating currency settings table records...');
    // const currencySettingsCount = await countTable(currencySettings);
    // if (currencySettingsCount === 0) {
    //   await db.insert(currencySettings).values([
    //     {
    //       currencyCode: 'USD',
    //       currencyName: 'US Dollar',
    //       symbol: '$',
    //       exchangeRate: 1,
    //       isBaseCurrency: true,
    //       isActive: true,
    //     },
    //     {
    //       currencyCode: 'IQD',
    //       currencyName: 'Iraqi Dinar',
    //       symbol: 'د.ع',
    //       exchangeRate: 1500,
    //       isBaseCurrency: false,
    //       isActive: true,
    //     },
    //   ]);
    //   console.log('✓ Currency settings table seeded');
    // } else {
    //   console.log('↩️ Currency settings already exist');
    // }

    // // ========== DEMO DATA: CATALOG & SALES ==========
    // console.log('\n→ Creating demo catalog and sales data...');

    // // Categories
    // let categoryRows = await db
    //   .select({ id: categories.id, name: categories.name })
    //   .from(categories)
    //   .all();

    // if (categoryRows.length === 0) {
    //   categoryRows = await db
    //     .insert(categories)
    //     .values([
    //       { name: 'هواتف وحواسيب', description: 'أجهزة وإكسسوارات' },
    //       { name: 'بقالة', description: 'مواد غذائية يومية' },
    //       { name: 'إكسسوارات', description: 'ملحقات وأدوات مساعدة' },
    //     ])
    //     .returning({ id: categories.id, name: categories.name });
    //   console.log('✓ Demo categories inserted');
    // } else {
    //   console.log('↩️ Categories already exist, skipping insert');
    // }

    // const catId = (name) => categoryRows.find((c) => c.name === name)?.id;

    // // Products
    // let productRows = await db
    //   .select({ id: products.id, name: products.name, sellingPrice: products.sellingPrice })
    //   .from(products)
    //   .all();

    // if (productRows.length === 0) {
    //   productRows = await db
    //     .insert(products)
    //     .values([
    //       {
    //         name: 'iPhone 15',
    //         sku: 'SKU-IPH-15',
    //         barcode: '111222333444',
    //         categoryId: catId('هواتف وحواسيب'),
    //         description: 'هاتف ذكي بشاشة OLED',
    //         costPrice: 800,
    //         sellingPrice: 950,
    //         currency: 'USD',
    //         stock: 25,
    //         minStock: 5,
    //         unit: 'piece',
    //         supplier: 'Apple',
    //         status: 'available',
    //       },
    //       {
    //         name: 'Laptop Pro 14',
    //         sku: 'SKU-LTP-014',
    //         barcode: '555666777888',
    //         categoryId: catId('هواتف وحواسيب'),
    //         description: 'حاسوب محمول للأعمال',
    //         costPrice: 900,
    //         sellingPrice: 1150,
    //         currency: 'USD',
    //         stock: 12,
    //         minStock: 3,
    //         unit: 'piece',
    //         supplier: 'TechSupplier',
    //         status: 'available',
    //       },
    //       {
    //         name: 'رز بسمتي 5كغ',
    //         sku: 'SKU-RICE-5KG',
    //         barcode: '999000111222',
    //         categoryId: catId('بقالة'),
    //         description: 'أرز أبيض طويل الحبة',
    //         costPrice: 8,
    //         sellingPrice: 12,
    //         currency: 'USD',
    //         stock: 150,
    //         minStock: 40,
    //         unit: 'bag',
    //         supplier: 'Al Grain',
    //         status: 'available',
    //       },
    //       {
    //         name: 'شاحن سريع 65W',
    //         sku: 'SKU-CHG-065',
    //         barcode: '333444555666',
    //         categoryId: catId('إكسسوارات'),
    //         description: 'شاحن USB-C بقدرة عالية',
    //         costPrice: 8,
    //         sellingPrice: 15,
    //         currency: 'USD',
    //         stock: 80,
    //         minStock: 15,
    //         unit: 'piece',
    //         supplier: 'Voltix',
    //         status: 'available',
    //       },
    //     ])
    //     .returning({ id: products.id, name: products.name, sellingPrice: products.sellingPrice });
    //   console.log('✓ Demo products inserted');
    // } else {
    //   console.log('↩️ Products already exist, skipping insert');
    // }

    // const productByName = (name) => productRows.find((p) => p.name === name);

    // // Customers
    // let customerRows = await db
    //   .select({ id: customers.id, name: customers.name })
    //   .from(customers)
    //   .all();

    // if (customerRows.length === 0) {
    //   customerRows = await db
    //     .insert(customers)
    //     .values([
    //       {
    //         name: 'علي محمد',
    //         phone: '07701234567',
    //         address: 'بغداد - الكرادة',
    //         city: 'بغداد',
    //         notes: 'عميل نقدي متكرر',
    //       },
    //       {
    //         name: 'سارة أحمد',
    //         phone: '07809876543',
    //         address: 'بغداد - المنصور',
    //         city: 'بغداد',
    //         notes: 'تفضل الأقساط',
    //       },
    //       {
    //         name: 'شركة الراشد',
    //         phone: '07901112233',
    //         address: 'بغداد - الجادرية',
    //         city: 'بغداد',
    //         notes: 'حساب آجل مع فواتير شهرية',
    //       },
    //     ])
    //     .returning({ id: customers.id, name: customers.name });
    //   console.log('✓ Demo customers inserted');
    // } else {
    //   console.log('↩️ Customers already exist, skipping insert');
    // }

    // const customerByName = (name) => customerRows.find((c) => c.name === name);

    // // Sales & related tables (only if empty to avoid duplicates)
    // if ((await countTable(sales)) === 0) {
    //   const ali = customerByName('علي محمد');
    //   const sara = customerByName('سارة أحمد');

    //   const iphone = productByName('iPhone 15');
    //   const laptop = productByName('Laptop Pro 14');
    //   const rice = productByName('رز بسمتي 5كغ');
    //   const charger = productByName('شاحن سريع 65W');

    //   // Cash sale
    //   const iphoneTotal = (iphone?.sellingPrice ?? 950) - 50;
    //   const [cashSale] = await db
    //     .insert(sales)
    //     .values({
    //       invoiceNumber: 'INV-2001',
    //       customerId: ali?.id ?? null,
    //       subtotal: iphone?.sellingPrice ?? 950,
    //       discount: 50,
    //       tax: 0,
    //       total: iphoneTotal,
    //       currency: 'USD',
    //       exchangeRate: 1,
    //       interestRate: 0,
    //       interestAmount: 0,
    //       paymentType: 'cash',
    //       paidAmount: iphoneTotal,
    //       remainingAmount: 0,
    //       status: 'completed',
    //       notes: 'دفعة نقدية كاملة على جهاز واحد',
    //     })
    //     .returning({ id: sales.id });

    //   // Installment sale
    //   const laptopPrice = laptop?.sellingPrice ?? 1150;
    //   const ricePrice = rice?.sellingPrice ?? 12;
    //   const chargerPrice = charger?.sellingPrice ?? 15;
    //   const sale2Base = laptopPrice + ricePrice * 2 + chargerPrice;
    //   const sale2Discount = 60;
    //   const sale2Interest = 25;
    //   const sale2Total = sale2Base - sale2Discount + sale2Interest;

    //   const [installSale] = await db
    //     .insert(sales)
    //     .values({
    //       invoiceNumber: 'INV-2002',
    //       customerId: sara?.id ?? null,
    //       subtotal: sale2Base,
    //       discount: sale2Discount,
    //       tax: 0,
    //       total: sale2Total,
    //       currency: 'USD',
    //       exchangeRate: 1,
    //       interestRate: 2.5,
    //       interestAmount: sale2Interest,
    //       paymentType: 'installment',
    //       paidAmount: 300,
    //       remainingAmount: sale2Total - 300,
    //       status: 'pending',
    //       notes: 'خطة أقساط على ثلاث دفعات',
    //     })
    //     .returning({ id: sales.id });

    //   await db.insert(saleItems).values([
    //     {
    //       saleId: cashSale.id,
    //       productId: iphone?.id ?? null,
    //       productName: 'iPhone 15',
    //       quantity: 1,
    //       unitPrice: iphone?.sellingPrice ?? 950,
    //       discount: 50,
    //       subtotal: iphoneTotal,
    //     },
    //     {
    //       saleId: installSale.id,
    //       productId: laptop?.id ?? null,
    //       productName: 'Laptop Pro 14',
    //       quantity: 1,
    //       unitPrice: laptopPrice,
    //       discount: 40,
    //       subtotal: laptopPrice - 40,
    //     },
    //     {
    //       saleId: installSale.id,
    //       productId: rice?.id ?? null,
    //       productName: 'رز بسمتي 5كغ',
    //       quantity: 2,
    //       unitPrice: ricePrice,
    //       discount: 10,
    //       subtotal: ricePrice * 2 - 10,
    //     },
    //     {
    //       saleId: installSale.id,
    //       productId: charger?.id ?? null,
    //       productName: 'شاحن سريع 65W',
    //       quantity: 1,
    //       unitPrice: chargerPrice,
    //       discount: 0,
    //       subtotal: chargerPrice,
    //     },
    //   ]);

    //   await db.insert(payments).values([
    //     {
    //       saleId: cashSale.id,
    //       customerId: ali?.id ?? null,
    //       amount: iphoneTotal,
    //       currency: 'USD',
    //       exchangeRate: 1,
    //       paymentMethod: 'cash',
    //       notes: 'دفع كامل للفاتورة INV-2001',
    //     },
    //     {
    //       saleId: installSale.id,
    //       customerId: sara?.id ?? null,
    //       amount: 300,
    //       currency: 'USD',
    //       exchangeRate: 1,
    //       paymentMethod: 'cash',
    //       notes: 'الدفعة الأولى للأقساط',
    //     },
    //   ]);

    //   await db.insert(installments).values([
    //     {
    //       saleId: installSale.id,
    //       customerId: sara?.id ?? null,
    //       installmentNumber: 1,
    //       dueAmount: 300,
    //       paidAmount: 300,
    //       remainingAmount: 0,
    //       currency: 'USD',
    //       dueDate: '2025-01-15',
    //       paidDate: '2025-01-10',
    //       status: 'paid',
    //       notes: 'مدفوعة بالكامل',
    //     },
    //     {
    //       saleId: installSale.id,
    //       customerId: sara?.id ?? null,
    //       installmentNumber: 2,
    //       dueAmount: 300,
    //       paidAmount: 0,
    //       remainingAmount: 300,
    //       currency: 'USD',
    //       dueDate: '2025-02-15',
    //       status: 'pending',
    //       notes: 'دفعة قادمة',
    //     },
    //     {
    //       saleId: installSale.id,
    //       customerId: sara?.id ?? null,
    //       installmentNumber: 3,
    //       dueAmount: sale2Total - 600,
    //       paidAmount: 0,
    //       remainingAmount: sale2Total - 600,
    //       currency: 'USD',
    //       dueDate: '2025-03-15',
    //       status: 'pending',
    //       notes: 'دفعة أخيرة',
    //     },
    //   ]);

    //   await db.insert(inventoryTransactions).values([
    //     {
    //       productId: iphone?.id ?? null,
    //       type: 'out',
    //       quantity: 1,
    //       reference: 'INV-2001',
    //       notes: 'صرف مبيع نقدي',
    //     },
    //     {
    //       productId: laptop?.id ?? null,
    //       type: 'out',
    //       quantity: 1,
    //       reference: 'INV-2002',
    //       notes: 'صرف مبيع أقساط',
    //     },
    //     {
    //       productId: rice?.id ?? null,
    //       type: 'out',
    //       quantity: 2,
    //       reference: 'INV-2002',
    //       notes: 'صرف مواد استهلاكية',
    //     },
    //     {
    //       productId: charger?.id ?? null,
    //       type: 'out',
    //       quantity: 1,
    //       reference: 'INV-2002',
    //       notes: 'صرف إكسسوار مع الجهاز',
    //     },
    //   ]);

    //   console.log(
    //     '✓ Demo sales, items, payments, installments, and inventory transactions inserted'
    //   );
    // } else {
    //   console.log('↩️ Sales already exist, skipping demo sales');
    // }

    // Save DB to disk
    saveDatabase();

    console.log('\n🌱 Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error during seeding:', error.message);
    console.error(error.stack);
  }
}

seed();
