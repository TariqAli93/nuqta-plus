<template>
  <v-card class="useful-info-card" elevation="2" rounded="xl">
    <v-card-title class="d-flex align-center justify-space-between pa-4 pb-2">
      <div class="d-flex align-center gap-2">
        <v-icon color="primary" size="24">mdi-lightbulb-on-outline</v-icon>
        <span class="text-h6 font-weight-bold">معلومات مفيدة اليوم</span>
      </div>
      <v-chip size="small" color="primary" variant="flat">
        {{ todayDate }}
      </v-chip>
    </v-card-title>
    <v-divider></v-divider>
    <v-card-text class="pa-4">
      <v-list>
        <v-list-item>
          <v-list-item-icon>
            <v-icon color="success">mdi-calendar-check</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>
              هل تعلم؟ يمكنك عرض ملخص مبيعاتك اليومية وتفاصيلها عبر لوحة التحكم لمراجعة أداء متجرك بشكل سريع.
            </v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item>
          <v-list-item-icon>
            <v-icon color="info">mdi-currency-iqd</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>
              مجموع مبيعات اليوم: <span class="font-weight-bold">{{ formatCurrency(todayTotal) }}</span>
            </v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item>
          <v-list-item-icon>
            <v-icon color="warning">mdi-account-group</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>
              عدد العمليات الناجحة اليوم: <span class="font-weight-bold">{{ todayCount }}</span>
            </v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item>
          <v-list-item-icon>
            <v-icon color="primary">mdi-lightbulb-question</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>
              نصيحة: راقب المنتجات الأكثر مبيعاً لتزيد مخزونها وتحسن خططك التسويقية.
            </v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useCurrency } from '@/composables/useCurrency';

const props = defineProps({
  sales: {
    type: Array,
    default: () => [],
  },
});

const {
  initialize: initCurrency,
  convertAmountSync,
  formatCurrency: formatCurrencyAmount,
} = useCurrency();

const todayDate = computed(() => {
  const today = new Date();
  return today.toLocaleDateString('ar-EG', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
});

const todaySales = computed(() => {
  const todayStr = new Date().toISOString().split('T')[0];
  return props.sales.filter(
    (s) => s.createdAt && s.createdAt.startsWith(todayStr) && s.status === 'completed'
  );
});

const todayTotal = computed(() => {
  return todaySales.value.reduce((sum, s) => {
    const amount = parseFloat(s.total || 0);
    const currency = s.currency || 'IQD';
    const converted = convertAmountSync(amount, currency);
    return sum + converted;
  }, 0);
});

const todayCount = computed(() => todaySales.value.length);

const formatCurrency = (amount) => {
  return formatCurrencyAmount(amount);
};

onMounted(async () => {
  await initCurrency();
});
</script>

<style scoped>
.useful-info-card {
  transition: all 0.3s ease;
}
.useful-info-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.11) !important;
}
.v-list-item-title {
  font-size: 1rem;
  line-height: 1.6;
}
</style>
