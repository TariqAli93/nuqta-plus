<template>
  <div class="customer-selector">
    <!-- Selected Customer Card -->
    <v-card v-if="selectedCustomer && !showSelector" class="mb-4" elevation="0" variant="outlined">
      <v-card-text class="pa-2 d-flex justify-space-between align-center">
        <div class="customer-info">
          <div class="d-flex align-center mb-2">
            <v-icon color="primary" class="ml-2">mdi-account</v-icon>
            <span class="text-h6 font-weight-bold">{{ selectedCustomer.name }}</span>
          </div>
          <div v-if="selectedCustomer.phone" class="text-body-2 text-grey-7">
            <v-icon size="small" class="ml-1">mdi-phone</v-icon>
            {{ selectedCustomer.phone }}
          </div>
          <div v-if="selectedCustomer.city" class="text-body-2 text-grey-7">
            <v-icon size="small" class="ml-1">mdi-map-marker</v-icon>
            {{ selectedCustomer.city }}
          </div>
        </div>
        <v-btn size="small" color="primary" variant="outlined" @click="showSelector = true">
          تغيير العميل
        </v-btn>
      </v-card-text>
    </v-card>

    <!-- Customer Selector & New Customer Form -->
    <v-card v-if="showSelector || !selectedCustomer" class="pa-0" elevation="0">
      <v-card-text class="pa-0 px-3">
        <v-autocomplete
          v-model="internalValue"
          v-model:search="searchQuery"
          :items="displayItems"
          :loading="searchLoading"
          item-title="name"
          item-value="id"
          label="ابحث عن عميل أو أضف عميل جديد"
          prepend-inner-icon="mdi-magnify"
          clearable
          no-data-text="لا توجد نتائج"
          variant="outlined"
          @update:search="onSearchInput"
          @update:model-value="onItemSelect"
        >
          <template #item="{ props: itemProps, item }">
            <v-list-item
              v-if="item.raw.isNewCustomer"
              v-bind="itemProps"
              class="add-new-customer-item"
            >
              <template #prepend>
                <v-icon color="primary">mdi-account-plus</v-icon>
              </template>
              <template #title>
                <div class="font-weight-bold text-primary">
                  إضافة عميل جديد: "{{ item.raw.searchText }}"
                </div>
              </template>
            </v-list-item>
            <v-list-item
              v-else-if="item.raw.isDefault"
              v-bind="itemProps"
              class="default-customer-item"
            >
              <template #prepend>
                <v-icon color="grey">mdi-account-outline</v-icon>
              </template>
              <template #title>
                <div class="font-weight-bold">{{ item.raw.name }}</div>
              </template>
              <template #subtitle>
                <div class="text-caption">عميل افتراضي - مبيعات عامة</div>
              </template>
            </v-list-item>
            <v-list-item v-else v-bind="itemProps">
              <template #prepend>
                <v-icon>mdi-account</v-icon>
              </template>
              <template #title>
                <div class="font-weight-bold">{{ item.raw.name }}</div>
              </template>
              <template #subtitle>
                <div class="text-caption">
                  <span v-if="item.raw.phone">{{ item.raw.phone }}</span>
                  <span v-if="item.raw.city"> • {{ item.raw.city }}</span>
                </div>
              </template>
            </v-list-item>
          </template>
        </v-autocomplete>

        <v-expand-transition>
          <v-form v-if="showNewCustomerForm" ref="newCustomerForm" class="mt-4">
            <v-card variant="outlined" class="pa-4">
              <div class="text-subtitle-1 font-weight-bold mb-3">
                <v-icon class="ml-1">mdi-account-plus</v-icon>
                تفاصيل العميل الجديد
              </div>
              <v-text-field
                v-model="newCustomerData.name"
                label="اسم العميل *"
                :rules="[rules.required]"
                prepend-inner-icon="mdi-account"
                required
              />
              <v-text-field
                v-model="newCustomerData.phone"
                label="رقم الهاتف"
                prepend-inner-icon="mdi-phone"
                type="tel"
              />
              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="newCustomerData.city"
                    label="المدينة"
                    prepend-inner-icon="mdi-map-marker"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="newCustomerData.address"
                    label="العنوان"
                    prepend-inner-icon="mdi-home"
                  />
                </v-col>
              </v-row>
              <v-textarea
                v-model="newCustomerData.notes"
                label="ملاحظات"
                rows="2"
                auto-grow
                prepend-inner-icon="mdi-note-text"
              />
              <div class="d-flex justify-space-between mt-2">
                <v-btn variant="outlined" @click="cancelNewCustomer">إلغاء</v-btn>
                <v-btn color="primary" :loading="creatingCustomer" @click="createNewCustomer">
                  <v-icon class="ml-1">mdi-check</v-icon>
                  حفظ العميل
                </v-btn>
              </div>
            </v-card>
          </v-form>
        </v-expand-transition>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useCustomerStore } from '@/stores/customer';
import { useNotificationStore } from '@/stores/notification';

const props = defineProps({
  modelValue: [Number, Object],
  required: Boolean,
  showLabel: { type: Boolean, default: true },
});

const emit = defineEmits(['update:modelValue', 'customer-selected']);
const customerStore = useCustomerStore();
const notification = useNotificationStore();

// State
const showSelector = ref(!props.modelValue);
const searchQuery = ref('');
const searchResults = ref([]);
const searchLoading = ref(false);
const internalValue = ref(props.modelValue);
const selectedCustomer = ref(null);
const showNewCustomerForm = ref(false);

const newCustomerForm = ref(null);
const creatingCustomer = ref(false);
const newCustomerData = ref({ name: '', phone: '', city: '', address: '', notes: '' });

// Rules
const rules = { required: v => !!v || 'هذا الحقل مطلوب' };

// Display options for autocomplete
const displayItems = computed(() => {
  const items = [...searchResults.value];
  if (searchQuery.value?.length >= 2) {
    const exists = items.some(c => c.name.toLowerCase() === searchQuery.value.toLowerCase());
    if (!exists) {
      items.unshift({
        id: 'new-customer',
        name: `إضافة: ${searchQuery.value}`,
        isNewCustomer: true,
        searchText: searchQuery.value,
      });
    }
  }
  return items;
});

// Autocomplete search
const onSearchInput = async (query) => {
  if (!query || query.length < 2) {
    try {
      const { data } = await customerStore.fetchCustomers({ limit: 50 });
      searchResults.value = data || [];
    } catch {}
    return;
  }
  searchLoading.value = true;
  try {
    const { data } = await customerStore.fetchCustomers({ search: query, limit: 20 });
    searchResults.value = data || [];
  } catch {
    searchResults.value = [];
  } finally {
    searchLoading.value = false;
  }
};

// Handle selection
const onItemSelect = (value) => {
  if (value === 'new-customer') {
    newCustomerData.value.name = searchQuery.value;
    showNewCustomerForm.value = true;
    internalValue.value = null;
  } else if (value) {
    const customer = searchResults.value.find(c => c.id === value);
    if (customer) setSelectedCustomer(customer);
  }
};

function setSelectedCustomer(customer) {
  selectedCustomer.value = customer;
  internalValue.value = customer.id;
  showSelector.value = false;
  showNewCustomerForm.value = false;
  emit('update:modelValue', customer.id);
  emit('customer-selected', customer);
  notification.success(`تم اختيار العميل: ${customer.name}`);
}

// Add new customer
const createNewCustomer = async () => {
  if (!newCustomerForm.value) return notification.error('حدث خطأ في النموذج');
  const { valid } = await newCustomerForm.value.validate();
  if (!valid) return;
  if (!newCustomerData.value.name?.trim()) return notification.error('اسم العميل مطلوب');
  if (newCustomerData.value.phone?.trim()) {
    const exists = searchResults.value.some(
      c => c.phone === newCustomerData.value.phone.trim()
    );
    if (exists) return notification.error('رقم الهاتف مستخدم بالفعل من قبل عميل آخر');
  }
  creatingCustomer.value = true;
  try {
    const { data: newCustomer } = await customerStore.createCustomer(newCustomerData.value);
    if (!newCustomer) throw new Error('Invalid response from server');
    searchResults.value.unshift(newCustomer);
    setSelectedCustomer(newCustomer);
    resetNewCustomerForm();
    notification.success(`تم إضافة العميل: ${newCustomer.name}`);
  } catch (error) {
    let msg = 'فشل في إضافة العميل الجديد';
    const serverMsg = error?.response?.data?.message;
    if (serverMsg) {
      if (serverMsg.includes('phone number already exists') || serverMsg.includes('Customer with this phone')) {
        msg = 'رقم الهاتف مستخدم بالفعل من قبل عميل آخر';
      } else {
        msg = serverMsg;
      }
    } else if (error?.message) {
      msg = error.message;
    }
    notification.error(msg);
  } finally {
    creatingCustomer.value = false;
  }
};

function cancelNewCustomer() {
  showNewCustomerForm.value = false;
  resetNewCustomerForm();
  searchQuery.value = '';
}
function resetNewCustomerForm() {
  Object.assign(newCustomerData.value, { name: '', phone: '', city: '', address: '', notes: '' });
  showNewCustomerForm.value = false;
  newCustomerForm.value?.resetValidation?.();
  searchQuery.value = '';
}

// Watch for changes
watch(
  () => props.modelValue,
  (newVal) => {
    internalValue.value = newVal;
    if (newVal && !selectedCustomer.value) loadCustomerById(newVal);
    else if (!newVal) {
      selectedCustomer.value = null;
      showSelector.value = true;
    }
  }
);

async function loadCustomerById(customerId) {
  try {
    const customer = await customerStore.fetchCustomer(customerId);
    selectedCustomer.value = customer;
    showSelector.value = false;
  } catch {}
}

// Init
onMounted(async () => {
  if (props.modelValue) await loadCustomerById(props.modelValue);
  try {
    const { data } = await customerStore.fetchCustomers({ limit: 50 });
    searchResults.value = data || [];
  } catch {}
});

// Exposed method
defineExpose({
  resetSelection() {
    selectedCustomer.value = null;
    internalValue.value = null;
    showSelector.value = true;
    showNewCustomerForm.value = false;
    emit('update:modelValue', null);
  },
});
</script>

<style scoped>
.customer-selector { width: 100%; }
.customer-info { flex: 1; }
.customer-actions { display: flex; gap: 8px; }
.add-new-customer-item {
  background-color: rgba(var(--v-theme-primary), 0.05);
  border-top: 1px solid rgba(var(--v-theme-primary), 0.2);
  border-bottom: 1px solid rgba(var(--v-theme-primary), 0.2);
}
.default-customer-item { background-color: rgba(0,0,0,0.02); }
@media (max-width: 600px) {
  .quick-options .v-btn-toggle { width: 100%; }
  .quick-options .v-btn { flex: 1; font-size: 0.75rem; }
}
</style>
