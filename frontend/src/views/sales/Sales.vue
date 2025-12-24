<template>
  <div>
    <v-card class="mb-4">
      <div class="flex justify-space-between items-center pa-3">
        <div class="text-h6 font-semibold text-primary">إدارة المبيعات</div>
        <v-btn color="primary" prepend-icon="mdi-plus" size="default" to="/sales/new"> بيع جديد </v-btn>
      </div>
    </v-card>

    <v-card class="mb-4">
      <div class="flex justify-lg-space-between items-center pa-3 gap-4">
        <v-select
          v-model="filters.status"
          :items="statusOptions"
          label="الحالة"
          clearable
          hide-details
          density="comfortable"
          @update:model-value="handleFilter"
        ></v-select>

        <!-- العميل -->
        <v-autocomplete
          v-model="filters.customer"
          :items="customers"
          item-title="name"
          item-value="id"
          label="العميل"
          hide-details
          density="comfortable"
          clearable
          @update:model-value="handleFilter"
          :custom-filter="customFilter"
        >
          <template v-slot:item="{ props, item }">
            <v-list-item v-bind="props">
              <template v-slot:title>
                {{ item.raw.name }}
              </template>
              <template v-slot:subtitle>
                {{ item.raw.phone }}
              </template>
            </v-list-item>
          </template>
          <template v-slot:selection="{ item }">
            {{ item.raw.name }} - {{ item.raw.phone }}
          </template>
        </v-autocomplete>

        <v-text-field
          v-model="filters.startDate"
          label="من تاريخ"
          type="date"
          hide-details
          density="comfortable"
          @change="handleFilter"
        ></v-text-field>

        <v-text-field
          v-model="filters.endDate"
          label="إلى تاريخ"
          type="date"
          hide-details
          density="comfortable"
          @change="handleFilter"
        ></v-text-field>
      </div>
    </v-card>

    <v-card class="mb-4">
      <v-data-table
        :headers="headers"
        :items="saleStore.sales"
        :loading="saleStore.loading"
        @click:row="viewSale"
        class="cursor-pointer"
        density="comfortable"
      >
        <template v-slot:[`item.total`]="{ item }">
          {{ formatCurrency(item.total, item.currency) }}
        </template>
        <template v-slot:[`item.status`]="{ item }">
          <v-chip :color="getStatusColor(item.status)" size="small">
            {{ getStatusText(item.status) }}
          </v-chip>
        </template>
        <template v-slot:[`item.createdAt`]="{ item }">
          {{ toYmd(item.createdAt) }}
        </template>

        <template v-slot:[`item.paymentType`]="{ item }">
          {{ getPaymentTypeText(item.paymentType) }}
        </template>

        <template v-slot:[`item.actions`]="{ item }">
          <!-- أزرار المسودات -->
          <template v-if="item.status === 'draft'">
            <v-btn
              size="small"
              variant="text"
              color="primary"
              icon
              @click.stop="completeDraft(item.id)"
              title="إكمال المسودة"
            >
              <v-icon size="20">mdi-check</v-icon>
            </v-btn>
            <v-btn
              size="small"
              variant="text"
              color="error"
              icon
              :disabled="!canDelete"
              @click.stop="deleteSale(item.id)"
              title="حذف المسودة"
            >
              <v-icon size="20">mdi-delete</v-icon>
            </v-btn>
          </template>
          <!-- أزرار المبيعات العادية -->
          <template v-else>
            <v-btn
              size="small"
              variant="text"
              color="error"
              v-if="item.status !== 'cancelled'"
              icon
              :disabled="!canDelete"
              @click.stop="deleteSale(item.id)"
              title="إلغاء البيع"
            >
              <v-icon size="20">mdi-delete</v-icon>
            </v-btn>
            <v-btn
              size="small"
              variant="text"
              color="success"
              v-if="item.status === 'cancelled'"
              icon
              :disabled="!canDelete"
              @click.stop="restoreSale(item.id)"
              title="استعادة البيع"
            >
              <v-icon size="20">mdi-restore</v-icon>
            </v-btn>
          </template>
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useSaleStore } from '@/stores/sale';
import { useCustomerStore } from '@/stores/customer';
import { useAuthStore } from '../../stores/auth';

const router = useRouter();
const saleStore = useSaleStore();
const customerStore = useCustomerStore();
const authStore = useAuthStore();

const filters = ref({
  status: null,
  startDate: null,
  endDate: null,
  customer: '',
});

const customers = ref([]);
const isAdmin = computed(() => authStore.hasPermission(['sales:delete', 'manage:sales']));
const canDelete = computed(() => isAdmin.value);

const statusOptions = [
  { title: 'مكتمل', value: 'completed' },
  { title: 'قيد الانتظار', value: 'pending' },
  { title: 'ملغي', value: 'cancelled' },
  { title: 'مسودة', value: 'draft' },
];

const headers = [
  { title: 'رقم الفاتورة', key: 'invoiceNumber' },
  { title: 'العميل', key: 'customer' },
  { title: 'رقم الهاتف', key: 'customerPhone' },
  { title: 'المبلغ الإجمالي', key: 'total' },
  { title: 'نوع الدفع', key: 'paymentType' },
  { title: 'الحالة', key: 'status' },
  { title: 'التاريخ', key: 'createdAt' },
  { title: 'بواسطة', key: 'createdBy', sortable: false },
  { title: 'الاجرائات', key: 'actions', sortable: false },
];

const formatCurrency = (amount, currency) => {
  const symbol = currency === 'USD' ? '$' : 'IQD';
  return `${symbol} ${parseFloat(amount).toLocaleString()}`;
};

const toYmd = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getPaymentTypeText = (type) => {
  const types = { cash: 'نقدي', installment: 'تقسيط', mixed: 'مختلط' };
  return types[type] || type;
};

const getStatusColor = (status) => {
  const colors = {
    completed: 'success',
    pending: 'warning',
    cancelled: 'error',
    draft: 'info',
  };
  return colors[status] || 'grey';
};

const getStatusText = (status) => {
  const texts = {
    completed: 'مكتمل',
    pending: 'قيد الانتظار',
    cancelled: 'ملغي',
    draft: 'مسودة',
  };
  return texts[status] || status;
};

const handleFilter = () => {
  saleStore.fetchSales(filters.value);
};

const viewSale = (event, { item }) => {
  // إذا كانت المسودة، انتقل إلى صفحة إكمال البيع
  if (item.status === 'draft') {
    router.push({ name: 'NewSale', query: { draftId: item.id } });
  } else {
    // للمبيعات الأخرى، انتقل إلى صفحة التفاصيل
    router.push({ name: 'SaleDetails', params: { id: item.id } });
  }
};

const deleteSale = async (id) => {
  // التحقق من نوع العملية (مسودة أو بيع عادي)
  const saleItem = saleStore.sales.find(s => s.id === id);
  const isDraft = saleItem?.status === 'draft';
  
  const confirmMessage = isDraft 
    ? 'هل أنت متأكد من حذف هذه المسودة؟'
    : 'هل أنت متأكد من رغبتك في إلغاء هذه المبيعات؟';
  
  if (confirm(confirmMessage)) {
    if (isDraft) {
      // حذف المسودة مباشرة
      try {
        await saleStore.removeSale(id);
        handleFilter();
      } catch {
        // Error handled by store
      }
    } else {
      // إلغاء البيع العادي
      await saleStore.cancelSale(id);
      handleFilter();
    }
  }
};

const restoreSale = async (id) => {
  if (confirm('هل أنت متأكد من رغبتك في استعادة هذه المبيعات؟')) {
    await saleStore.restoreSale(id);
    handleFilter();
  }
};

const completeDraft = async (id) => {
  // الانتقال إلى صفحة إكمال المسودة
  router.push({ name: 'NewSale', query: { draftId: id } });
};

// دالة البحث المخصصة: البحث بالاسم أو رقم الهاتف
const customFilter = (itemText, queryText, item) => {
  const query = queryText.toLowerCase();
  const name = item.raw.name?.toLowerCase() || '';
  const phone = item.raw.phone?.toLowerCase() || '';
  return name.includes(query) || phone.includes(query);
};

onMounted(async () => {
  await saleStore.fetchSales();
  await customerStore.fetchCustomers();
  customers.value = customerStore.customers;
});
</script>
