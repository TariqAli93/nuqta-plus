<template>
  <v-app>
    <!-- شريط التقدم أعلى الصفحة -->
    <UpdateNotification />
    <LoadingProgressBar />

    <main id="main-content" role="main" aria-label="المحتوى الرئيسي">
      <router-view />
    </main>
    <AppSnackbar />
    <AppErrorDialog />

    <!-- مكون التحميل المركزي -->
    <LoadingSpinner />

    <!-- مكون الإعداد الأولي -->
    <CreateFirstUser />
  </v-app>
</template>
<script setup>
import { onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import AppSnackbar from '@/components/AppSnackbar.vue';
import AppErrorDialog from '@/components/AppErrorDialog.vue';
import LoadingSpinner from '@/components/LoadingSpinner.vue';
import LoadingProgressBar from '@/components/LoadingProgressBar.vue';
import UpdateNotification from '@/components/UpdateNotification.vue';
import CreateFirstUser from '@/components/CreateFirstUser.vue';
import { setupSkipLink } from '@/utils/accessibility';

const authStore = useAuthStore();

onMounted(async () => {
  // Setup accessibility features
  setupSkipLink();
  
  // Check if user is logged in
  await authStore.checkAuth();
});
</script>

<style>
@import './styles/tailwind.css';
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.bg-glass {
  backdrop-filter: blur(8px);
  background-color: rgba(255, 255, 255, 0.2);
}
</style>
