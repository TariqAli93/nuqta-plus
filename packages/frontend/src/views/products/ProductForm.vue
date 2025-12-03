<template>
  <div>
    <v-card class="mb-4">
      <div class="flex justify-space-between items-center pa-3">
        <div class="text-h6 font-semibold text-primary">
          {{ isEdit ? 'تعديل منتج' : 'منتج جديد' }}
        </div>
        <v-btn color="primary" @click="router.back()">
          <v-icon>mdi-arrow-left</v-icon>
        </v-btn>
      </div>
    </v-card>

    <v-card>
      <v-card-text>
        <v-form ref="form" @submit.prevent="handleSubmit">
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="formData.name"
                label="اسم المنتج"
                :rules="[rules.required]"
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="formData.sku"
                label="رمز المنتج"
                :append-inner-icon="'mdi-refresh'"
                @click:append-inner="regenerateSKU"
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
              <v-select
                v-model="formData.categoryId"
                :items="categories"
                item-title="name"
                item-value="id"
                label="التصنيف"
              ></v-select>
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="formData.barcode"
                label="قراءة الباركود"
                prepend-inner-icon="mdi-barcode-scan"
                autofocus
                clearable
                class="mb-4"
                @keyup.enter="handleBarcodeScan"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-if="!isEdit || isAdmin || costPriceUnlocked"
                v-model.number="formData.costPrice"
                label="سعر التكلفة"
                type="number"
                :rules="[rules.required]"
              ></v-text-field>
              <v-text-field
                v-else
                :model-value="'*******'"
                label="سعر التكلفة"
                readonly
                append-inner-icon="mdi-lock"
                @click:append-inner="showAdminVerifyDialog = true"
                hint="يتطلب صلاحيات الأدمن للعرض"
                persistent-hint
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model.number="formData.sellingPrice"
                label="سعر البيع"
                type="number"
                :rules="[rules.required]"
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="3">
              <v-select
                v-model="formData.currency"
                :items="['USD', 'IQD']"
                label="العملة"
                :rules="[rules.required]"
              ></v-select>
            </v-col>
            <v-col cols="12" md="3">
              <v-text-field
                v-model.number="formData.stock"
                label="المخزون"
                type="number"
                :rules="[rules.required]"
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="3">
              <v-text-field
                v-model.number="formData.minStock"
                label="الحد الأدنى للمخزون"
                type="number"
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="3">
              <v-select
                v-model="formData.status"
                :items="statusOptions"
                label="الحالة"
                :rules="[rules.required]"
              ></v-select>
            </v-col>
            <v-col cols="12">
              <v-textarea v-model="formData.description" label="الوصف" rows="3"></v-textarea>
            </v-col>
          </v-row>

          <v-divider class="my-4"></v-divider>

          <div class="d-flex gap-2">
            <v-btn type="submit" color="primary" :loading="loading">حفظ</v-btn>
            <v-btn @click="$router.back()">إلغاء</v-btn>
          </div>
        </v-form>
      </v-card-text>
    </v-card>

    <!-- Admin Verification Dialog -->
    <v-dialog v-model="showAdminVerifyDialog" max-width="500" persistent>
      <v-card>
        <v-card-title class="bg-primary text-white">
          <v-icon start>mdi-shield-lock</v-icon>
          تحقق من صلاحيات الأدمن
        </v-card-title>

        <v-card-text class="pt-4">
          <v-alert type="info" variant="tonal" class="mb-4">
            لعرض سعر التكلفة، يجب إدخال بيانات مستخدم أدمن
          </v-alert>

          <v-form ref="adminForm" @submit.prevent="verifyAdmin">
            <v-text-field
              v-model="adminCredentials.username"
              label="اسم المستخدم"
              prepend-inner-icon="mdi-account"
              :rules="[rules.required]"
              :error="adminVerifyError"
            ></v-text-field>

            <v-text-field
              v-model="adminCredentials.password"
              label="كلمة المرور"
              type="password"
              prepend-inner-icon="mdi-lock"
              :rules="[rules.required]"
              :error="adminVerifyError"
              :error-messages="adminVerifyError ? adminVerifyErrorMessage : ''"
            ></v-text-field>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeAdminDialog" :disabled="adminVerifyLoading">
            إلغاء
          </v-btn>
          <v-btn
            color="primary"
            @click="verifyAdmin"
            :loading="adminVerifyLoading"
            prepend-icon="mdi-check"
          >
            تحقق
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useProductStore } from '@/stores/product';
import { useCategoryStore } from '@/stores/category';
import { useAuthStore } from '@/stores/auth';
import { useNotificationStore } from '@/stores/notification';
import api from '@/plugins/axios';

const router = useRouter();
const route = useRoute();
const productStore = useProductStore();
const categoryStore = useCategoryStore();
const authStore = useAuthStore();
const notification = useNotificationStore();

const form = ref(null);
const adminForm = ref(null);
const loading = ref(false);
const categories = ref([]);
const formData = ref({
  name: '',
  sku: '',
  barcode: '',
  categoryId: null,
  description: '',
  costPrice: 0,
  sellingPrice: 0,
  currency: 'USD',
  stock: 0,
  minStock: 0,
  status: 'available',
});

// Admin verification state
const showAdminVerifyDialog = ref(false);
const adminCredentials = ref({
  username: '',
  password: '',
});
const adminVerifyLoading = ref(false);
const adminVerifyError = ref(false);
const adminVerifyErrorMessage = ref('');
const costPriceUnlocked = ref(false);

const statusOptions = [
  { title: 'متاح', value: 'available' },
  { title: 'نفذ', value: 'out_of_stock' },
  { title: 'متوقف', value: 'discontinued' },
];

const isEdit = computed(() => !!route.params.id);
const isAdmin = computed(() => authStore.user?.role?.name === 'admin');

const rules = {
  required: (v) => !!v || 'هذا الحقل مطلوب',
};

// دالة لتحويل النص العربي إلى SKU
const generateSKU = (name) => {
  if (!name) return '';

  // خريطة تحويل الأحرف العربية إلى إنجليزية
  const arabicToEnglish = {
    ا: 'a',
    أ: 'a',
    إ: 'a',
    آ: 'a',
    ب: 'b',
    ت: 't',
    ث: 'th',
    ج: 'j',
    ح: 'h',
    خ: 'kh',
    د: 'd',
    ذ: 'dh',
    ر: 'r',
    ز: 'z',
    س: 's',
    ش: 'sh',
    ص: 's',
    ض: 'd',
    ط: 't',
    ظ: 'z',
    ع: 'a',
    غ: 'gh',
    ف: 'f',
    ق: 'q',
    ك: 'k',
    ل: 'l',
    م: 'm',
    ن: 'n',
    ه: 'h',
    و: 'w',
    ي: 'y',
    ى: 'y',
    ة: 'h',
    ء: 'a',
  };

  let sku = name
    .toLowerCase()
    .trim()
    // تحويل الأحرف العربية
    .split('')
    .map((char) => arabicToEnglish[char] || char)
    .join('')
    // إزالة المسافات والرموز وتحويلها إلى شرطات
    .replace(/[^a-z0-9]/g, '-')
    // إزالة الشرطات المتتالية
    .replace(/-+/g, '-')
    // إزالة الشرطات من البداية والنهاية
    .replace(/^-|-$/g, '');

  return sku.toUpperCase();
};

// دالة تجديد SKU يدوياً
const regenerateSKU = () => {
  if (formData.value.name) {
    formData.value.sku = generateSKU(formData.value.name);
  }
};

const handleSubmit = async () => {
  const { valid } = await form.value.validate();
  if (!valid) return;

  loading.value = true;
  try {
    if (isEdit.value) {
      await productStore.updateProduct(route.params.id, formData.value);
    } else {
      await productStore.createProduct(formData.value);
    }
    router.push({ name: 'Products' });
  } catch (error) {
    console.error('Error saving product:', error);
  } finally {
    loading.value = false;
  }
};

const handleBarcodeScan = () => {
  const code = formData.value?.barcode?.trim();
  if (!code) return;
};

// Admin verification
const verifyAdmin = async () => {
  const { valid } = await adminForm.value.validate();
  if (!valid) return;

  adminVerifyLoading.value = true;
  adminVerifyError.value = false;
  adminVerifyErrorMessage.value = '';

  try {
    const response = await api.post('/auth/login', {
      username: adminCredentials.value.username,
      password: adminCredentials.value.password,
    });

    // Check if user is admin
    if (response.data?.user?.role?.name === 'admin') {
      costPriceUnlocked.value = true;
      notification.success('تم التحقق بنجاح');
      closeAdminDialog();
    } else {
      adminVerifyError.value = true;
      adminVerifyErrorMessage.value = 'المستخدم ليس لديه صلاحيات أدمن';
    }
  } catch (error) {
    adminVerifyError.value = true;
    adminVerifyErrorMessage.value =
      error.response?.data?.message || 'بيانات تسجيل الدخول غير صحيحة';
  } finally {
    adminVerifyLoading.value = false;
  }
};

const closeAdminDialog = () => {
  showAdminVerifyDialog.value = false;
  adminCredentials.value = {
    username: '',
    password: '',
  };
  adminVerifyError.value = false;
  adminVerifyErrorMessage.value = '';
  adminForm.value?.resetValidation();
};

// مراقبة تغيير اسم المنتج وتوليد SKU تلقائياً
watch(
  () => formData.value.name,
  (newName) => {
    if (newName && !isEdit.value) {
      // فقط للمنتجات الجديدة
      formData.value.sku = generateSKU(newName);
    }
  }
);

onMounted(async () => {
  const response = await categoryStore.fetchCategories();
  categories.value = response.data;

  if (isEdit.value) {
    loading.value = true;
    try {
      await productStore.fetchProduct(route.params.id);
      formData.value = { ...productStore.currentProduct };
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      loading.value = false;
    }
  }
});
</script>
