<template>
  <v-snackbar
    v-model="notificationStore.show"
    :timeout="notificationStore.action ? 0 : notificationStore.timeout"
    :color="snackbarColor"
    location="top"
    multi-line
    @update:model-value="onClose"
    role="alert"
    :aria-live="notificationStore.type === 'error' ? 'assertive' : 'polite'"
  >
    <div class="d-flex align-center">
      <v-icon :icon="snackbarIcon" class="mr-3" aria-hidden="true" />
      <span>{{ notificationStore.message }}</span>
    </div>

    <template #actions>
      <v-btn
        v-if="notificationStore.action"
        :color="snackbarColor"
        variant="text"
        @click="handleAction"
        :aria-label="notificationStore.action.label || 'تنفيذ الإجراء'"
      >
        {{ notificationStore.action.label || 'تنفيذ' }}
      </v-btn>
      <v-btn
        variant="text"
        icon="mdi-close"
        @click="notificationStore.hide()"
        aria-label="إغلاق"
      />
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

const handleAction = () => {
  if (notificationStore.action?.onClick) {
    notificationStore.action.onClick();
  }
  notificationStore.hide();
};

const onClose = (value) => {
  if (!value) {
    notificationStore.hide();
  }
};
</script>
