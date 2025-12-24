<template>
  <div class="pa-4">
    <!-- Header -->
    <div class="mb-8 d-flex justify-space-between align-center">
      <div>
        <h1 class="mb-1 text-h4 font-weight-bold">📊 التقارير والتحليلات</h1>
        <p class="text-body-2 text-grey-darken-1">نظرة شاملة على أداء المبيعات للفترة المحددة</p>
      </div>

      <div class="gap-2 d-flex">
        <v-btn
          color="error"
          variant="flat"
          prepend-icon="mdi-file-pdf-box"
          :disabled="!report"
          @click="exportToPDF"
        >
          PDF
        </v-btn>
      </div>
    </div>

    <!-- Filters -->
    <v-card class="mb-8 pa-4">
      <v-row density="comfortable">
        <v-col cols="12" md="4">
          <v-menu
            v-model="menus.start"
            :close-on-content-click="true"
            transition="scale-transition"
            min-width="auto"
          >
            <template #activator="{ props }">
              <v-text-field
                v-model="formattedStartDate"
                label="من تاريخ"
                readonly
                prepend-inner-icon="mdi-calendar"
                v-bind="props"
                density="comfortable"
              ></v-text-field>
            </template>
            <v-date-picker
              v-model="filters.startDate"
              color="primary"
              elevation="4"
              @change="
                () => {
                  menuStart = false;
                }
              "
            ></v-date-picker>
          </v-menu>
        </v-col>

        <v-col cols="12" md="4">
          <v-menu
            v-model="menus.end"
            :close-on-content-click="true"
            transition="scale-transition"
            min-width="auto"
          >
            <template #activator="{ props }">
              <v-text-field
                v-model="formattedEndDate"
                label="إلى تاريخ"
                readonly
                prepend-inner-icon="mdi-calendar"
                v-bind="props"
                density="comfortable"
              ></v-text-field>
            </template>
            <v-date-picker
              v-model="filters.endDate"
              color="primary"
              elevation="4"
              @change="
                () => {
                  menuEnd = false;
                }
              "
            ></v-date-picker>
          </v-menu>
        </v-col>

        <v-col cols="12" md="4">
          <v-select
            v-model="filters.currency"
            :items="currencyOptions"
            label="العملة"
            density="comfortable"
            :disabled="!settingsStore.showSecondaryCurrency"
            :hint="!settingsStore.showSecondaryCurrency ? 'العملة الثانوية مخفية - يتم استخدام العملة الافتراضية فقط' : ''"
            persistent-hint
          >
            <template #prepend-inner>
              <v-icon>mdi-currency-usd</v-icon>
            </template>
          </v-select>
        </v-col>
      </v-row>
      <v-btn color="primary" :loading="loading" @click="fetchReport">
        <v-icon start>mdi-magnify</v-icon> عرض التقرير
      </v-btn>
    </v-card>

    <!-- Main Stats -->
    <v-row v-if="report" density="comfortable">
      <!-- عدد المبيعات -->
      <v-col cols="12" md="4">
        <v-card class="pa-4">
          <div class="d-flex justify-space-between align-center">
            <div>
              <div class="text-h5 font-weight-bold text-primary">{{ report.count || 0 }}</div>
              <div class="text-body-2 text-grey">عدد المبيعات</div>
            </div>
            <v-icon size="42" color="primary">mdi-counter</v-icon>
          </div>
        </v-card>
      </v-col>

      <!-- مبيعات مكتملة -->
      <v-col cols="12" md="4">
        <v-card class="pa-4">
          <div class="d-flex justify-space-between align-center">
            <div>
              <div class="text-h6 font-weight-bold text-success">
                {{ report.completedSales || 0 }}
              </div>
              <div class="text-body-2 text-grey">مبيعات مكتملة</div>
            </div>
            <v-icon size="42" color="success">mdi-check-circle</v-icon>
          </div>
        </v-card>
      </v-col>

      <!-- مبيعات معلقة -->
      <v-col cols="12" md="4">
        <v-card class="pa-4">
          <div class="d-flex justify-space-between align-center">
            <div>
              <div class="text-h6 font-weight-bold text-warning">
                {{ report.pendingSales || 0 }}
              </div>
              <div class="text-body-2 text-grey">مبيعات معلقة</div>
            </div>
            <v-icon size="42" color="warning">mdi-clock-outline</v-icon>
          </div>
        </v-card>
      </v-col>

      <!-- مؤشرات حسب العملة المختارة -->
      <v-col cols="12" md="3">
        <v-card class="pa-4">
          <div class="d-flex justify-space-between align-center">
            <div>
              <div class="text-h6 font-weight-bold text-success">
                {{ reportByCurrency.format(reportByCurrency.sales || 0) }}
              </div>
              <div class="text-body-2 text-grey">
                إجمالي المبيعات ({{ reportByCurrency.currencyLabel }})
              </div>
            </div>
            <v-icon size="42" color="success">mdi-cash</v-icon>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" md="3">
        <v-card class="pa-4">
          <div class="d-flex justify-space-between align-center">
            <div>
              <div class="text-h6 font-weight-bold text-info">
                {{ reportByCurrency.format(reportByCurrency.paid || 0) }}
              </div>
              <div class="text-body-2 text-grey">
                المدفوع ({{ reportByCurrency.currencyLabel }})
              </div>
            </div>
            <v-icon size="42" color="info">mdi-cash-check</v-icon>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" md="3">
        <v-card class="pa-4">
          <div class="d-flex justify-space-between align-center">
            <div>
              <div class="text-h6 font-weight-bold text-red-darken-2">
                {{ reportByCurrency.format(reportByCurrency.discount || 0) }}
              </div>
              <div class="text-body-2 text-grey">إجمالي الخصومات</div>
            </div>
            <v-icon size="42" color="red-darken-2">mdi-tag-off</v-icon>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" md="3">
        <v-card class="pa-4">
          <div class="d-flex justify-space-between align-center">
            <div>
              <div class="text-h6 font-weight-bold" style="color: #ff9800">
                {{ reportByCurrency.format(reportByCurrency.interest || 0) }}
              </div>
              <div class="text-body-2 text-grey">إجمالي الفائدة</div>
            </div>
            <v-icon size="42" color="amber-darken-2">mdi-percent</v-icon>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" md="3">
        <v-card class="pa-4">
          <div class="d-flex justify-space-between align-center">
            <div>
              <div class="text-h6 font-weight-bold text-purple">
                {{ reportByCurrency.format(reportByCurrency.avgSale || 0) }}
              </div>
              <div class="text-body-2 text-grey">متوسط البيع</div>
            </div>
            <v-icon size="42" color="purple">mdi-finance</v-icon>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" md="3">
        <v-card class="pa-4">
          <div class="d-flex justify-space-between align-center">
            <div>
              <div class="text-h6 font-weight-bold text-pink-darken-2">
                {{ reportByCurrency.format(reportByCurrency.profit || 0) }}
              </div>
              <div class="text-body-2 text-grey">الربح</div>
            </div>
            <v-icon size="42" color="pink-darken-2">mdi-cash-plus</v-icon>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" md="3">
        <v-card class="pa-4">
          <div class="d-flex justify-space-between align-center">
            <div>
              <div class="text-h6 font-weight-bold text-indigo">
                {{ reportByCurrency.format(reportByCurrency.avgProfit || 0) }}
              </div>
              <div class="text-body-2 text-grey">متوسط الربح</div>
            </div>
            <v-icon size="42" color="indigo">mdi-poll</v-icon>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" md="3">
        <v-card class="pa-4">
          <div class="d-flex justify-space-between align-center">
            <div>
              <div class="text-h6 font-weight-bold text-cyan-darken-2">
                {{ reportByCurrency.profitMargin || 0 }}%
              </div>
              <div class="text-body-2 text-grey">هامش الربح</div>
            </div>
            <v-icon size="42" color="cyan-darken-2">mdi-percent</v-icon>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useSaleStore } from '@/stores/sale';
import { useNotificationStore } from '@/stores/notification';
import { useSettingsStore } from '@/stores/settings';

const saleStore = useSaleStore();
const notificationStore = useNotificationStore();
const settingsStore = useSettingsStore();
const loading = ref(false);
const report = ref(null);
const menus = ref({
  start: false,
  end: false,
});
const filters = ref({
  startDate: null,
  endDate: null,
  currency: null,
});

// Computed property for available currencies based on settings
const currencyOptions = computed(() => {
  const available = settingsStore.availableCurrencies || ['USD', 'IQD'];
  return available.map(currency => ({
    title: currency === 'USD' ? 'دولار (USD)' : 'دينار عراقي (IQD)',
    value: currency,
  }));
});

const defaultCurrency = computed(() => settingsStore.settings?.defaultCurrency || 'IQD');
const selectedCurrency = computed(() => {
  // إذا كانت العملة المحددة غير متاحة، استخدم العملة الافتراضية
  const available = settingsStore.availableCurrencies || ['IQD'];
  if (filters.value.currency && available.includes(filters.value.currency)) {
    return filters.value.currency;
  }
  return defaultCurrency.value;
});

// Watch for showSecondaryCurrency changes and reset currency if needed
watch(
  () => settingsStore.showSecondaryCurrency,
  (showSecondary) => {
    if (!showSecondary) {
      // إذا تم إخفاء العملة الثانوية، استخدم العملة الافتراضية فقط
      const defaultCurr = settingsStore.settings?.defaultCurrency || 'IQD';
      if (filters.value.currency !== defaultCurr) {
        filters.value.currency = defaultCurr;
      }
    }
  }
);

const toYmd = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// 🔹 Formatting helpers
const formatUSD = (amount) =>
  `$${parseFloat(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
const formatIQD = (amount) =>
  `${parseFloat(amount || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })} IQD`;

// بيانات التقرير حسب العملة المختارة
const reportByCurrency = computed(() => {
  const cur = selectedCurrency.value;
  const r = report.value || {};
  const isUSD = cur === 'USD';

  return {
    currency: cur,
    sales: isUSD ? r.salesUSD : r.salesIQD,
    paid: isUSD ? r.paidUSD : r.paidIQD,
    discount: isUSD ? r.discountUSD : r.discountIQD,
    interest: isUSD ? r.interestUSD : r.interestIQD,
    profit: isUSD ? r.profitUSD : r.profitIQD,
    avgSale: isUSD ? r.avgSaleUSD : r.avgSaleIQD,
    avgProfit: isUSD ? r.avgProfitUSD : r.avgProfitIQD,
    profitMargin: isUSD ? r.profitMarginUSD : r.profitMarginIQD,
    format: isUSD ? formatUSD : formatIQD,
    currencyLabel: isUSD ? 'USD' : 'IQD',
  };
});

const formattedStartDate = computed({
  get: () => toYmd(filters.value.startDate),
  set: (val) => {
    filters.value.startDate = val ? new Date(val) : null;
  },
});

const formattedEndDate = computed({
  get: () => toYmd(filters.value.endDate),
  set: (val) => {
    filters.value.endDate = val ? new Date(val) : null;
  },
});

// 🔹 Fetch report
const fetchReport = async () => {
  loading.value = true;

  try {
    report.value = await saleStore.getSalesReport({
      startDate: toYmd(filters.value.startDate),
      endDate: toYmd(filters.value.endDate),
      currency: filters.value.currency || defaultCurrency.value,
    });
  } catch {
    notificationStore.error('حدث خطأ أثناء تحميل التقرير');
  } finally {
    loading.value = false;
  }
};

// 🔹 Export to PDF (تصميم احترافي للطباعة)
const exportToPDF = () => {
  if (!report.value) return;

  const win = window.open('', '', 'height=800,width=1000');

  win.document.write(`
    <html dir="rtl">
      <head>
        <title>تقرير المبيعات</title>
        <style>
          body {
            font-family: "Cairo", Arial, sans-serif;
            padding: 30px;
            direction: rtl;
            background: #f9fafb;
            color: #333;
          }

          h1 {
            text-align: center;
            color: white;
            margin-bottom: 10px;
          }

          .subtitle {
            text-align: center;
            color: #555;
            font-size: 14px;
            margin-bottom: 30px;
          }

          .info-box {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
            background: #e3f2fd;
            border-radius: 8px;
            padding: 12px 20px;
          }

          .info-box div {
            font-size: 14px;
            color: #333;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 25px;
            border-radius: 8px;
            overflow: hidden;
          }

          th {
            background-color: #1976d2;
            color: #fff;
            padding: 12px;
            font-size: 15px;
          }

          td {
            border: 1px solid #ccc;
            padding: 10px;
            text-align: center;
            background: #fff;
          }

          tr:nth-child(even) td {
            background: #f2f6fc;
          }

          tr:hover td {
            background: #e1f5fe;
          }

          .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 12px;
            color: #888;
          }

          .currency-label {
            font-weight: bold;
            color: #1976d2;
          }
        </style>
      </head>

      <body>
        <h1>📊 تقرير المبيعات</h1>
        <div class="subtitle">نظرة شاملة على الأداء المالي للفترة المحددة</div>

        <div class="info-box">
          <div><strong>من:</strong> ${filters.value.startDate || '---'}</div>
          <div><strong>إلى:</strong> ${filters.value.endDate || '---'}</div>
        </div>

        <table>
          <tr>
            <th>المقياس</th>
            <th><span class="currency-label">${reportByCurrency.value.currencyLabel}</span></th>
          </tr>

          <tr>
            <td>إجمالي المبيعات</td>
            <td>${reportByCurrency.value.format(reportByCurrency.value.sales || 0)}</td>
          </tr>

          <tr>
            <td>المدفوع</td>
            <td>${reportByCurrency.value.format(reportByCurrency.value.paid || 0)}</td>
          </tr>

          <tr>
            <td>إجمالي الخصومات</td>
            <td>${reportByCurrency.value.format(reportByCurrency.value.discount || 0)}</td>
          </tr>

          <tr>
            <td>إجمالي الفائدة</td>
            <td>${reportByCurrency.value.format(reportByCurrency.value.interest || 0)}</td>
          </tr>

          <tr>
            <td>متوسط البيع</td>
            <td>${reportByCurrency.value.format(reportByCurrency.value.avgSale || 0)}</td>
          </tr>

          <tr>
            <td>إجمالي الربح</td>
            <td>${reportByCurrency.value.format(reportByCurrency.value.profit || 0)}</td>
          </tr>

          <tr>
            <td>متوسط الربح</td>
            <td>${reportByCurrency.value.format(reportByCurrency.value.avgProfit || 0)}</td>
          </tr>

          <tr>
            <td>هامش الربح %</td>
            <td>${reportByCurrency.value.profitMargin || 0}%</td>
          </tr>

          <tr>
            <td>عدد الفواتير</td>
            <td colspan="2">${report.value.count || 0}</td>
          </tr>

          <tr>
            <td>مبيعات مكتملة</td>
            <td colspan="2">${report.value.completedSales || 0}</td>
          </tr>

          <tr>
            <td>مبيعات معلقة</td>
            <td colspan="2">${report.value.pendingSales || 0}</td>
          </tr>

          <tr>
            <td>أقساط متأخرة</td>
            <td colspan="2">${report.value.overdueInstallments || 0}</td>
          </tr>
        </table>

        <div class="footer">
          <p>تم إنشاء هذا التقرير تلقائيًا بتاريخ ${new Date().toLocaleDateString('ar', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            numberingSystem: 'latn',
          })}</p>
        </div>
      </body>
    </html>
  `);

  win.document.close();
  win.print();

  notificationStore.success('📄 تم تجهيز تقرير PDF للطباعة');
};

onMounted(() => {
  const load = async () => {
    try {
      await settingsStore.fetchCurrencySettings();
    } catch (e) {
      // Error handled silently
    }

    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    filters.value.startDate = start.toISOString().split('T')[0];
    filters.value.endDate = end.toISOString().split('T')[0];
    filters.value.currency = defaultCurrency.value;
    fetchReport();
  };

  load();
});
</script>
