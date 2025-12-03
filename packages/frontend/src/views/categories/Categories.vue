<template>
  <div>
    <v-card class="mb-4">
      <div class="flex justify-space-between items-center pa-3">
        <div class="text-h6 font-semibold text-primary">إدارة التصنيفات</div>
        <v-btn color="primary" variant="flat" prepend-icon="mdi-plus" @click="openDialog()"
          >تصنيف جديد
        </v-btn>
      </div>
    </v-card>

    <v-card>
      <v-card-text>
        <v-data-table
          :headers="headers"
          :items="categoryStore.categories"
          :loading="categoryStore.loading"
        >
          <template v-slot:[`item.actions`]="{ item }">
            <v-btn icon="mdi-pencil" size="small" variant="text" @click="openDialog(item)"></v-btn>
            <v-btn
              icon="mdi-delete"
              size="small"
              variant="text"
              color="error"
              @click="confirmDelete(item)"
            ></v-btn>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <v-dialog v-model="dialog" max-width="500">
      <v-card>
        <v-card-title class="bg-secondary text-white">{{
          isEdit ? 'تعديل تصنيف' : 'تصنيف جديد'
        }}</v-card-title>
        <v-card-text>
          <v-form ref="form">
            <v-text-field
              v-model="formData.name"
              label="اسم التصنيف"
              :rules="[rules.required]"
            ></v-text-field>
            <v-textarea v-model="formData.description" label="الوصف" rows="2"></v-textarea>
          </v-form>
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions>
          <v-btn color="primary" variant="elevated" @click="handleSubmit" :loading="saving"
            >حفظ</v-btn
          >
          <v-spacer />
          <v-btn @click="dialog = false">إلغاء</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title class="bg-secondary text-white">تأكيد الحذف</v-card-title>
        <v-card-text> هل أنت متأكد من حذف التصنيف {{ selectedCategory?.name }}؟ </v-card-text>

        <v-divider></v-divider>

        <v-card-actions>
          <v-btn variant="elevated" color="error" @click="handleDelete">حذف</v-btn>
          <v-spacer />
          <v-btn @click="deleteDialog = false">إلغاء</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useCategoryStore } from '@/stores/category';

const categoryStore = useCategoryStore();

const dialog = ref(false);
const deleteDialog = ref(false);
const form = ref(null);
const saving = ref(false);
const selectedCategory = ref(null);
const formData = ref({
  name: '',
  description: '',
});

const headers = [
  { title: 'الاسم', key: 'name' },
  { title: 'الوصف', key: 'description' },
  { title: 'إجراءات', key: 'actions', sortable: false },
];

const isEdit = computed(() => !!selectedCategory.value);

const rules = {
  required: (v) => !!v || 'هذا الحقل مطلوب',
};

const openDialog = (category = null) => {
  if (category) {
    selectedCategory.value = category;
    formData.value = { ...category };
  } else {
    selectedCategory.value = null;
    formData.value = { name: '', description: '' };
  }
  dialog.value = true;
};

const handleSubmit = async () => {
  const { valid } = await form.value.validate();
  if (!valid) return;

  saving.value = true;
  try {
    if (isEdit.value) {
      await categoryStore.updateCategory(selectedCategory.value.id, formData.value);
    } else {
      await categoryStore.createCategory(formData.value);
    }
    dialog.value = false;
  } catch (error) {
    console.error('Error saving category:', error);
  } finally {
    saving.value = false;
  }
};

const confirmDelete = (category) => {
  selectedCategory.value = category;
  deleteDialog.value = true;
};

const handleDelete = async () => {
  try {
    await categoryStore.deleteCategory(selectedCategory.value.id);
    deleteDialog.value = false;
  } catch (error) {
    console.error('Error deleting category:', error);
  }
};

onMounted(() => {
  categoryStore.fetchCategories();
});
</script>
