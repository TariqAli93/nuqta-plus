<template>
  <div>
    <!-- Error Alert -->
    <v-alert
      v-if="settingsStore.error"
      type="error"
      variant="tonal"
      closable
      class="mb-4"
      @click:close="settingsStore.clearError"
    >
      {{ settingsStore.error }}
    </v-alert>
    <!-- Header -->

    <v-row>
      <v-col cols="12" md="2">
        <!-- 🔹 شريط الأدوات العلوي -->
        <v-card class="flex flex-col">
          <div class="flex justify-space-between items-center pa-3">
            <div class="text-h6 font-semibold text-primary">الاعدادات</div>
          </div>

          <v-tabs v-model="activeTab" class="pa-3" direction="vertical" spaced="both" hide-slider>
            <v-tab value="company">
              <v-icon start>mdi-domain</v-icon>
              <span> معلومات الشركة</span>
            </v-tab>
            <v-tab value="currency">
              <v-icon start>mdi-currency-usd</v-icon>
              <span>إعدادات العملة</span>
            </v-tab>

            <v-tab value="backup">
              <v-icon start>mdi-backup-restore</v-icon>
              <span>إدارة النسخ الاحتياطي</span>
            </v-tab>
          </v-tabs>
        </v-card>
      </v-col>

      <v-col cols="12" md="10">
        <v-window v-model="activeTab">
          <!-- Company Information Tab -->
          <v-window-item value="company" class="pa-0">
            <CompanyInfoForm />
          </v-window-item>

          <!-- Currency Settings Tab -->
          <v-window-item value="currency" class="pa-0">
            <CurrencySettings />
          </v-window-item>

          <v-window-item value="backup" class="pa-0">
            <BackupManager />
          </v-window-item>
        </v-window>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useSettingsStore } from '../stores/settings';
import CompanyInfoForm from '@/components/settings/CompanyInfoForm.vue';
import CurrencySettings from '@/components/settings/CurrencySettings.vue';
import BackupManager from '@/components/settings/BackupManager.vue';

// Stores
const settingsStore = useSettingsStore();

// State
const activeTab = ref('company');

onMounted(async () => {
  try {
    await settingsStore.initialize();
    await settingsStore.fetchCurrencySettings();
  } catch {
    // Errors are surfaced via notification/error state in the store
  }
});
</script>
