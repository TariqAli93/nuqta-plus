# usePrint Composable - دليل الاستخدام

## نظرة عامة

`usePrint` هو composable متكامل للطباعة يدعم جميع أحجام الطباعة (A4, A5, 58mm, 80mm, 88mm) مع تكامل كامل مع نظام نقطة بلس.

## الاستيراد

```javascript
import { usePrint, quickPrint } from '@/composables/usePrint';
```

## الاستخدام الأساسي

### في مكون Vue

```vue
<template>
  <div>
    <!-- مكون الطباعة المخفي -->
    <component
      :is="currentPrintComponent"
      ref="printRef"
      :sale="saleData"
      :company="companyInfo"
      style="display: none;"
    />

    <!-- أزرار التحكم -->
    <v-btn @click="handlePrint" :loading="isPrinting">
      <v-icon>mdi-printer</v-icon>
      طباعة
    </v-btn>

    <v-btn @click="handlePreview">
      <v-icon>mdi-eye</v-icon>
      معاينة
    </v-btn>

    <v-btn @click="handleSavePDF">
      <v-icon>mdi-file-pdf-box</v-icon>
      حفظ PDF
    </v-btn>

    <!-- اختيار حجم الطباعة -->
    <v-select
      v-model="selectedSize"
      :items="getAvailableSizes()"
      label="حجم الطباعة"
      @update:modelValue="savePreferredSize"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { usePrint } from '@/composables/usePrint';

// استخدام الـ composable
const {
  printRef,
  isPrinting,
  selectedSize,
  companyInfo,
  currentPrintComponent,
  printSale,
  previewSale,
  saveToPDF,
  getAvailableSizes,
  savePreferredSize,
  PRINT_SIZES,
} = usePrint();

// بيانات الفاتورة
const saleData = ref({
  invoiceNumber: 'INV-2001',
  customerName: 'علي محمد',
  total: 900,
  // ... بقية البيانات
});

// طباعة
const handlePrint = async () => {
  await printSale(saleData.value);
};

// معاينة
const handlePreview = () => {
  previewSale(saleData.value);
};

// حفظ PDF
const handleSavePDF = async () => {
  await saveToPDF(saleData.value);
};
</script>
```

## API Reference

### State (الحالة)

- **`printRef`** - المرجع لمكون الطباعة
- **`isPrinting`** - حالة الطباعة (true/false)
- **`isLoading`** - حالة التحميل
- **`selectedSize`** - حجم الطباعة المحدد

### Computed (المحسوبة)

- **`companyInfo`** - معلومات الشركة من المتجر
- **`currentPrintComponent`** - المكون الحالي للطباعة

### Methods (الدوال)

#### `printSale(sale, size?)`

طباعة فاتورة مبيعات

```javascript
// طباعة بالحجم الافتراضي
await printSale(saleData.value);

// طباعة بحجم محدد
await printSale(saleData.value, PRINT_SIZES.A4);
```

#### `printMultiple(sales, size?, delay?)`

طباعة فواتير متعددة

```javascript
const sales = [sale1, sale2, sale3];
const count = await printMultiple(sales, PRINT_SIZES.THERMAL_80MM, 1000);
console.log(`تم طباعة ${count} فاتورة`);
```

#### `saveToPDF(sale, size?)`

حفظ الفاتورة كـ PDF

```javascript
await saveToPDF(saleData.value, PRINT_SIZES.A4);
```

#### `previewSale(sale)`

معاينة الفاتورة في نافذة جديدة

```javascript
previewSale(saleData.value);
```

#### `getPrintHTML()`

الحصول على HTML للطباعة

```javascript
const html = getPrintHTML();
console.log(html);
```

#### `changeSize(size)`

تغيير حجم الطباعة

```javascript
changeSize(PRINT_SIZES.THERMAL_80MM);
```

#### `getAvailableSizes()`

الحصول على أحجام الطباعة المتاحة

```javascript
const sizes = getAvailableSizes();
// [
//   { title: 'A4 - ورق عادي كبير', value: 'a4', icon: 'mdi-file-document-outline' },
//   ...
// ]
```

#### `savePreferredSize(size)`

حفظ حجم الطباعة المفضل

```javascript
savePreferredSize(PRINT_SIZES.THERMAL_80MM);
```

### Electron API (للطابعات الحرارية)

#### `cutPaper()`

قص الورق (للطابعات الحرارية)

```javascript
cutPaper();
```

#### `kickDrawer()`

فتح الدرج النقدي

```javascript
kickDrawer();
```

#### `getPrinters()`

الحصول على قائمة الطابعات

```javascript
const printers = await getPrinters();
```

## أمثلة متقدمة

### مثال 1: طباعة تلقائية بعد البيع

```vue
<script setup>
import { usePrint } from '@/composables/usePrint';
import { watch } from 'vue';

const { printSale, selectedSize } = usePrint();

// مراقبة إتمام البيع والطباعة تلقائياً
watch(
  () => saleStore.lastSale,
  async (newSale) => {
    if (newSale && newSale.status === 'completed') {
      await printSale(newSale);
    }
  }
);
</script>
```

### مثال 2: اختيار طابعة معينة

```vue
<script setup>
import { usePrint } from '@/composables/usePrint';

const { getPrinters, printSale } = usePrint();

const printers = ref([]);
const selectedPrinter = ref(null);

onMounted(async () => {
  printers.value = await getPrinters();
  selectedPrinter.value = printers.value[0];
});

const printWithPrinter = async () => {
  // يمكن تمرير خيارات إضافية للطباعة
  await printSale(saleData.value);
};
</script>
```

### مثال 3: طباعة مع تأكيد

```vue
<script setup>
import { usePrint } from '@/composables/usePrint';
import { useConfirm } from 'vuetify-confirm';

const { printSale } = usePrint();
const confirm = useConfirm();

const handlePrintWithConfirm = async () => {
  const result = await confirm({
    title: 'تأكيد الطباعة',
    message: 'هل تريد طباعة هذه الفاتورة؟',
  });

  if (result) {
    await printSale(saleData.value);
  }
};
</script>
```

### مثال 4: استخدام quickPrint

```javascript
import { quickPrint } from '@/composables/usePrint';

// طباعة سريعة في أي مكان
async function printInvoice(sale) {
  const success = await quickPrint(sale, PRINT_SIZES.THERMAL_80MM);
  if (success) {
    console.log('تمت الطباعة بنجاح');
  }
}
```

## ثوابت أحجام الطباعة

```javascript
import { PRINT_SIZES } from '@/composables/usePrint';

PRINT_SIZES.A4; // 'a4'
PRINT_SIZES.A5; // 'a5'
PRINT_SIZES.THERMAL_58MM; // '58mm'
PRINT_SIZES.THERMAL_80MM; // '80mm'
PRINT_SIZES.THERMAL_88MM; // '88mm'
```

## الدوال المساعدة

### formatPrintCurrency(amount, currency)

```javascript
import { formatPrintCurrency } from '@/composables/usePrint';

formatPrintCurrency(1500, 'USD'); // "1500.00 USD"
formatPrintCurrency(250000, 'IQD'); // "250,000 IQD"
```

### formatPrintDate(date)

```javascript
import { formatPrintDate } from '@/composables/usePrint';

formatPrintDate(new Date()); // "14/12/2025 10:30"
```

### generateQRCode(data, size)

```javascript
import { generateQRCode } from '@/composables/usePrint';

const qrUrl = generateQRCode('INV-2001', 100);
// https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=INV-2001
```

### getPaymentMethodLabel(type)

```javascript
import { getPaymentMethodLabel } from '@/composables/usePrint';

getPaymentMethodLabel('cash'); // "نقدي"
getPaymentMethodLabel('card'); // "بطاقة"
getPaymentMethodLabel('installment'); // "أقساط"
```

## التخزين المحلي

يحفظ الـ composable تفضيلات المستخدم في `localStorage`:

- **`preferredPrintSize`** - حجم الطباعة المفضل

```javascript
// قراءة
const saved = localStorage.getItem('preferredPrintSize');

// حفظ
savePreferredSize(PRINT_SIZES.THERMAL_80MM);

// مسح
localStorage.removeItem('preferredPrintSize');
```

## ملاحظات هامة

1. **معلومات الشركة**: يتم تحميلها تلقائياً عند تهيئة الـ composable
2. **printRef**: يجب ربطه بمكون الطباعة في الـ template
3. **Electron API**: متوفر فقط في بيئة Electron
4. **html2pdf**: مطلوب لحفظ PDF (يتم تحميله ديناميكياً)

## استكشاف الأخطاء

### المشكلة: printRef غير معرّف

```vue
<!-- تأكد من ربط ref بالمكون -->
<component :is="currentPrintComponent" ref="printRef" />
```

### المشكلة: معلومات الشركة فارغة

```javascript
// تأكد من تحميل معلومات الشركة
await settingsStore.fetchCompanyInfo();
```

### المشكلة: الطباعة لا تعمل

```javascript
// تحقق من الحالة
console.log('isPrinting:', isPrinting.value);
console.log('printRef:', printRef.value);
console.log('sale:', saleData.value);
```

## الأداء

- ✅ التحميل الكسول لـ html2pdf
- ✅ التخزين المؤقت لمعلومات الشركة
- ✅ تهيئة واحدة فقط
- ✅ معالجة أخطاء شاملة

## التوافق

- ✅ Vue 3 Composition API
- ✅ Vuetify 3
- ✅ Pinia Store
- ✅ Electron (اختياري)
- ✅ جميع المتصفحات الحديثة

---

للمزيد من المعلومات، راجع [README.md](../components/print/README.md) في مجلد المكونات.
