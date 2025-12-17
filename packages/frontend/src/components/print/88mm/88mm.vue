<template>
  <div class="receipt-container 88mm">
    <!-- ===== HEADER ===== -->
    <header class="receipt-header">
      <div class="company-name">
        <h3>{{ company?.name || 'Store' }}</h3>
      </div>
      <div class="company-info">
        <div class="company-address">{{ company?.city }} / {{ company?.area }}</div>
        <div class="company-phones" v-if="company?.phone">هاتف: {{ company.phone }}</div>
      </div>
    </header>

    <!-- ===== INVOICE META ===== -->
    <section class="invoice-meta">
      <div>رقم الفاتورة: {{ sale?.invoiceNumber || '' }}</div>
      <div>{{ toYmdWithTime(sale?.createdAt) }}</div>
    </section>

    <!-- ===== CUSTOMER ===== -->
    <section class="customer-meta">
      <div><strong>العميل:</strong> {{ sale?.customerName || 'عميل نقدي' }}</div>
      <div v-if="sale?.customerPhone"><strong>الهاتف:</strong> {{ sale.customerPhone }}</div>
    </section>

    <!-- ===== ITEMS TABLE ===== -->
    <table class="invoice-table">
      <thead>
        <tr>
          <th>المنتج</th>
          <th>الكمية</th>
          <th>السعر</th>
          <th>المجموع</th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="item in sale?.items || []" :key="item.id ?? item.productId">
          <td>{{ item.productName }}</td>
          <td class="center">{{ item.quantity }}</td>
          <td class="right">{{ formatCurrencyShort(item.unitPrice, sale.currency) }}</td>
          <td class="right">{{ formatCurrencyShort(item.subtotal, sale.currency) }}</td>
        </tr>
      </tbody>

      <tfoot>
        <!-- Subtotal -->
        <tr v-if="sale.paymentType === 'installment' && sale.interestAmount > 0">
          <td colspan="3" class="right"><strong>المجموع الفرعي</strong></td>
          <td class="right">
            <strong>{{ formatCurrencyShort(sale.subtotal, sale.currency) }}</strong>
          </td>
        </tr>

        <!-- Discount -->
        <tr v-if="sale.discount > 0">
          <td colspan="3" class="right"><strong>الخصم</strong></td>
          <td class="right">
            <strong>{{ formatCurrencyShort(sale.discount, sale.currency) }}</strong>
          </td>
        </tr>

        <!-- Interest -->
        <tr v-if="sale.paymentType === 'installment' && sale.interestAmount > 0">
          <td colspan="3" class="right">
            <strong>الفائدة ({{ sale.interestRate }}%)</strong>
          </td>
          <td class="right">
            <strong>{{ formatCurrencyShort(sale.interestAmount, sale.currency) }}</strong>
          </td>
        </tr>

        <!-- Total -->
        <tr>
          <td colspan="3" class="right">
            <strong>الإجمالي</strong>
          </td>
          <td class="right">
            <strong>{{ formatCurrencyShort(sale.total, sale.currency) }}</strong>
          </td>
        </tr>
      </tfoot>
    </table>

    <section class="payment-summary">
      <div><strong>طريقة الدفع:</strong> {{ getPaymentTypeText(sale.paymentType) }}</div>
      <div><strong>المدفوع:</strong> {{ formatCurrencyShort(sale.paidAmount, sale.currency) }}</div>
      <div>
        <strong>المتبقي:</strong> {{ formatCurrencyShort(sale.remainingAmount, sale.currency) }}
      </div>
    </section>

    <footer class="receipt-footer">
      <p>شكراً لزيارتكم</p>
    </footer>
  </div>
</template>

<script setup>
import './88mm.css';
import { ref, onMounted } from 'vue';
import { toYmdWithTime, formatCurrencyShort, getPaymentTypeText } from '@/utils/helpers';
import { useSettingsStore } from '@/stores/settings';

const settingsStore = useSettingsStore();

const props = defineProps({
  sale: {
    type: Object,
    required: true,
  },
});

const company = ref(null);

onMounted(async () => {
  await settingsStore.fetchAllSettings();
  company.value = settingsStore.settings.company || null;
});
</script>
