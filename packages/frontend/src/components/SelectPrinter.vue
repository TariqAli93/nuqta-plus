<template>
  <div class="printer-selector">
    <v-dialog v-model="dialog" max-width="500">
      <template #activator="{ props }">
        <v-btn v-bind="props" color="primary">اختر طابعة</v-btn>
      </template>
      <v-card>
        <v-card-title>اختر طابعة للطباعة</v-card-title>
        <v-divider />
        <v-card-text>
          <v-radio-group v-model="selectedPrinter">
            <v-radio
              v-for="printer in availablePrinters"
              :key="printer.name"
              :label="printer.name"
              :value="printer"
            ></v-radio>
          </v-radio-group>
        </v-card-text>
        <v-divider />
        <v-card-actions>
          <v-btn color="primary" variant="elevated" @click="confirmSelection">تأكيد</v-btn>
          <v-spacer></v-spacer>
          <v-btn text @click="dialog = false">إلغاء</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useNotificationStore } from '../stores/notification';
import { useSaleStore } from '../stores/sale';

const { error, success } = useNotificationStore();
const { setPrinter, getPrinter } = useSaleStore();

const availablePrinters = ref([]);
const selectedPrinter = ref(getPrinter() || null);

const dialog = ref(false);

const confirmSelection = () => {
  if (selectedPrinter.value) {
    setPrinter(selectedPrinter.value);
    success(`تم اختيار الطابعة: ${selectedPrinter.value.name}`);
    dialog.value = false;
  } else {
    error('يرجى اختيار طابعة قبل التأكيد');
  }
};

onMounted(async () => {
  try {
    const printers = await window.electronAPI.getPrinters();
    availablePrinters.value = printers;
    success('تم جلب الطابعات بنجاح');
  } catch (error) {
    console.error('خطأ في جلب الطابعات:', error);
    error('خطأ في جلب الطابعات');
  }
});
</script>
