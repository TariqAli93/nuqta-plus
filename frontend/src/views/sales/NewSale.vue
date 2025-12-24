<template>
  <div>
    <v-card class="mb-4">
      <div class="flex items-center justify-space-between pa-3">
        <div class="font-semibold text-h6 text-primary">بطاقة بيع جديدة</div>
        <v-btn color="primary" size="default" variant="text" @click="handleCancel">
          <v-icon size="24">mdi-arrow-left</v-icon>
        </v-btn>
      </div>
    </v-card>
    <v-card>
      <v-card-text>
        <v-form ref="form">
          <!-- 🧍 العميل والعملة -->
          <v-row>
            <v-col cols="12" md="6">
              <CustomerSelector v-model="sale.customerId" :required="false" />
              <div class="text-caption text-grey mt-1">
                <v-icon size="16" class="ml-1">mdi-information</v-icon>
                اختياري - يمكنك إتمام البيع بدون تحديد عميل
              </div>
            </v-col>

            <v-col cols="12" md="6">
              <v-select
                v-model="sale.currency"
                :items="availableCurrencies"
                label="العملة"
                :rules="[rules.required]"
                density="comfortable"
                :disabled="!settingsStore.showSecondaryCurrency"
                :hint="!settingsStore.showSecondaryCurrency ? 'العملة الثانوية مخفية - يتم استخدام العملة الافتراضية فقط' : ''"
                persistent-hint
              >
                <template v-slot:prepend-inner>
                  <v-icon>mdi-currency-usd</v-icon>
                </template>
              </v-select>
            </v-col>
          </v-row>

          <v-divider class="my-4"></v-divider>

          <!-- 🧾 المنتجات -->
          <h3 class="mb-4 text-h6">المنتجات</h3>
          <v-text-field
            v-model="barcode"
            label="قراءة الباركود"
            prepend-inner-icon="mdi-barcode-scan"
            clearable
            @keyup.enter="handleBarcodeScan"
            autofocus
            class="mb-4"
            density="comfortable"
          />

          <v-row v-for="(item, index) in sale.items" :key="index" class="mb-3 align-center">
            <v-col cols="12" md="3">
              <v-select
                v-model="item.productId"
                :items="products"
                item-title="name"
                item-value="id"
                label="المنتج"
                :rules="[rules.required]"
                @update:model-value="updateProductDetails(item)"
                density="comfortable"
              />
            </v-col>
            <v-col cols="12" md="3">
              <v-text-field
                v-model.number="item.quantity"
                label="الكمية"
                type="number"
                min="1"
                :rules="[rules.required]"
                density="comfortable"
              />
            </v-col>
            <v-col cols="12" md="3">
              <v-text-field
                :model-value="formatCurrency(item.unitPrice)"
                :suffix="sale.currency"
                label="سعر الوحدة"
                readonly
                density="comfortable"
              />
            </v-col>
            <v-col cols="12" md="3">
              <v-text-field
                :model-value="formatNumber(item.discount)"
                @input="(e) => handleItemDiscountInput(item, e.target.value)"
                :suffix="sale.currency"
                label="الخصم على الوحدة"
                hint="اختياري"
                persistent-hint
                density="comfortable"
              />
            </v-col>
            <v-col cols="12" md="12">
              <v-text-field
                :model-value="formatCurrency(item.quantity * item.unitPrice - ((item.discount || 0) * item.quantity))"
                :suffix="sale.currency"
                label="صافي السعر"
                readonly
                hint="بعد الخصم"
                persistent-hint
                density="comfortable"
              />
            </v-col>
            <v-col cols="12" md="1" class="d-flex align-center">
              <v-btn icon="mdi-delete" size="small" color="error" variant="text" @click="removeItem(index)" />
            </v-col>
          </v-row>

          <v-btn color="primary" prepend-icon="mdi-plus" size="default" @click="addItem" class="mb-4">
            إضافة منتج
          </v-btn>

          <v-divider class="my-4"></v-divider>

          <!-- 💳 نوع الدفع -->
          <v-row>
            <v-col cols="12" md="4">
              <v-select
                v-model="sale.paymentType"
                :items="paymentTypes"
                item-title="label"
                item-value="value"
                label="نوع الفاتورة"
                density="comfortable"
              />
              <v-alert
                v-if="sale.paymentType === 'installment' && !sale.customerId"
                type="warning"
                variant="tonal"
                density="compact"
                class="mt-2"
              >
                <v-icon size="16" class="ml-1">mdi-alert</v-icon>
                يجب تحديد عميل للبيع بالتقسيط
              </v-alert>
            </v-col>
            <v-col cols="12" md="4">
              <v-text-field
                :model-value="formatNumber(sale.discount)"
                @input="(e) => handleSaleDiscountInput(e.target.value)"
                label="الخصم"
                density="comfortable"
              />
            </v-col>
            <v-col cols="12" md="4">
              <v-text-field
                :model-value="formatNumber(sale.paidAmount)"
                @input="(e) => handlePaidAmountInput(e.target.value)"
                label="المبلغ المدفوع"
                :hint="sale.paymentType === 'installment' ? 'الدفعة الأولى' : 'المبلغ الكامل'"
                persistent-hint
                density="comfortable"
              />
            </v-col>
          </v-row>

          <!-- 🧮 في حالة الدفع بالأقساط -->
          <v-expand-transition>
            <div v-if="sale.paymentType === 'installment'">
              <v-divider class="my-4"></v-divider>
              <h3 class="mb-3 text-h6">تفاصيل التقسيط</h3>
              <v-row>
                <v-col cols="12" md="4">
                  <v-text-field
                    v-model.number="sale.installmentCount"
                    label="عدد الأقساط"
                    type="number"
                    min="1"
                    density="comfortable"
                  />
                </v-col>

                <v-col cols="12" md="4">
                  <v-text-field
                    v-model.number="sale.interestRate"
                    @update:model-value="handleInterestRateChange"
                    label="نسبة الفائدة (%)"
                    type="number"
                    min="0"
                    max="100"
                    hint="أدخل النسبة المئوية"
                    persistent-hint
                    density="comfortable"
                  />
                </v-col>

                <v-col cols="12" md="4">
                  <v-text-field
                    :model-value="formatNumber(sale.interestAmount)"
                    @input="(e) => handleInterestAmountChange(e.target.value)"
                    :suffix="sale.currency"
                    label="مبلغ الفائدة"
                    hint="أدخل المبلغ مباشرة"
                    persistent-hint
                    density="comfortable"
                  />
                </v-col>
              </v-row>

              <v-card variant="tonal" color="info" class="mt-3 pa-3">
                <div class="py-2 border-b d-flex justify-space-between">
                  <span>المبلغ بعد الفائدة:</span>
                  <span class="font-weight-bold">
                    {{ formatCurrency(totalWithInterest) }}
                  </span>
                </div>
                <div class="py-2 border-b d-flex justify-space-between">
                  <span>قيمة القسط الواحد:</span>
                  <span class="font-weight-bold">
                    {{ formatCurrency(installmentAmount) }}
                  </span>
                </div>
                <div class="py-2 border-b d-flex justify-space-between">
                  <span>النسبة الفعلية:</span>
                  <span class="font-weight-bold">
                    {{ actualInterestRate.toFixed(2) }}%
                  </span>
                </div>
                <div class="mt-2 d-flex justify-space-between">
                  <span>المبلغ المتبقي:</span>
                  <span class="font-weight-bold text-error">
                    {{ formatCurrency(remainingAmount) }}
                  </span>
                </div>
              </v-card>

              <!-- جدول الأقساط -->
              <v-card variant="outlined" class="mt-3">
                <v-card-title class="text-h6">جدول الأقساط</v-card-title>
                <v-table>
                  <thead>
                    <tr>
                      <th>رقم القسط</th>
                      <th>المبلغ</th>
                      <th>المتبقي بعد القسط</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="installment in installmentSchedule" :key="installment.number">
                      <td>{{ installment.number }}</td>
                      <td class="font-weight-bold">{{ formatCurrency(installment.amount) }}</td>
                      <td>
                        <span 
                          :class="{
                            'text-success font-weight-bold': installment.remaining === 0,
                            'text-grey': installment.remaining > 0
                          }"
                        >
                          {{ formatCurrency(installment.remaining) }}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                  <tfoot v-if="installmentSchedule.length > 0">
                    <tr class="bg-primary-lighten-5">
                      <td class="text-left font-weight-bold">الإجمالي</td>
                      <td class="font-weight-bold text-primary">
                        {{ formatCurrency(totalWithInterest) }}
                      </td>
                      <td class="font-weight-bold">
                        <span class="text-error">{{ formatCurrency(remainingAmount) }}</span>
                      </td>
                    </tr>
                  </tfoot>
                </v-table>
              </v-card>
            </div>
          </v-expand-transition>

          <v-divider class="my-4"></v-divider>

          <!-- 💰 الملخص -->
          <v-card variant="outlined" class="mb-4 pa-4">
            <div
              v-for="summary in saleSummary"
              :key="summary.label"
              class="py-3 mb-1 border-b d-flex justify-space-between"
            >
              <span>{{ summary.label }}:</span>
              <span class="font-weight-bold">{{ summary.value }}</span>
            </div>
          </v-card>

          <!-- 📝 ملاحظات -->
          <v-textarea v-model="sale.notes" label="ملاحظات" rows="3" auto-grow class="mb-4" density="comfortable" />

          <!-- أزرار -->
          <div class="gap-2 d-flex">
            <v-btn color="primary" size="default" :loading="loading" @click="submitSale"> حفظ البيع </v-btn>
            <v-btn variant="outlined" size="default" @click="handleCancel">إلغاء</v-btn>
          </div>
        </v-form>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute, onBeforeRouteLeave } from 'vue-router';
import { useSaleStore, useProductStore, useNotificationStore, useSettingsStore } from '@/stores';
import CustomerSelector from '@/components/CustomerSelector.vue';

const router = useRouter();
const route = useRoute();
const saleStore = useSaleStore();
const productStore = useProductStore();
const settingsStore = useSettingsStore();
const notify = useNotificationStore();

const form = ref(null);
const barcode = ref('');
const loading = ref(false);

const rules = {
  required: (value) => !!value || 'هذا الحقل مطلوب',
};

const sale = ref({
  customerId: null,
  currency: settingsStore.settings?.defaultCurrency || 'IQD',
  items: [],
  discount: 0,
  paymentType: 'cash',
  paidAmount: 0,
  installmentCount: 3,
  interestRate: 25,
  interestAmount: 0,
  interestInputType: 'rate', // 'rate' أو 'amount' لتحديد نوع الإدخال
  notes: '',
});

const products = ref([]);
const currencySettings = ref({
  defaultCurrency: 'IQD',
  usdRate: 1500,
  iqdRate: 1,
  showSecondaryCurrency: true,
});

// Computed property for available currencies
const availableCurrencies = computed(() => settingsStore.availableCurrencies);

// تحويل سعر بين عملتين بناءً على إعدادات الصرف
const convertPrice = (amount, from, to) => {
  if (!amount || from === to) return amount || 0;
  const usdRate = Number(currencySettings.value.usdRate) || 1500;
  // لدينا عملتان IQD و USD
  if (from === 'USD' && to === 'IQD') return amount * usdRate;
  if (from === 'IQD' && to === 'USD') return amount / usdRate;
  return amount; // fallback
};

// تطبيق تحويل العملة على كل عناصر السلة عند تغيير عملة البيع
const applySaleCurrencyToItems = () => {
  sale.value.items = sale.value.items.map((i) => {
    const original = i.unitPriceOriginal ?? i.unitPrice;
    const originalCur = i.originalCurrency ?? sale.value.currency;
    return {
      ...i,
      unitPrice: convertPrice(original, originalCur, sale.value.currency),
    };
  });
};

/* 💳 خيارات نوع الدفع */
const paymentTypes = [
  { label: 'نقدي', value: 'cash' },
  { label: 'تقسيط', value: 'installment' },
];

/* �� حسابات البيع محسّنة */
const subtotal = computed(() =>
  sale.value.items.reduce((s, i) => {
    const itemTotal = i.quantity * i.unitPrice;
    const itemDiscount = (i.discount || 0) * i.quantity;
    return s + (itemTotal - itemDiscount);
  }, 0)
);

const total = computed(() => {
  const result = subtotal.value - (sale.value.discount || 0);
  return Math.max(0, result); // التأكد من عدم وجود قيم سالبة
});

// ✅ حساب الفائدة بشكل بسيط
const interestValue = computed(() => {
  if (sale.value.paymentType !== 'installment') return 0;
  
  const baseAmount = total.value;
  
  // إذا كان الإدخال عن طريق المبلغ، استخدم المبلغ مباشرة
  if (sale.value.interestInputType === 'amount') {
    return Math.max(0, sale.value.interestAmount || 0);
  }
  
  // فائدة بسيطة: الفائدة = المبلغ × النسبة
  const rate = sale.value.interestRate || 0;
  return baseAmount * (rate / 100);
});

// ✅ حساب الإجمالي بعد الفائدة مع التقريب
const totalWithInterest = computed(() => {
  const result = total.value + interestValue.value;
  return Math.round(result * 100) / 100; // تقريب إلى رقمين عشريين
});

// ✅ حساب قيمة القسط الواحد بشكل دقيق
const installmentAmount = computed(() => {
  if (sale.value.installmentCount <= 0) return 0;
  
  const amount = totalWithInterest.value / sale.value.installmentCount;
  
  // تقريب إلى رقمين عشريين
  return Math.round(amount * 100) / 100;
});

// ✅ حساب المبلغ المتبقي بدقة
const remainingAmount = computed(() => {
  const finalTotal = sale.value.paymentType === 'installment' 
    ? totalWithInterest.value 
    : total.value;
  
  const paid = sale.value.paidAmount || 0;
  const remaining = finalTotal - paid;
  
  return Math.max(0, Math.round(remaining * 100) / 100);
});

// ✅ جدول الأقساط التفصيلي (مصحح ومحسّن)
const installmentSchedule = computed(() => {
  if (sale.value.paymentType !== 'installment') return [];
  
  const schedule = [];
  const totalAmount = totalWithInterest.value;
  const paidAmount = sale.value.paidAmount || 0;
  let remaining = Math.round((totalAmount - paidAmount) * 100) / 100;
  
  if (remaining <= 0 || sale.value.installmentCount <= 0) return [];
  
  // حساب قيمة القسط الواحد (بدون تقريب)
  const baseInstallment = remaining / sale.value.installmentCount;
  
  // مجموع الأقساط المقرّبة (للتأكد من عدم وجود فارق)
  let totalDistributed = 0;
  
  for (let i = 1; i <= sale.value.installmentCount; i++) {
    const isLast = i === sale.value.installmentCount;
    
    let installment;
    if (isLast) {
      // آخر قسط = المتبقي بالضبط (لضمان عدم وجود فارق)
      installment = Math.round((remaining - totalDistributed) * 100) / 100;
      // التأكد من أن آخر قسط ليس صفراً أو سالباً
      if (installment <= 0) {
        // إذا كان المتبقي صفراً أو سالباً بسبب التقريب، استخدم القيمة الأساسية
        installment = Math.max(0.01, Math.round(baseInstallment * 100) / 100);
      }
    } else {
      // باقي الأقساط: تقريب إلى رقمين عشريين
      installment = Math.round(baseInstallment * 100) / 100;
      // التأكد من أن القسط ليس صفراً
      if (installment <= 0) {
        installment = 0.01;
      }
      totalDistributed += installment;
    }
    
    // تحديث المتبقي قبل إضافة القسط
    remaining = Math.round((remaining - installment) * 100) / 100;
    
    schedule.push({
      number: i,
      amount: installment,
      remaining: Math.max(0, remaining),
    });
  }
  
  return schedule;
});

// ✅ إجمالي الفائدة الفعلية (للعرض)
const actualInterestRate = computed(() => {
  if (sale.value.paymentType !== 'installment' || total.value === 0) return 0;
  
  if (sale.value.interestInputType === 'amount') {
    return (interestValue.value / total.value) * 100;
  }
  
  return sale.value.interestRate || 0;
});

// ✅ تحديث المبلغ المدفوع تلقائياً عند تغيير نوع الدفع (محسّن)
watch(
  () => sale.value.paymentType,
  (newType) => {
    if (newType === 'cash') {
      sale.value.paidAmount = Math.round(total.value * 100) / 100;
    } else {
      // في حالة التقسيط، المبلغ المدفوع = قيمة القسط الأول
      sale.value.paidAmount = Math.round(installmentAmount.value * 100) / 100;
    }
  }
);

// مراقبة تغيير العملة في نموذج البيع وتحديث أسعار المنتجات
watch(
  () => sale.value.currency,
  () => {
    applySaleCurrencyToItems();
  }
);

// مراقبة تغيير showSecondaryCurrency وإعادة تعيين العملة للافتراضية عند الإخفاء
watch(
  () => settingsStore.showSecondaryCurrency,
  (showSecondary) => {
    if (!showSecondary) {
      // إذا تم إخفاء العملة الثانوية، استخدم العملة الافتراضية فقط
      const defaultCurrency = settingsStore.settings?.defaultCurrency || 'IQD';
      if (sale.value.currency !== defaultCurrency) {
        sale.value.currency = defaultCurrency;
        applySaleCurrencyToItems();
      }
    }
  }
);

// مراقبة تغيير الكمية للتحقق من توفرها في المخزون
watch(
  () => sale.value.items.map((item) => ({ id: item.productId, qty: item.quantity })),
  (newItems) => {
    newItems.forEach((item, index) => {
      if (!item.id) return;
      const product = products.value.find((p) => p.id === item.id);
      if (product && item.qty > product.stock) {
        notify.error(
          `❌ الكمية المطلوبة من "${product.name}" (${item.qty}) أكبر من المتوفر في المخزون (${product.stock})`
        );
        sale.value.items[index].quantity = product.stock;
      }
    });
  },
  { deep: true }
);

// ✅ تحديث المبلغ المدفوع عند تغيير الإجمالي (محسّن)
watch(
  () => [total.value, totalWithInterest.value, installmentAmount.value],
  () => {
    if (sale.value.paymentType === 'cash') {
      sale.value.paidAmount = Math.round(total.value * 100) / 100;
    } else {
      sale.value.paidAmount = Math.round(installmentAmount.value * 100) / 100;
    }
  }
);

// ✅ تحديث المبلغ عند تغيير النسبة (مبسّط)
watch(
  () => [total.value, sale.value.interestRate],
  () => {
    if (sale.value.paymentType === 'installment' && 
        sale.value.interestInputType === 'rate' && 
        total.value > 0) {
      // فائدة بسيطة: الفائدة = المبلغ × النسبة
      const rate = sale.value.interestRate || 0;
      const calculatedInterest = total.value * (rate / 100);
      sale.value.interestAmount = Math.round(calculatedInterest * 100) / 100;
    }
  }
);

// ✅ تحديث النسبة عند تغيير المبلغ (مبسّط)
watch(
  () => [total.value, sale.value.interestAmount],
  () => {
    if (sale.value.paymentType === 'installment' && 
        sale.value.interestInputType === 'amount' && 
        total.value > 0) {
      // فائدة بسيطة: النسبة = (الفائدة / المبلغ) × 100
      const interest = sale.value.interestAmount || 0;
      const calculatedRate = (interest / total.value) * 100;
      sale.value.interestRate = Math.round(calculatedRate * 100) / 100;
    }
  }
);

/* 🧾 الملخص */
const itemsTotal = computed(() =>
  sale.value.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0)
);
const itemsDiscount = computed(() => 
  sale.value.items.reduce((s, i) => s + (i.discount || 0) * i.quantity, 0) // Multiply by quantity
);

const saleSummary = computed(() => [
  { label: 'إجمالي المنتجات', value: formatCurrency(itemsTotal.value) },
  { label: 'خصم المنتجات', value: formatCurrency(itemsDiscount.value) },
  { label: 'المجموع الفرعي', value: formatCurrency(subtotal.value) },
  { label: 'خصم إضافي', value: formatCurrency(sale.value.discount) },
  { label: 'الإجمالي بعد الخصم', value: formatCurrency(total.value) },
  ...(sale.value.paymentType === 'installment'
    ? [
        { label: 'الفائدة المضافة', value: formatCurrency(interestValue.value) },
        { label: 'الإجمالي بعد الفائدة', value: formatCurrency(totalWithInterest.value) },
        { label: 'قيمة القسط', value: formatCurrency(installmentAmount.value) },
      ]
    : []),
  { label: 'المبلغ المدفوع', value: formatCurrency(sale.value.paidAmount) },
  { label: 'المبلغ المتبقي', value: formatCurrency(remainingAmount.value) },
]);

/* 📦 إدارة المنتجات */
const addItem = () =>
  sale.value.items.push({ productId: null, quantity: 1, unitPrice: 0, discount: 0 });
const removeItem = (index) => sale.value.items.splice(index, 1);
const updateProductDetails = (item) => {
  const p = products.value.find((prod) => prod.id === item.productId);
  if (!p) return;

  if (p.stock <= 0) {
    notify.error('❌ المنتج غير متوفر في المخزون');
    item.productId = null;
    return;
  }

  if (item.quantity > p.stock) {
    notify.error(`❌ الكمية المطلوبة (${item.quantity}) أكبر من المتوفر في المخزون (${p.stock})`);
    item.quantity = p.stock;
  }

  item.unitPriceOriginal = p.sellingPrice;
  item.originalCurrency = p.currency || 'USD';
  item.unitPrice = convertPrice(p.sellingPrice, item.originalCurrency, sale.value.currency);
  item.discount = item.discount || 0;
  item.availableStock = p.stock;
};

/* 🔍 قراءة الباركود */
const handleBarcodeScan = () => {
  const code = barcode.value.trim();
  if (!code) return;
  const product = products.value.find((p) => p.barcode === code);
  if (!product) return notify.error('❌ المنتج غير موجود');
  if (product.stock <= 0) return notify.error('❌ المنتج غير متوفر في المخزون');

  const existing = sale.value.items.find((i) => i.productId === product.id);

  if (existing) {
    const newQuantity = existing.quantity + 1;
    if (newQuantity > product.stock) {
      return notify.error(
        `❌ الكمية المطلوبة (${newQuantity}) أكبر من المتوفر في المخزون (${product.stock})`
      );
    }
    existing.quantity = newQuantity;
  } else {
    sale.value.items.push({
      productId: product.id,
      quantity: 1,
      unitPriceOriginal: product.sellingPrice,
      originalCurrency: product.currency || 'USD',
      unitPrice: convertPrice(product.sellingPrice, product.currency || 'USD', sale.value.currency),
      discount: 0,
      availableStock: product.stock,
    });
  }

  barcode.value = '';
};

/* 💾 حفظ البيع */
const submitSale = async () => {
  // التحقق من أن العميل مطلوب فقط للبيع بالتقسيط
  if (sale.value.paymentType === 'installment' && !sale.value.customerId) {
    notify.error('يجب تحديد عميل للبيع بالتقسيط');
    return;
  }
  const { valid } = await form.value.validate();
  if (!valid) return notify.error('يرجى تعبئة جميع الحقول');

  if (!sale.value.items.length) return notify.error('يجب إضافة منتج واحد على الأقل');

  // التحقق من توفر الكميات في المخزون
  for (const item of sale.value.items) {
    const product = products.value.find((p) => p.id === item.productId);
    if (!product) {
      notify.error(`❌ المنتج غير موجود`);
      return;
    }
    if (product.stock < item.quantity) {
      notify.error(
        `❌ الكمية المطلوبة من "${product.name}" (${item.quantity}) أكبر من المتوفر في المخزون (${product.stock})`
      );
      return;
    }
  }

  loading.value = true;
  try {
    let saleResponse;
    
    // إذا كانت هناك مسودة، أكملها بدلاً من إنشاء بيع جديد
    if (currentDraftId.value) {
      saleResponse = await saleStore.completeDraft(currentDraftId.value, sale.value);
    } else {
      saleResponse = await saleStore.createSale(sale.value);
    }
    
    saleCompleted.value = true; // تم حفظ البيع بنجاح
    notify.success('تم حفظ البيع بنجاح ✅');

    const saleId = saleResponse.data?.data?.id || saleResponse.data?.id;
    router.push({ name: 'SaleDetails', params: { id: saleId } });
  } catch (error) {
    notify.error('حدث خطأ أثناء حفظ البيع. يرجى المحاولة مرة أخرى.');
    console.error(error);
  } finally {
    loading.value = false;
  }
};

// متغيرات لتتبع حالة العملية
const saleCompleted = ref(false);
const isCancelled = ref(false);
const draftSaved = ref(false);
const currentDraftId = ref(null);

// دالة للإلغاء مع حذف المسودة إن وجدت
const handleCancel = async () => {
  isCancelled.value = true;
  
  // إذا كانت هناك مسودة محفوظة، احذفها
  if (currentDraftId.value) {
    try {
      await saleStore.removeSale(currentDraftId.value);
    } catch (error) {
      console.error('Failed to delete draft:', error);
    }
  }
  
  router.back();
};

// متغير لمنع التكرار
const isSavingDraft = ref(false);

// حفظ المسودة عند الخروج من الصفحة
const saveDraft = async () => {
  // لا نحفظ المسودة إذا:
  // 1. تم حفظ البيع بنجاح
  // 2. تم الضغط على زر الإلغاء
  // 3. لا توجد منتجات في القائمة
  // 4. تم حفظ المسودة بالفعل
  // 5. جاري حفظ المسودة حالياً
  if (saleCompleted.value || isCancelled.value || !sale.value.items || sale.value.items.length === 0 || draftSaved.value || isSavingDraft.value) {
    return;
  }

  isSavingDraft.value = true;
  try {
    // التأكد من إرسال customerId إذا كان موجوداً
    const draftData = {
      ...sale.value,
      customerId: sale.value.customerId || null,
    };
    
    const response = await saleStore.createDraft(draftData);
    if (response?.data?.data?.id) {
      currentDraftId.value = response.data.data.id;
      draftSaved.value = true;
    }
    // لا نعرض إشعار للمستخدم عند حفظ المسودة تلقائياً
  } catch (error) {
    // فشل حفظ المسودة - لا نعرض خطأ للمستخدم
    console.error('Failed to save draft:', error);
  } finally {
    isSavingDraft.value = false;
  }
};

// حفظ المسودة قبل مغادرة الصفحة (مرة واحدة فقط)
onBeforeRouteLeave(async (to, from, next) => {
  // إذا كان الانتقال إلى صفحة أخرى (ليس إلغاء)، احفظ المسودة
  if (!saleCompleted.value && !isCancelled.value && !draftSaved.value && !isSavingDraft.value) {
    await saveDraft();
  }
  next();
});

// حفظ المسودة عند إغلاق/إعادة تحميل الصفحة (فقط إذا لم يتم الانتقال)
// نستخدم window.addEventListener بدلاً من onBeforeUnmount لتجنب التكرار
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (!saleCompleted.value && !isCancelled.value && !draftSaved.value && !isSavingDraft.value) {
      // حفظ متزامن (لا يمكن استخدام async في beforeunload)
      saveDraft().catch(() => {
        // تجاهل الأخطاء في beforeunload
      });
    }
  });
}

/* ⚙️ تحميل البيانات */
onMounted(async () => {
  // تحميل المنتجات
  const p = await productStore.fetchProducts({ limit: 1000 });
  products.value = p.data;

  // تحميل إعدادات العملة
  try {
    const settings = await settingsStore.fetchCurrencySettings();
    if (settings) {
      currencySettings.value = {
        ...settings,
        showSecondaryCurrency: settings.showSecondaryCurrency !== undefined ? settings.showSecondaryCurrency : true,
      };
      // استخدام العملة الافتراضية أو أول عملة متاحة
      const defaultCurrency = settings.defaultCurrency || 'IQD';
      sale.value.currency = availableCurrencies.value.includes(defaultCurrency) 
        ? defaultCurrency 
        : availableCurrencies.value[0] || defaultCurrency;
    }
  } catch {
    // استخدام القيم الافتراضية
    sale.value.currency = availableCurrencies.value[0] || 'IQD';
  }

  // تحميل بيانات المسودة إذا كان هناك draftId في query
  const draftId = route.query.draftId;
  if (draftId) {
    try {
      loading.value = true;
      const draftResponse = await saleStore.fetchSale(Number(draftId));
      const draftData = draftResponse.data?.data || draftResponse.data;
      
      if (draftData && draftData.status === 'draft') {
        currentDraftId.value = draftData.id;
        draftSaved.value = true;
        
        // ملء النموذج ببيانات المسودة
        sale.value.customerId = draftData.customerId || null;
        sale.value.currency = draftData.currency || 'IQD';
        sale.value.paymentType = draftData.paymentType || 'cash';
        sale.value.discount = draftData.discount || 0;
        sale.value.tax = draftData.tax || 0;
        sale.value.notes = draftData.notes || '';
        
        // تحميل عناصر المسودة
        if (draftData.items && draftData.items.length > 0) {
          sale.value.items = draftData.items.map(item => {
            const product = products.value.find(p => p.id === item.productId);
            return {
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              discount: item.discount || 0,
              unitPriceOriginal: product?.sellingPrice || item.unitPrice,
              originalCurrency: product?.currency || sale.value.currency,
              availableStock: product?.stock || 0,
            };
          });
        }
        
        notify.info('تم تحميل المسودة');
      }
    } catch (error) {
      notify.error('فشل تحميل المسودة');
      console.error('Failed to load draft:', error);
    } finally {
      loading.value = false;
    }
  }
});

/* 💱 تنسيق العملة */
const formatCurrency = (amount) =>
  new Intl.NumberFormat('ar', {
    style: 'currency',
    currency: sale.value.currency,
    maximumFractionDigits: 0,
  }).format(amount || 0);

// إضافة دوال تنسيق الأرقام
const formatNumber = (value) => {
  if (!value && value !== 0) return '';
  const numStr = String(value).replace(/,/g, '');
  if (!/^\d*\.?\d*$/.test(numStr)) return value;
  const parts = numStr.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
};

const parseNumber = (value) => {
  if (!value) return 0;
  const numStr = String(value).replace(/,/g, '');
  const num = parseFloat(numStr);
  return isNaN(num) ? 0 : num;
};

// معالجة الخصم على الوحدة
const handleItemDiscountInput = (item, value) => {
  const num = parseNumber(value);
  item.discount = num;
};

// معالجة الخصم الإضافي
const handleSaleDiscountInput = (value) => {
  const num = parseNumber(value);
  sale.value.discount = num;
};

// معالجة المبلغ المدفوع
const handlePaidAmountInput = (value) => {
  const num = parseNumber(value);
  sale.value.paidAmount = num;
};

// معالجة تغيير النسبة المئوية
const handleInterestRateChange = (value) => {
  if (value === null || value === undefined || isNaN(value)) {
    sale.value.interestRate = 0;
    return;
  }
  sale.value.interestRate = Number(value);
  sale.value.interestInputType = 'rate';
  // تحديث المبلغ تلقائياً
  if (total.value > 0) {
    sale.value.interestAmount = total.value * (Number(value) / 100);
  }
};

// معالجة تغيير مبلغ الفائدة
const handleInterestAmountChange = (value) => {
  const num = parseNumber(value);
  sale.value.interestAmount = num;
  sale.value.interestInputType = 'amount';
  // تحديث النسبة تلقائياً
  if (total.value > 0) {
    sale.value.interestRate = (num / total.value) * 100;
  }
};

</script>
