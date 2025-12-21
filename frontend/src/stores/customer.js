import { defineStore } from 'pinia';
import api from '@/plugins/axios';
import { useNotificationStore } from '@/stores/notification';

export const useCustomerStore = defineStore('customer', {
  state: () => ({
    customers: [],
    currentCustomer: null,
    loading: false,
    pagination: {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0,
    },
  }),

  actions: {
    async fetchCustomers(params = {}) {
      this.loading = true;
      const notificationStore = useNotificationStore();
      try {
        const response = await api.get('/customers', { params });
        this.customers = response.data;
        this.pagination = response.meta;
        return response;
      } catch (error) {
        notificationStore.error(error.response?.data?.message || 'فشل تحميل العملاء');
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async fetchCustomer(id) {
      this.loading = true;
      const notificationStore = useNotificationStore();
      try {
        const response = await api.get(`/customers/${id}`);
        this.currentCustomer = response.data;
        return response;
      } catch (error) {
        notificationStore.error(error.response?.data?.message || 'فشل تحميل بيانات العميل');
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async createCustomer(customerData) {
      this.loading = true;
      const notificationStore = useNotificationStore();
      try {
        const response = await api.post('/customers', customerData);
        this.customers.unshift(response.data);
        notificationStore.success('تم إضافة العميل بنجاح');
        return response;
      } catch (error) {
        notificationStore.error(error.response?.data?.message || 'فشل إضافة العميل');
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async updateCustomer(id, customerData) {
      this.loading = true;
      const notificationStore = useNotificationStore();
      try {
        const response = await api.put(`/customers/${id}`, customerData);
        const index = this.customers.findIndex((c) => c.id === id);
        if (index !== -1) {
          this.customers[index] = response.data;
        }
        notificationStore.success('تم تحديث العميل بنجاح');
        return response;
      } catch (error) {
        notificationStore.error(error.response?.data?.message || 'فشل تحديث العميل');
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async deleteCustomer(id) {
      this.loading = true;
      const notificationStore = useNotificationStore();
      try {
        const response = await api.delete(`/customers/${id}`);
        this.customers = this.customers.filter((c) => c.id !== id);
        notificationStore.success('تم حذف العميل بنجاح');
        return response;
      } catch (error) {
        notificationStore.error(error.response?.data?.message || 'فشل حذف العميل');
        throw error;
      } finally {
        this.loading = false;
      }
    },

    getCustomerById(id) {
      if (!this.customers.length) {
        return null;
      }

      return this.customers.find((customer) => customer.id === id);
    },
  },
});
