<template>
  <div class="receipt-container a5">
    <!-- ===== HEADER ===== -->
    <header class="receipt-header">
      <div class="company-name">
        <h3>{{ company?.name || 'Store' }}</h3>
      </div>
      <div class="company-info">
        <div class="company-address">
          <span>العنوان: </span>
          <span>{{ company?.city }} / {{ company?.area }} / {{ company?.street }}</span>
        </div>

        <div class="company-phones">
          <div v-if="company?.phone">رقم الهاتف: {{ company.phone }}</div>
          <div v-if="company?.phone2">رقم الهاتف 2: {{ company.phone2 }}</div>
        </div>
      </div>
    </header>

    <!-- ===== INVOICE META ===== -->
    <section class="invoice-meta">
      <div>رقم الفاتورة: {{ sale?.invoiceNumber || '' }}</div>
      <div>التاريخ: {{ toYmdWithTime(sale?.createdAt) }}</div>
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
          <th>خصم المنتج</th>
          <th>الإجمالي</th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="item in sale?.items || []" :key="item.id ?? item.productId">
          <td>{{ item.productName }}</td>
          <td class="center">{{ item.quantity }}</td>
          <td class="right">
            {{ formatCurrencyShort(item.unitPrice, sale.currency) }}
          </td>
          <td class="right">
            {{ formatCurrencyShort(item.discount || 0, sale.currency) }}
          </td>
          <td class="right">
            {{ formatCurrencyShort(item.subtotal, sale.currency) }}
          </td>
        </tr>
      </tbody>

      <tfoot>
        <!-- Subtotal (if installment with interest) -->
        <tr v-if="sale.paymentType === 'installment' && sale.interestAmount > 0">
          <td colspan="4" class="right"><strong>المجموع الفرعي</strong></td>
          <td class="right">
            <strong>{{ formatCurrencyShort(sale.subtotal, sale.currency) }}</strong>
          </td>
        </tr>

        <tr>
          <td colspan="4" class="right"><strong>الخصم على الفاتورة</strong></td>
          <td class="right">
            <strong>{{ formatCurrencyShort(sale.discount || 0, sale.currency) }}</strong>
          </td>
        </tr>

        <!-- Interest (if installment with interest) -->
        <tr v-if="sale.paymentType === 'installment' && sale.interestAmount > 0">
          <td colspan="4" class="right">
            <strong>الفائدة ({{ sale.interestRate }}%)</strong>
          </td>
          <td class="right">
            <strong>{{ formatCurrencyShort(sale.interestAmount, sale.currency) }}</strong>
          </td>
        </tr>

        <!-- Total -->
        <tr>
          <td colspan="4" class="right">
            <strong>{{
              sale.paymentType === 'installment' && sale.interestAmount > 0
                ? 'الإجمالي النهائي'
                : 'المجموع'
            }}</strong>
          </td>
          <td class="right">
            <strong>{{ formatCurrencyShort(sale.total, sale.currency) }}</strong>
          </td>
        </tr>
      </tfoot>
    </table>

    <!-- ===== INSTALLMENTS TABLE ===== -->
    <div
      class="installment-section"
      v-if="sale.paymentType === 'installment' && installments.length > 0"
    >
      <h5>جدول الاقساط</h5>
      <table class="installments-table">
        <thead>
          <tr>
            <th>#</th>
            <th>تاريخ الاستحقاق</th>
            <th>المبلغ المستحق</th>
            <th>المدفوع</th>
            <th>المتبقي</th>
            <th>الحالة</th>
            <th>ملاحظات</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="inst in installments" :key="inst.id">
            <td class="center">{{ inst.installmentNumber }}</td>

            <td class="center">
              {{ toYmd(inst.dueDate) }}
            </td>

            <td class="right">
              {{ formatCurrencyShort(inst.dueAmount, inst.currency) }}
            </td>

            <td class="right">
              {{ formatCurrencyShort(inst.paidAmount, inst.currency) }}
            </td>

            <td class="right">
              {{ formatCurrencyShort(inst.remainingAmount, inst.currency) }}
            </td>

            <td class="center">
              <span class="status" :class="inst.status">
                {{ getInstallmentStatusLabel(inst.status) }}
              </span>
            </td>

            <td>{{ inst.notes || '-' }}</td>
          </tr>
        </tbody>

        <tfoot>
          <tr>
            <td colspan="2"><strong>الإجمالي</strong></td>
            <td class="right">
              {{ formatCurrencyShort(totalDue, installments[0].currency) }}
            </td>
            <td class="right">
              {{ formatCurrencyShort(totalPaid, installments[0].currency) }}
            </td>
            <td class="right">
              {{ formatCurrencyShort(totalRemaining, installments[0].currency) }}
            </td>
            <td colspan="2"></td>
          </tr>
        </tfoot>
      </table>
    </div>

    <section class="payment-summary">
      <div><strong>طريقة الدفع:</strong> {{ getPaymentTypeText(sale.paymentType) }}</div>
      <div v-if="sale.paymentType === 'installment' && sale.interestRate > 0">
        <strong>نسبة الفائدة:</strong> {{ sale.interestRate }}%
      </div>
      <div><strong>المدفوع:</strong> {{ formatCurrencyShort(sale.paidAmount, sale.currency) }}</div>
      <div>
        <strong>المتبقي:</strong> {{ formatCurrencyShort(sale.remainingAmount, sale.currency) }}
      </div>
    </section>
  </div>
</template>

<script setup>
import './a5.css';
import { ref, onMounted, computed } from 'vue';
import {
  toYmdWithTime,
  formatCurrencyShort,
  toYmd,
  getInstallmentStatusLabel,
  getPaymentTypeText,
} from '@/utils/helpers';
import { useSettingsStore } from '@/stores/settings';

const settingsStore = useSettingsStore();

const props = defineProps({
  sale: {
    type: Object,
    required: true,
  },
});

const company = ref(null);

const installments = computed(() => props.sale?.installments || []);

const totalDue = computed(() => installments.value.reduce((s, i) => s + i.dueAmount, 0));

const totalPaid = computed(() => installments.value.reduce((s, i) => s + i.paidAmount, 0));

const totalRemaining = computed(() =>
  installments.value.reduce((s, i) => s + i.remainingAmount, 0)
);

onMounted(async () => {
  try {
    await settingsStore.fetchAllSettings();
    company.value = settingsStore.settings.company || null;
  } catch (e) {
    // swallow fetch errors in print component to avoid blocking render
  }
});
</script>
