<template>
  <v-snackbar
    v-model="notificationStore.show"
    :timeout="notificationStore.timeout"
    :color="snackbarColor"
    location="top"
    multi-line
    @update:model-value="onClose"
  >
    <div class="d-flex align-center">
      <v-icon :icon="snackbarIcon" class="mr-3" />
      <span>{{ notificationStore.message }}</span>
    </div>

    <template #actions>
      <v-btn variant="text" icon="mdi-close" @click="notificationStore.hide()" />
    </template>
  </v-snackbar>
</template>

<script setup>
import { computed } from 'vue';
import { useNotificationStore } from '@/stores/notification';

const notificationStore = useNotificationStore();

const snackbarColor = computed(() => {
  const colors = {
    success: 'success',
    error: 'error',
    warning: 'warning',
    info: 'info',
  };
  return colors[notificationStore.type] || 'info';
});

const snackbarIcon = computed(() => {
  const icons = {
    success: 'mdi-check-circle',
    error: 'mdi-alert-circle',
    warning: 'mdi-alert',
    info: 'mdi-information',
  };
  return icons[notificationStore.type] || 'mdi-information';
});

const onClose = (value) => {
  if (!value) {
    notificationStore.hide();
  }
};
</script>
