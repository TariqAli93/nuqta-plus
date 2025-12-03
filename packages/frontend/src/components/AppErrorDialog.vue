<template>
  <v-dialog v-model="store.open" max-width="640">
    <v-card>
      <v-card-title class="text-h6">
        <v-icon color="error" class="mr-2">mdi-alert-circle</v-icon>
        {{ store.title || 'حدث خطأ' }}
      </v-card-title>
      <v-card-text>
        <div v-if="store.message" class="mb-3">
          {{ store.message }}
        </div>
        <div v-if="store.details?.length">
          <v-list density="compact">
            <v-list-item v-for="(d, i) in store.details" :key="i">
              <v-list-item-title>{{ d }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </div>
      </v-card-text>
      <v-card-actions class="justify-end">
        <v-btn color="primary" @click="store.hide()">حسناً</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { useErrorDialogStore } from '@/stores/errorDialog';
const store = useErrorDialogStore();
</script>
