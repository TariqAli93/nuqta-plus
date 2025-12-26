import { getDb, saveDatabase } from './db.js';
import {
  customers,
  categories,
  products,
  sales,
  saleItems,
  payments,
  installments,
} from './models/index.js';
import { sql } from 'drizzle-orm';

async function seed() {
  console.log('🌱 Starting database seeding...\n');

  try {
    const db = await getDb();
    // Helper: Count rows of a table
    const countTable = async (table) => {
      const result = await db
        .select({ count: sql`count(*)` })
        .from(table)
        .get();
      return Number(result?.count || 0);
    };

    // ========== DEMO DATA: CATALOG & SALES ==========
    console.log('\n→ Creating demo catalog and sales data...');

    // Categories
    let categoryRows = await db
      .select({ id: categories.id, name: categories.name })
      .from(categories)
      .all();

    if (categoryRows.length === 0) {
      categoryRows = await db
        .insert(categories)
        .values([
          { name: 'هواتف وحواسيب', description: 'أجهزة وإكسسوارات' },
          { name: 'بقالة', description: 'مواد غذائية يومية' },
          { name: 'إكسسوارات', description: 'ملحقات وأدوات مساعدة' },
        ])
        .returning({ id: categories.id, name: categories.name });
      console.log('✓ Demo categories inserted');
    } else {
      console.log('↩️ Categories already exist, skipping insert');
    }

    const catId = (name) => categoryRows.find((c) => c.name === name)?.id;

    // Products
    let productRows = await db
      .select({ id: products.id, name: products.name, sellingPrice: products.sellingPrice })
      .from(products)
      .all();

    if (productRows.length === 0) {
      productRows = await db
        .insert(products)
        .values([
          {
            name: 'iPhone 15',
            sku: 'SKU-IPH-15',
            barcode: '111222333444',
            categoryId: catId('هواتف وحواسيب'),
            description: 'هاتف ذكي بشاشة OLED',
            costPrice: 800,
            sellingPrice: 950,
            currency: 'USD',
            stock: 25,
            minStock: 5,
            unit: 'piece',
            supplier: 'Apple',
            status: 'available',
          },
          {
            name: 'Laptop Pro 14',
            sku: 'SKU-LTP-014',
            barcode: '555666777888',
            categoryId: catId('هواتف وحواسيب'),
            description: 'حاسوب محمول للأعمال',
            costPrice: 900,
            sellingPrice: 1150,
            currency: 'USD',
            stock: 12,
            minStock: 3,
            unit: 'piece',
            supplier: 'TechSupplier',
            status: 'available',
          },
          {
            name: 'رز بسمتي 5كغ',
            sku: 'SKU-RICE-5KG',
            barcode: '999000111222',
            categoryId: catId('بقالة'),
            description: 'أرز أبيض طويل الحبة',
            costPrice: 8,
            sellingPrice: 12,
            currency: 'USD',
            stock: 150,
            minStock: 40,
            unit: 'bag',
            supplier: 'Al Grain',
            status: 'available',
          },
          {
            name: 'شاحن سريع 65W',
            sku: 'SKU-CHG-065',
            barcode: '333444555666',
            categoryId: catId('إكسسوارات'),
            description: 'شاحن USB-C بقدرة عالية',
            costPrice: 8,
            sellingPrice: 15,
            currency: 'USD',
            stock: 80,
            minStock: 15,
            unit: 'piece',
            supplier: 'Voltix',
            status: 'available',
          },
        ])
        .returning({ id: products.id, name: products.name, sellingPrice: products.sellingPrice });
      console.log('✓ Demo products inserted');
    } else {
      console.log('↩️ Products already exist, skipping insert');
    }

    const productByName = (name) => productRows.find((p) => p.name === name);

    // Customers
    let customerRows = await db
      .select({ id: customers.id, name: customers.name })
      .from(customers)
      .all();

    if (customerRows.length === 0) {
      customerRows = await db
        .insert(customers)
        .values([
          {
            name: 'علي محمد',
            phone: '07701234567',
            address: 'بغداد - الكرادة',
            city: 'بغداد',
            notes: 'عميل نقدي متكرر',
          },
          {
            name: 'سارة أحمد',
            phone: '07809876543',
            address: 'بغداد - المنصور',
            city: 'بغداد',
            notes: 'تفضل الأقساط',
          },
          {
            name: 'شركة الراشد',
            phone: '07901112233',
            address: 'بغداد - الجادرية',
            city: 'بغداد',
            notes: 'حساب آجل مع فواتير شهرية',
          },
        ])
        .returning({ id: customers.id, name: customers.name });
      console.log('✓ Demo customers inserted');
    } else {
      console.log('↩️ Customers already exist, skipping insert');
    }

    const customerByName = (name) => customerRows.find((c) => c.name === name);

    // Sales & related tables (only if empty to avoid duplicates)
    if ((await countTable(sales)) === 0) {
      const ali = customerByName('علي محمد');
      const sara = customerByName('سارة أحمد');

      const iphone = productByName('iPhone 15');
      const laptop = productByName('Laptop Pro 14');
      const rice = productByName('رز بسمتي 5كغ');
      const charger = productByName('شاحن سريع 65W');

      // Cash sale
      const iphoneTotal = (iphone?.sellingPrice ?? 950) - 50;
      const [cashSale] = await db
        .insert(sales)
        .values({
          invoiceNumber: 'INV-2001',
          customerId: ali?.id ?? null,
          subtotal: iphone?.sellingPrice ?? 950,
          discount: 50,
          tax: 0,
          total: iphoneTotal,
          currency: 'USD',
          exchangeRate: 1,
          interestRate: 0,
          interestAmount: 0,
          paymentType: 'cash',
          paidAmount: iphoneTotal,
          remainingAmount: 0,
          status: 'completed',
          notes: 'دفعة نقدية كاملة على جهاز واحد',
        })
        .returning({ id: sales.id });

      // Installment sale
      const laptopPrice = laptop?.sellingPrice ?? 1150;
      const ricePrice = rice?.sellingPrice ?? 12;
      const chargerPrice = charger?.sellingPrice ?? 15;
      const sale2Base = laptopPrice + ricePrice * 2 + chargerPrice;
      const sale2Discount = 60;
      const sale2Interest = 25;
      const sale2Total = sale2Base - sale2Discount + sale2Interest;

      const [installSale] = await db
        .insert(sales)
        .values({
          invoiceNumber: 'INV-2002',
          customerId: sara?.id ?? null,
          subtotal: sale2Base,
          discount: sale2Discount,
          tax: 0,
          total: sale2Total,
          currency: 'USD',
          exchangeRate: 1,
          interestRate: 2.5,
          interestAmount: sale2Interest,
          paymentType: 'installment',
          paidAmount: 300,
          remainingAmount: sale2Total - 300,
          status: 'pending',
          notes: 'خطة أقساط على ثلاث دفعات',
        })
        .returning({ id: sales.id });

      await db.insert(saleItems).values([
        {
          saleId: cashSale.id,
          productId: iphone?.id ?? null,
          productName: 'iPhone 15',
          quantity: 1,
          unitPrice: iphone?.sellingPrice ?? 950,
          discount: 50,
          subtotal: iphoneTotal,
        },
        {
          saleId: installSale.id,
          productId: laptop?.id ?? null,
          productName: 'Laptop Pro 14',
          quantity: 1,
          unitPrice: laptopPrice,
          discount: 40,
          subtotal: laptopPrice - 40,
        },
        {
          saleId: installSale.id,
          productId: rice?.id ?? null,
          productName: 'رز بسمتي 5كغ',
          quantity: 2,
          unitPrice: ricePrice,
          discount: 10,
          subtotal: ricePrice * 2 - 10,
        },
        {
          saleId: installSale.id,
          productId: charger?.id ?? null,
          productName: 'شاحن سريع 65W',
          quantity: 1,
          unitPrice: chargerPrice,
          discount: 0,
          subtotal: chargerPrice,
        },
      ]);

      await db.insert(payments).values([
        {
          saleId: cashSale.id,
          customerId: ali?.id ?? null,
          amount: iphoneTotal,
          currency: 'USD',
          exchangeRate: 1,
          paymentMethod: 'cash',
          notes: 'دفع كامل للفاتورة INV-2001',
        },
        {
          saleId: installSale.id,
          customerId: sara?.id ?? null,
          amount: 300,
          currency: 'USD',
          exchangeRate: 1,
          paymentMethod: 'cash',
          notes: 'الدفعة الأولى للأقساط',
        },
      ]);

      await db.insert(installments).values([
        {
          saleId: installSale.id,
          customerId: sara?.id ?? null,
          installmentNumber: 1,
          dueAmount: 300,
          paidAmount: 300,
          remainingAmount: 0,
          currency: 'USD',
          dueDate: '2025-01-15',
          paidDate: '2025-01-10',
          status: 'paid',
          notes: 'مدفوعة بالكامل',
        },
        {
          saleId: installSale.id,
          customerId: sara?.id ?? null,
          installmentNumber: 2,
          dueAmount: 300,
          paidAmount: 0,
          remainingAmount: 300,
          currency: 'USD',
          dueDate: '2025-02-15',
          status: 'pending',
          notes: 'دفعة قادمة',
        },
        {
          saleId: installSale.id,
          customerId: sara?.id ?? null,
          installmentNumber: 3,
          dueAmount: sale2Total - 600,
          paidAmount: 0,
          remainingAmount: sale2Total - 600,
          currency: 'USD',
          dueDate: '2025-03-15',
          status: 'pending',
          notes: 'دفعة أخيرة',
        },
      ]);

      // Inventory transactions removed - stock is managed directly in products table

      console.log('✓ Demo sales, items, payments, and installments inserted');
    } else {
      console.log('↩️ Sales already exist, skipping demo sales');
    }

    // Save DB to disk
    saveDatabase();

    console.log('\n🌱 Database seeding completed successfully!');
  } catch (err) {
    console.error('❌ Database seeding failed:', err);
  }
}

seed();
