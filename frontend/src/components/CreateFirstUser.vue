<template>
  <v-dialog v-model="isFirstRunDialog" max-width="780" persistent>
    <v-card elevation="12" rounded="xl">
      <v-card-title class="py-6 text-center">
        <v-icon color="primary" size="64" class="mb-2">mdi-party-popper</v-icon>
        <h2 class="mb-1 font-semibold text-h5 text-primary">🎉 مرحباً بك في نظام nuqtaplus 🎉</h2>
        <p class="text-gray-600 text-body-2">
          خطوتان سريعتان: إنشاء حساب المدير ثم إعداد معلومات الشركة.
        </p>
      </v-card-title>

      <v-divider />

      <v-card-text>
        <v-stepper v-model="step" flat>
          <v-stepper-header>
            <v-stepper-item :value="1" title="إنشاء حساب المدير" prepend-icon="mdi-account-plus" />
            <v-stepper-item :value="2" title="معلومات الشركة" prepend-icon="mdi-domain" />
          </v-stepper-header>

          <v-stepper-window>
            <v-stepper-window-item :value="1">
              <v-form ref="userFormRef" v-model="userFormValid">
                <v-row class="mt-4">
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="username"
                      label="اسم المستخدم"
                      variant="outlined"
                      density="comfortable"
                      prepend-inner-icon="mdi-account"
                      :rules="[rules.required, rules.maxLength(100)]"
                    />
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="password"
                      label="كلمة المرور"
                      variant="outlined"
                      density="comfortable"
                      prepend-inner-icon="mdi-lock"
                      :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                      :type="showPassword ? 'text' : 'password'"
                      :rules="[rules.required, rules.minLength(8)]"
                      @click:append-inner="showPassword = !showPassword"
                    />
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="fullName"
                      label="الاسم الكامل"
                      variant="outlined"
                      density="comfortable"
                      prepend-inner-icon="mdi-card-account-details"
                      :rules="[rules.required, rules.maxLength(255)]"
                    />
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="phone"
                      label="رقم الهاتف"
                      variant="outlined"
                      density="comfortable"
                      prepend-inner-icon="mdi-phone"
                      :rules="[rules.validPhone]"
                    />
                  </v-col>
                </v-row>
              </v-form>

              <v-alert type="info" variant="tonal" class="mt-3">
                سيتم إنشاء حساب مدير بصلاحيات كاملة. يمكنك تعديل البيانات قبل الإكمال.
              </v-alert>

              <div class="justify-end gap-2 mt-4 d-flex">
                <v-btn color="primary" :loading="loadingUser" @click="handleCreateUser">
                  التالي
                  <v-icon end>mdi-arrow-left</v-icon>
                </v-btn>
              </div>
            </v-stepper-window-item>

            <v-stepper-window-item :value="2">
              <v-form ref="companyFormRef" v-model="companyFormValid">
                <v-row class="mt-4">
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="companyData.name"
                      label="اسم الشركة"
                      variant="outlined"
                      density="comfortable"
                      prepend-inner-icon="mdi-domain"
                      :rules="[rules.required, rules.maxLength(255)]"
                    />
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-select
                      v-model="companyData.invoiceType"
                      :items="invoiceTypes"
                      item-title="text"
                      item-value="value"
                      label="نوع الفاتورة الافتراضي"
                      variant="outlined"
                      density="comfortable"
                      prepend-inner-icon="mdi-receipt"
                    />
                  </v-col>

                  <v-col cols="12" md="4">
                    <v-text-field
                      v-model="companyData.city"
                      label="المدينة"
                      variant="outlined"
                      density="comfortable"
                      prepend-inner-icon="mdi-city"
                      :rules="[rules.required, rules.maxLength(100)]"
                    />
                  </v-col>
                  <v-col cols="12" md="4">
                    <v-text-field
                      v-model="companyData.area"
                      label="المنطقة"
                      variant="outlined"
                      density="comfortable"
                      prepend-inner-icon="mdi-map-outline"
                      :rules="[rules.required, rules.maxLength(100)]"
                    />
                  </v-col>
                  <v-col cols="12" md="4">
                    <v-text-field
                      v-model="companyData.street"
                      label="الشارع"
                      variant="outlined"
                      density="comfortable"
                      prepend-inner-icon="mdi-road"
                      :rules="[rules.required, rules.maxLength(200)]"
                    />
                  </v-col>

                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="companyData.phone"
                      label="رقم الهاتف"
                      variant="outlined"
                      density="comfortable"
                      prepend-inner-icon="mdi-phone"
                      :rules="[rules.validPhone]"
                    />
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="companyData.phone2"
                      label="رقم هاتف إضافي"
                      variant="outlined"
                      density="comfortable"
                      prepend-inner-icon="mdi-phone"
                      :rules="[rules.validPhone]"
                    />
                  </v-col>
                </v-row>
              </v-form>

              <div class="gap-2 mt-4 d-flex justify-space-between">
                <v-btn variant="text" prepend-icon="mdi-arrow-right" @click="step = 1"
                  >السابق</v-btn
                >
                <v-btn color="primary" :loading="loadingCompany" @click="handleSaveCompany">
                  حفظ وإنهاء
                </v-btn>
              </div>
            </v-stepper-window-item>
          </v-stepper-window>
        </v-stepper>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useSettingsStore } from '@/stores/settings';

// Stores
const authStore = useAuthStore();
const settingsStore = useSettingsStore();

// State
const isFirstRunDialog = ref(false);
const step = ref(1);
const loadingUser = ref(false);
const loadingCompany = ref(false);
const tempToken = ref(null);

// Forms
const userFormRef = ref(null);
const companyFormRef = ref(null);
const userFormValid = ref(false);
const companyFormValid = ref(false);

// User fields
const username = ref('admin');
const password = ref('Admin@123');
const showPassword = ref(false);
const fullName = ref('مدير النظام');
const phone = ref('');

// Company fields
const invoiceTypes = [
  { text: 'فاتورة A4', value: 'a4' },
  { text: 'فاتورة A5', value: 'a5' },
  { text: 'رول حراري 58mm', value: 'roll-58' },
  { text: 'رول حراري 80mm', value: 'roll-80' },
  { text: 'رول حراري عريض', value: 'roll-88' },
];

const companyData = ref({
  name: '',
  city: '',
  area: '',
  street: '',
  phone: '',
  phone2: '',
  invoiceType: invoiceTypes[0].value,
});

// Setup info
const setupInfo = ref(null);

// Load initial setup
onMounted(async () => {
  // For testing: uncomment to reset first run
  // localStorage.removeItem('firstRunCompleted');

  const firstRunDone = localStorage.getItem('firstRunCompleted') === 'true';

  if (!firstRunDone) {
    try {
      const response = await authStore.fetchInitialSetupInfo();

      if (response?.isFirstRun) {
        setupInfo.value = response;
        isFirstRunDialog.value = true;
        if (response.username) username.value = response.username;
        if (response.password) password.value = response.password;
      }
    } catch {
      isFirstRunDialog.value = false;
    }
  }
}); // Close dialog
function closeDialog() {
  isFirstRunDialog.value = false;
  authStore.isFirstRun = false;
  localStorage.setItem('firstRunCompleted', 'true');

  // Create lock file via IPC if in Electron
  if (window.electronAPI?.createLockFile) {
    window.electronAPI.createLockFile();
  }
}

// Validation rules
const rules = {
  required: (value) => !!value || 'هذا الحقل مطلوب',
  maxLength: (max) => (value) => !value || value.length <= max || `يجب ألا يتجاوز ${max} حرف`,
  minLength: (min) => (value) => !value || value.length >= min || `يجب ألا يقل عن ${min} أحرف`,
  validPhone: (value) => {
    if (!value) return true;
    return /^\d{10,15}$/.test(value) || 'رقم الهاتف غير صحيح';
  },
};

// Step 1: create user
const handleCreateUser = async () => {
  if (!userFormRef.value) return;
  const { valid } = await userFormRef.value.validate();
  if (!valid) return;
  loadingUser.value = true;
  try {
    const response = await authStore.createFirstUser({
      username: username.value,
      password: password.value,
      fullName: fullName.value,
      phone: phone.value,
    });
    // حفظ التوكن مؤقتاً لاستخدامه في الخطوة التالية
    if (response && response.token) {
      tempToken.value = response.token;
    }
    step.value = 2;
  } catch {
    alert('تعذر إنشاء المستخدم. يرجى المحاولة مرة أخرى.');
  } finally {
    loadingUser.value = false;
  }
};

// Step 2: save company info
const handleSaveCompany = async () => {
  if (!companyFormRef.value) return;
  const { valid } = await companyFormRef.value.validate();
  if (!valid) return;
  loadingCompany.value = true;
  try {
    // تسجيل الدخول أولاً للحصول على توكن صالح
    await authStore.login({
      username: username.value,
      password: password.value,
    });

    // الآن يمكننا حفظ معلومات الشركة باستخدام التوكن الجديد
    await settingsStore.saveCompanyInfo(companyData.value);

    // إغلاق النافذة وتحديث حالة الإعداد الأولي
    closeDialog();
    tempToken.value = null;
  } catch (error) {
    const errorMessage =
      error.response?.data?.errors?.[0]?.message ||
      error.response?.data?.message ||
      'تعذر حفظ معلومات الشركة. يرجى المحاولة مرة أخرى.';
    alert(errorMessage);
    tempToken.value = null;
  } finally {
    loadingCompany.value = false;
  }
};
</script>

<style scoped>
.space-y-4 > * + * {
  margin-top: 1rem;
}
</style>
