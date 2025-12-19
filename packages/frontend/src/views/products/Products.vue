<template>
  <div>
    <v-card class="mb-4">
      <div class="flex items-center justify-space-between pa-3">
        <div class="font-semibold text-h6 text-primary">إدارة المنتجات</div>
        <v-btn
          v-can.hide="['create:products']"
          color="primary"
          prepend-icon="mdi-plus"
          to="/products/new"
        >
          منتج جديد
        </v-btn>
      </div>
    </v-card>

    <v-card>
      <v-card-text>
        <v-row>
          <v-col cols="12" md="8">
            <v-text-field
              v-model="search"
              prepend-inner-icon="mdi-magnify"
              label="البحث عن منتج"
              single-line
              hide-details
              density="comfortable"
              @input="handleSearch"
            ></v-text-field>
          </v-col>
          <v-col cols="12" md="4">
            <v-select
              v-model="selectedCategory"
              :items="categories"
              item-title="name"
              item-value="id"
              label="التصنيف"
              clearable
              density="comfortable"
              hide-details
              @update:model-value="handleSearch"
            ></v-select>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-card class="mt-4">
      <v-data-table
        :headers="headers"
        :items="productStore.products"
        :loading="productStore.loading"
        :items-per-page="productStore.pagination.limit"
        :page="productStore.pagination.page"
        :items-length="productStore.pagination.total"
        @update:page="changePage"
        @update:items-per-page="changeItemsPerPage"
        server-items-length
      >
        <template v-slot:[`item.stock`]="{ item }">
          <v-chip :color="item.stock <= item.minStock ? 'error' : 'success'" size="small">
            {{ item.stock }}
          </v-chip>
        </template>
        <template v-slot:[`item.sellingPrice`]="{ item }">
          {{ formatNumber(item.sellingPrice) }} {{ item.currency }}
        </template>
        <template v-slot:[`item.status`]="{ item }">
          <v-chip :color="getStatusColor(item.status)" size="small">
            {{ getStatusText(item.status) }}
          </v-chip>
        </template>
        <template v-slot:[`item.actions`]="{ item }">
          <v-btn
            icon="mdi-pencil"
            size="small"
            variant="text"
            :to="`/products/${item.id}/edit`"
          ></v-btn>
          <v-btn
            icon="mdi-delete"
            size="small"
            variant="text"
            color="error"
            v-can="['delete:products']"
            @click="confirmDelete(item)"
          ></v-btn>
        </template>
      </v-data-table>
    </v-card>

    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title class="text-white bg-secondary">تأكيد الحذف</v-card-title>
        <v-card-text> هل أنت متأكد من حذف المنتج {{ selectedProduct?.name }}؟ </v-card-text>

        <v-divider></v-divider>

        <v-card-actions>
          <v-btn color="error" variant="elevated" @click="handleDelete">حذف</v-btn>
          <v-spacer />
          <v-btn @click="deleteDialog = false">إلغاء</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useProductStore } from '@/stores/product';
import { useCategoryStore } from '@/stores/category';

const productStore = useProductStore();
const categoryStore = useCategoryStore();

const search = ref('');
const selectedCategory = ref(null);
const categories = ref([]);
const deleteDialog = ref(false);
const selectedProduct = ref(null);

const headers = [
  { title: 'الاسم', key: 'name' },
  { title: 'رمز المنتج', key: 'sku' },
  { title: 'التصنيف', key: 'category' },
  { title: 'سعر البيع', key: 'sellingPrice' },
  { title: 'المخزون', key: 'stock' },
  { title: 'الحد الأدنى للمخزون', key: 'minStock' },
  { title: 'باركود', key: 'barcode' },
  { title: 'الحالة', key: 'status' },
  { title: 'إجراءات', key: 'actions', sortable: false },
];

const getStatusColor = (status) => {
  const colors = {
    available: 'success',
    out_of_stock: 'warning',
    discontinued: 'error',
  };
  return colors[status] || 'grey';
};

const getStatusText = (status) => {
  const texts = {
    available: 'متاح',
    out_of_stock: 'نفذ',
    discontinued: 'متوقف',
  };

  return texts[status] || status;
};

// دالة تنسيق الأرقام مع الفواصل
const formatNumber = (value) => {
  if (!value && value !== 0) return '0';
  // إزالة أي فواصل موجودة
  const numStr = String(value).replace(/,/g, '');
  // التحقق من أن القيمة رقم (يدعم الأرقام العشرية)
  if (!/^\d*\.?\d*$/.test(numStr)) return value;
  // تقسيم الرقم إلى جزء صحيح وجزء عشري
  const parts = numStr.split('.');
  // تنسيق الجزء الصحيح مع الفواصل (بعد كل 3 أرقام)
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  // إرجاع الرقم المنسق
  return parts.join('.');
};

const handleSearch = () => {
  productStore.pagination.page = 1;
  productStore.fetchProducts({
    search: search.value,
    categoryId: selectedCategory.value,
    page: 1,
    limit: productStore.pagination.limit,
  });
};

const changePage = (page) => {
  productStore.pagination.page = page;
  productStore.fetchProducts({
    search: search.value,
    categoryId: selectedCategory.value,
    page,
    limit: productStore.pagination.limit,
  });
};

const changeItemsPerPage = (limit) => {
  productStore.pagination.limit = limit;
  productStore.pagination.page = 1;
  productStore.fetchProducts({
    search: search.value,
    categoryId: selectedCategory.value,
    page: 1,
    limit,
  });
};

const confirmDelete = (product) => {
  selectedProduct.value = product;
  deleteDialog.value = true;
};

const handleDelete = async () => {
  try {
    await productStore.deleteProduct(selectedProduct.value.id);
    deleteDialog.value = false;
  } catch (error) {
    // Error handled by notification
  }
};

onMounted(async () => {
  await productStore.fetchProducts({
    page: 1,
    limit: productStore.pagination.limit,
  });

  // Fetch all categories for the dropdown
  const { data } = await categoryStore.fetchCategories();
  categories.value = data || [];
});
</script>
