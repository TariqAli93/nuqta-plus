import { defineStore } from 'pinia';
import api from '@/plugins/axios';
import { useNotificationStore } from '@/stores/notification';

export const useCategoryStore = defineStore('category', {
  state: () => ({
    categories: [],
    currentCategory: null,
    loading: false,
  }),

  actions: {
    async fetchCategories(params = {}) {
      this.loading = true;
      const notificationStore = useNotificationStore();
      try {
        const response = await api.get('/categories', { params });
        this.categories = response.data;
        return response;
      } catch (error) {
        notificationStore.error(error.response?.data?.message || 'فشل تحميل الفئات');
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async fetchCategory(id) {
      this.loading = true;
      const notificationStore = useNotificationStore();
      try {
        const response = await api.get(`/categories/${id}`);
        this.currentCategory = response.data;
        return response;
      } catch (error) {
        notificationStore.error(error.response?.data?.message || 'فشل تحميل بيانات الفئة');
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async createCategory(categoryData) {
      this.loading = true;
      const notificationStore = useNotificationStore();
      try {
        const response = await api.post('/categories', categoryData);
        this.categories.unshift(response.data);
        notificationStore.success('تم إضافة الفئة بنجاح');
        return response;
      } catch (error) {
        notificationStore.error(error.response?.data?.message || 'فشل إضافة الفئة');
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async updateCategory(id, categoryData) {
      this.loading = true;
      const notificationStore = useNotificationStore();
      try {
        const response = await api.put(`/categories/${id}`, categoryData);
        const index = this.categories.findIndex((c) => c.id === id);
        if (index !== -1) {
          this.categories[index] = response.data;
        }
        notificationStore.success('تم تحديث الفئة بنجاح');
        return response;
      } catch (error) {
        notificationStore.error(error.response?.data?.message || 'فشل تحديث الفئة');
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async deleteCategory(id) {
      this.loading = true;
      const notificationStore = useNotificationStore();
      try {
        const response = await api.delete(`/categories/${id}`);
        this.categories = this.categories.filter((c) => c.id !== id);
        notificationStore.success('تم حذف الفئة بنجاح');
        return response;
      } catch (error) {
        notificationStore.error(error.response?.data?.message || 'فشل حذف الفئة');
        throw error;
      } finally {
        this.loading = false;
      }
    },
  },
});
