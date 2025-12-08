<template>
  <div class="print-container" :class="`invoice-${invoiceType}`">
    <!-- ===== HEADER ===== -->
    <header class="invoice-header">
      <div class="header-left">
        <h4 class="mb-2 text-primary">فاتورة بيع</h4>
        <p class="mb-1">
          رقم الفاتورة: <strong>{{ props.sale.invoiceNumber }}</strong>
        </p>
        <p class="mb-2">التاريخ: {{ toYmdWithTime(props.sale.createdAt) }}</p>

        <span
          class="status-chip"
          :class="{
            completed: props.sale.status === 'completed',
            pending: props.sale.status === 'pending',
            cancelled: props.sale.status === 'cancelled',
          }"
        >
          {{ getStatusText(props.sale.status) }}
        </span>
      </div>

      <div class="header-right">
        <h4 class="mb-2 text-primary">{{ company?.name }}</h4>
        <p class="mb-1">العنوان: {{ company?.city }}, {{ company?.area }}, {{ company?.street }}</p>
        <p class="mb-1">الهاتف: {{ company?.phone }}</p>
        <p>&nbsp;</p>
      </div>
    </header>

    <hr class="divider" />

    <!-- ===== CUSTOMER & PAYMENT INFO ===== -->
    <section class="info-section">
      <div>
        <h5>معلومات العميل</h5>
        <p><strong>الاسم:</strong> {{ props.sale.customerName }}</p>
        <p><strong>الهاتف:</strong> {{ props.sale.customerPhone || 'غير متوفر' }}</p>
      </div>
      <div>
        <h5>معلومات الدفع</h5>
        <p><strong>نوع الدفع:</strong> {{ getPaymentTypeText(props.sale.paymentType) }}</p>
        <p><strong>العملة:</strong> {{ props.sale.currency }}</p>
        <p v-if="props.sale.exchangeRate && props.sale.exchangeRate !== 1">
          <strong>سعر الصرف:</strong> {{ props.sale.exchangeRate.toLocaleString() }}
        </p>
        <p>
          <strong>المدفوع:</strong>
          <span class="success">{{ formatCurrency(props.sale.paidAmount) }}</span>
        </p>
        <p>
          <strong>المتبقي:</strong>
          <span :class="props.sale.remainingAmount > 0 ? 'error' : 'success'">
            {{ formatCurrency(props.sale.remainingAmount) }}
          </span>
        </p>
      </div>
    </section>

    <hr class="divider" />

    <!-- ===== PRODUCTS ===== -->
    <section class="table-section">
      <h5>تفاصيل المنتجات</h5>
      <table class="products-table">
        <thead>
          <tr>
            <th>#</th>
            <th>المنتج</th>
            <th>الكمية</th>
            <th>سعر الوحدة</th>
            <th>الخصم</th>
            <th>صافي السعر</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, i) in items" :key="item.id">
            <td>{{ i + 1 }}</td>
            <td>{{ item.productName }}</td>
            <td>{{ item.quantity }}</td>
            <td>{{ formatCurrency(item.unitPrice) }}</td>
            <td>{{ item.discount ? formatCurrency(item.discount) : '-' }}</td>
            <td>{{ formatCurrency(item.netSubtotal) }}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td colspan="5" class="text-left font-weight-bold">المجموع الفرعي:</td>
            <td class="text-center font-weight-bold">
              {{ formatCurrency(subtotalItems) }}
            </td>
          </tr>
          <tr v-if="props.sale.discount && props.sale.discount > 0">
            <td colspan="5" class="text-left font-weight-bold">الخصم على الفاتورة:</td>
            <td class="text-center font-weight-bold">
              {{ formatCurrency(props.sale.discount) }}
            </td>
          </tr>
          <tr v-if="props.sale.paymentType === 'installment' && props.sale.interestAmount > 0">
            <td colspan="5" class="text-left font-weight-bold">
              الفائدة ({{ props.sale.interestRate }}%):
            </td>
            <td class="text-center font-weight-bold" style="color: #ff9800">
              + {{ formatCurrency(props.sale.interestAmount) }}
            </td>
          </tr>
          <tr v-if="props.sale.discount > 0 || props.sale.interestAmount > 0" class="total-row">
            <td colspan="5" class="text-left font-weight-bold">الإجمالي النهائي:</td>
            <td class="text-center font-weight-bold total">
              {{ formatCurrency(props.sale.total) }}
            </td>
          </tr>
        </tfoot>
      </table>
    </section>

    <!-- ===== INSTALLMENTS ===== -->
    <section v-if="props.sale.installments?.length" class="installments-table">
      <h5>جدول الأقساط</h5>
      <table class="products-table">
        <thead>
          <tr>
            <th>رقم القسط</th>
            <th>المستحق</th>
            <th>المدفوع</th>
            <th>المتبقي</th>
            <th>الاستحقاق</th>
            <th>الدفع</th>
            <th>الحالة</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="inst in props.sale.installments" :key="inst.id">
            <td>{{ inst.installmentNumber }}</td>
            <td>{{ formatCurrency(inst.dueAmount) }}</td>
            <td class="success">{{ formatCurrency(inst.paidAmount) }}</td>
            <td :class="inst.remainingAmount > 0 ? 'error' : 'success'">
              {{ formatCurrency(inst.remainingAmount) }}
            </td>
            <td>{{ toYmdWithTime(inst.dueDate) }}</td>
            <td>{{ inst.paidDate ? toYmdWithTime(inst.paidDate) : '-' }}</td>
            <td>{{ getInstallmentStatusLabel(inst) }}</td>
          </tr>
        </tbody>
      </table>
    </section>

    <!-- ===== PAYMENTS ===== -->
    <section v-if="props.sale.payments?.length" class="table-section">
      <h5>سجل الدفعات</h5>
      <table class="payments-table">
        <thead>
          <tr>
            <th>#</th>
            <th>المبلغ</th>
            <th>طريقة الدفع</th>
            <th>التاريخ</th>
            <th>بواسطة</th>
            <th>ملاحظات</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(p, i) in props.sale.payments" :key="p.id">
            <td>{{ i + 1 }}</td>
            <td class="success">{{ formatCurrency(p.amount) }}</td>
            <td>{{ getPaymentMethodText(p.paymentMethod) }}</td>
            <td>{{ toYmdWithTime(p.createdAt) }}</td>
            <td>{{ p.createdBy || 'غير معروف' }}</td>
            <td>{{ p.notes || '-' }}</td>
          </tr>
        </tbody>
      </table>
    </section>

    <!-- ===== FOOTER ===== -->
    <footer class="invoice-footer">
      <p>تم إنشاء هذه الفاتورة إلكترونيًا بواسطة {{ props.sale.createdBy || 'غير معروف' }}</p>
    </footer>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useSettingsStore } from '@/stores/settings';

const props = defineProps({
  sale: {
    type: Object || null,
    required: true,
  },
});

const settingsStore = useSettingsStore();

const company = ref({});
const invoiceType = ref('a4'); // Default to A4

const items = props.sale.items.map((item) => {
  const baseSubtotal = item.subtotal ?? item.unitPrice * item.quantity;
  const netSubtotal = baseSubtotal; // backend subtotal already considers discount; fallback uses baseSubtotal
  return {
    ...item,
    netSubtotal,
  };
});

// حساب المجموع الفرعي للمنتجات
const subtotalItems = items.reduce((sum, item) => sum + item.netSubtotal, 0);

// Format currency dynamically based on sale currency
const formatCurrency = (val) => {
  const currency = props.sale.currency || 'IQD';
  return new Intl.NumberFormat('ar', {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: currency === 'USD' ? 2 : 0,
  }).format(val || 0);
};

// toYmd with time
const toYmdWithTime = (d) => {
  const date = new Date(d);
  return date.toISOString().split('T')[0] + ' ' + date.toTimeString().split(' ')[0];
};

const getStatusText = (s) =>
  ({
    completed: 'مكتمل',
    pending: 'غير مكتمل',
    cancelled: 'ملغي',
  })[s] || s;

const getPaymentTypeText = (t) => ({ cash: 'نقدي', installment: 'تقسيط' })[t] || t;

const getPaymentMethodText = (m) =>
  ({ cash: 'نقدي', card: 'بطاقة', bank_transfer: 'تحويل بنكي' })[m] || m;

const getInstallmentStatusLabel = (i) =>
  i.status === 'paid' ? 'مدفوع' : new Date(i.dueDate) < new Date() ? 'متأخر' : 'قيد الانتظار';

onMounted(async () => {
  await settingsStore.fetchAllSettings();
  company.value = settingsStore.settings.company;
  // Get invoiceType from settings, default to a4
  invoiceType.value = settingsStore.settings.company?.invoiceType || 'a4';
});
</script>

<style scoped>
/* ===== BASE STYLES ===== */
.print-container {
  direction: rtl;
  font-family: 'Cairo', sans-serif;
  color: #222;
  background: #fff;
  margin: 0 auto;
  padding: 16px;
  width: 100%;
  box-sizing: border-box;
}

/* ====== A4 FORMAT (210mm × 297mm) ====== */
.invoice-a4 {
  max-width: 210mm;
}

/* ====== A5 FORMAT (148mm × 210mm) ====== */
.invoice-a5 {
  max-width: 148mm;
}

.invoice-a5 .invoice-header {
  flex-direction: column;
  gap: 8px;
}

.invoice-a5 .header-left,
.invoice-a5 .header-right {
  min-width: 100%;
}

.invoice-a5 h4 {
  font-size: 16px;
  margin-bottom: 4px !important;
}

.invoice-a5 h5 {
  font-size: 13px;
}

.invoice-a5 p {
  font-size: 12px;
  margin-bottom: 2px !important;
}

.invoice-a5 .info-section {
  flex-direction: column;
  gap: 8px;
}

.invoice-a5 .info-section div {
  min-width: 100%;
}

.invoice-a5 .table-section th,
.invoice-a5 .table-section td {
  padding: 4px;
  font-size: 11px;
}

.invoice-a5 .table-section {
  margin-top: 12px;
}

/* ====== THERMAL 58MM ROLL ====== */
.invoice-roll-58 {
  max-width: 58mm;
  padding: 4px;
  font-size: 11px;
}

.invoice-roll-58 .invoice-header {
  flex-direction: column;
  gap: 2px;
}

.invoice-roll-58 h4 {
  font-size: 13px;
  margin-bottom: 2px !important;
}

.invoice-roll-58 h5 {
  font-size: 11px;
  margin-bottom: 2px !important;
}

.invoice-roll-58 p {
  font-size: 10px;
  margin-bottom: 1px !important;
}

.invoice-roll-58 .status-chip {
  font-size: 9px;
  padding: 2px 4px;
}

.invoice-roll-58 .divider {
  margin: 4px 0;
}

.invoice-roll-58 .info-section {
  flex-direction: column;
  gap: 4px;
  margin: 0;
}

.invoice-roll-58 .info-section div {
  min-width: 100%;
  margin-bottom: 4px;
}

.invoice-roll-58 .table-section {
  margin-top: 8px;
}

.invoice-roll-58 .table-section th,
.invoice-roll-58 .table-section td {
  padding: 2px;
  font-size: 9px;
}

/* إخفاء بعض الأعمدة في الرول الصغير توفيراً للمساحة */
.invoice-roll-58 .products-table th:nth-child(5),
.invoice-roll-58 .products-table td:nth-child(5) {
  display: none;
}

.invoice-roll-58 .payments-table th:nth-child(6),
.invoice-roll-58 .payments-table td:nth-child(6) {
  display: none;
}

.invoice-roll-58 .invoice-footer {
  margin-top: 8px;
  font-size: 9px;
}

/* ====== THERMAL 80MM ROLL ====== */
.invoice-roll-80 {
  max-width: 80mm;
  padding: 6px;
  font-size: 12px;
}

.invoice-roll-80 .invoice-header {
  flex-direction: column;
  gap: 4px;
}

.invoice-roll-80 h4 {
  font-size: 14px;
  margin-bottom: 3px !important;
}

.invoice-roll-80 h5 {
  font-size: 12px;
  margin-bottom: 3px !important;
}

.invoice-roll-80 p {
  font-size: 11px;
  margin-bottom: 2px !important;
}

.invoice-roll-80 .status-chip {
  font-size: 10px;
  padding: 3px 5px;
}

.invoice-roll-80 .divider {
  margin: 6px 0;
}

.invoice-roll-80 .info-section {
  flex-direction: column;
  gap: 6px;
}

.invoice-roll-80 .info-section div {
  min-width: 100%;
}

.invoice-roll-80 .table-section {
  margin-top: 10px;
}

.invoice-roll-80 .table-section th,
.invoice-roll-80 .table-section td {
  padding: 3px;
  font-size: 10px;
}

.invoice-roll-80 .payments-table th:nth-child(6),
.invoice-roll-80 .payments-table td:nth-child(6) {
  display: none;
}

.invoice-roll-80 .invoice-footer {
  margin-top: 10px;
  font-size: 10px;
}

/* ====== THERMAL WIDE ROLL (100-120MM) ====== */
.invoice-roll-wide {
  max-width: 120mm;
  padding: 8px;
  font-size: 13px;
}

.invoice-roll-wide .invoice-header {
  flex-direction: column;
  gap: 6px;
}

.invoice-roll-wide h4 {
  font-size: 15px;
  margin-bottom: 4px !important;
}

.invoice-roll-wide h5 {
  font-size: 13px;
  margin-bottom: 4px !important;
}

.invoice-roll-wide p {
  font-size: 12px;
  margin-bottom: 2px !important;
}

.invoice-roll-wide .status-chip {
  font-size: 11px;
  padding: 4px 6px;
}

.invoice-roll-wide .divider {
  margin: 8px 0;
}

.invoice-roll-wide .info-section {
  flex-direction: column;
  gap: 8px;
}

.invoice-roll-wide .info-section div {
  min-width: 100%;
}

.invoice-roll-wide .table-section {
  margin-top: 12px;
}

.invoice-roll-wide .table-section th,
.invoice-roll-wide .table-section td {
  padding: 4px;
  font-size: 11px;
}

.invoice-roll-wide .invoice-footer {
  margin-top: 12px;
  font-size: 11px;
}

/* ===== COMMON STYLES ===== */
.invoice-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.header-left,
.header-right {
  flex: 1;
  min-width: 0;
}

.status-chip {
  padding: 5px 8px;
  border-radius: 8px;
  font-weight: 600;
  color: #fff;
  text-align: start;
  font-size: 13px;
}

.status-chip.pending {
  color: #ffb300;
}

.status-chip.completed {
  color: #43a047;
}

.status-chip.cancelled {
  color: #e53935;
}

/* ====== INFO SECTION ====== */
.info-section {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 24px;
}

.info-section div {
  flex: 1;
  min-width: 220px;
}

/* ====== TABLES ====== */
.table-section {
  margin-top: 24px;
}

.table-section h5 {
  margin-bottom: 4px;
}

.table-section table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 4px;
}

.table-section th,
.table-section td {
  border: 1px solid #ccc;
  padding: 8px;
  text-align: center;
  font-size: 14px;
  word-wrap: break-word;
}

.table-section th {
  background: #f5f5f5;
  font-weight: 600;
}

.table-section tfoot td {
  border-top: 2px solid #999;
  padding: 10px 8px;
  font-size: 13px;
}

.table-section tfoot .total-row td {
  border-top: 3px double #333;
  padding-top: 12px;
  font-size: 15px;
  background: #f9f9f9;
}

.text-left {
  text-align: left !important;
}

.font-weight-bold {
  font-weight: 700;
}

.total {
  font-size: 20px;
  font-weight: bold;
  color: #1565c0;
}

.success {
  color: #2e7d32;
}

.error {
  color: #c62828;
}

.divider {
  margin: 20px 0;
  border: none;
  border-top: 1px solid #ddd;
}

/* ====== FOOTER ====== */
.invoice-footer {
  text-align: center;
  font-size: 13px;
  color: #666;
  margin-top: 32px;
}

/* =========================
   RESPONSIVE FOR MOBILE
   ========================= */
@media screen and (max-width: 768px) {
  .print-container {
    padding: 12px;
    max-width: 100%;
  }

  .invoice-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .info-section {
    flex-direction: column;
  }

  .info-section div {
    min-width: 100%;
  }

  .table-section th,
  .table-section td {
    padding: 6px;
    font-size: 13px;
  }
}

/* =========================
   PRINT SETTINGS
   ========================= */
@media print {
  @page {
    size: auto;
    margin: 4mm;
  }

  body {
    background: #fff !important;
    margin: 0;
  }

  .print-container {
    padding: 6mm 4mm;
    width: 100%;
    page-break-inside: avoid;
  }

  .table-section,
  .info-section,
  .invoice-header,
  .invoice-footer {
    page-break-inside: avoid;
  }

  /* A4 print setup */
  .invoice-a4 {
    max-width: 210mm;
  }

  /* A5 print setup */
  .invoice-a5 {
    max-width: 148mm;
  }

  /* 58mm roll print */
  .invoice-roll-58 {
    max-width: 58mm;
    width: 58mm;
  }

  /* 80mm roll print */
  .invoice-roll-80 {
    max-width: 80mm;
    width: 80mm;
  }

  /* Wide roll print */
  .invoice-roll-wide {
    max-width: 120mm;
    width: 120mm;
  }
}
</style>
