import { defineStore } from 'pinia';
import api from '@/plugins/axios';
import { useNotificationStore } from '@/stores/notification';

export const useProductStore = defineStore('product', {
  state: () => ({
    products: [],
    currentProduct: null,
    loading: false,
    pagination: {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0,
    },
  }),

  actions: {
    async fetchProducts(params = {}) {
      this.loading = true;
      const notificationStore = useNotificationStore();
      try {
        const response = await api.get('/products', { params });
        this.products = response.data;
        this.pagination = response.meta;

        return response;
      } catch (error) {
        notificationStore.error(error.response?.data?.message || 'فشل تحميل المنتجات');
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async fetchProduct(id) {
      this.loading = true;
      const notificationStore = useNotificationStore();
      try {
        const response = await api.get(`/products/${id}`);

        this.currentProduct = response.data;
        return response;
      } catch (error) {
        notificationStore.error(error.response?.data?.message || 'فشل تحميل بيانات المنتج');
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async createProduct(productData) {
      this.loading = true;
      const notificationStore = useNotificationStore();
      try {
        const response = await api.post('/products', productData);
        this.products.unshift(response.data);
        notificationStore.success('تم إضافة المنتج بنجاح');
        return response;
      } catch (error) {
        notificationStore.error(error.response?.data?.message || 'فشل إضافة المنتج');
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async updateProduct(id, productData) {
      this.loading = true;
      const notificationStore = useNotificationStore();
      try {
        const response = await api.put(`/products/${id}`, productData);
        const index = this.products.findIndex((p) => p.id === id);
        if (index !== -1) {
          this.products[index] = response.data;
        }
        notificationStore.success('تم تحديث المنتج بنجاح');
        return response;
      } catch (error) {
        notificationStore.error(error.response?.data?.message || 'فشل تحديث المنتج');
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async deleteProduct(id) {
      this.loading = true;
      const notificationStore = useNotificationStore();
      try {
        const response = await api.delete(`/products/${id}`);
        this.products = this.products.filter((p) => p.id !== id);
        notificationStore.success('تم حذف المنتج بنجاح');
        return response;
      } catch (error) {
        notificationStore.error(error.response?.data?.message || 'فشل حذف المنتج');
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async fetchLowStock() {
      this.loading = true;
      const notificationStore = useNotificationStore();
      try {
        const response = await api.get('/products/low-stock');

        return response.data;
      } catch (error) {
        notificationStore.error(
          error.response?.data?.message || 'فشل تحميل المنتجات منخفضة المخزون'
        );
        throw error;
      } finally {
        this.loading = false;
      }
    },
  },
});
