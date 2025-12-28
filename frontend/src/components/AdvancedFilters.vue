<template>
  <v-expansion-panels v-model="panel" variant="accordion" class="mb-4">
    <v-expansion-panel>
      <v-expansion-panel-title>
        <div class="d-flex align-center gap-2">
          <v-icon>mdi-filter</v-icon>
          <span>فلترة متقدمة</span>
          <v-chip v-if="activeFiltersCount > 0" size="small" color="primary" class="mr-2">
            {{ activeFiltersCount }}
          </v-chip>
        </div>
      </v-expansion-panel-title>
      <v-expansion-panel-text>
        <v-row>
          <v-col v-for="(filter, index) in filters" :key="index" :cols="12" :md="filter.cols || 6">
            <component
              :is="filter.component"
              v-model="filterValues[filter.key]"
              v-bind="filter.props"
              :label="filter.label"
              :items="filter.items"
              :clearable="filter.clearable !== false"
              @update:model-value="handleFilterChange(filter.key)"
            />
          </v-col>
        </v-row>

        <div class="d-flex justify-end gap-2 mt-4">
          <v-btn
            variant="outlined"
            size="default"
            :disabled="activeFiltersCount === 0"
            @click="resetFilters"
          >
            إعادة تعيين
          </v-btn>
          <v-btn
            v-if="canSaveFilters"
            variant="text"
            size="default"
            prepend-icon="mdi-content-save"
            @click="saveFilters"
          >
            حفظ الفلاتر
          </v-btn>
        </div>
      </v-expansion-panel-text>
    </v-expansion-panel>
  </v-expansion-panels>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  filters: {
    type: Array,
    required: true,
    // Array of { key, label, component, props, items, cols, clearable }
  },
  modelValue: {
    type: Object,
    default: () => ({}),
  },
  canSaveFilters: {
    type: Boolean,
    default: false,
  },
  storageKey: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['update:modelValue', 'filter-change', 'filter-saved']);

const panel = ref([]);
const filterValues = ref({ ...props.modelValue });

// Load saved filters
if (props.storageKey && props.canSaveFilters) {
  try {
    const saved = localStorage.getItem(`filters-${props.storageKey}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      filterValues.value = { ...filterValues.value, ...parsed };
    }
  } catch (error) {
    console.error('Error loading saved filters:', error);
  }
}

const activeFiltersCount = computed(() => {
  return Object.values(filterValues.value).filter((v) => v !== null && v !== '' && v !== undefined)
    .length;
});

const handleFilterChange = (key) => {
  emit('update:modelValue', { ...filterValues.value });
  emit('filter-change', { key, value: filterValues.value[key] });
};

const resetFilters = () => {
  filterValues.value = {};
  emit('update:modelValue', {});
  emit('filter-change', {});

  if (props.storageKey) {
    localStorage.removeItem(`filters-${props.storageKey}`);
  }
};

const saveFilters = () => {
  if (!props.storageKey) return;

  try {
    localStorage.setItem(`filters-${props.storageKey}`, JSON.stringify(filterValues.value));
    // Show success notification
    emit('filter-saved');
  } catch (error) {
    console.error('Error saving filters:', error);
  }
};

// Watch for external changes
watch(
  () => props.modelValue,
  (newValue) => {
    filterValues.value = { ...newValue };
  },
  { deep: true }
);
</script>

<style scoped lang="scss">
.v-expansion-panel-title {
  font-weight: 500;
}
</style>
