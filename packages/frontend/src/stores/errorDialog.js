import { defineStore } from 'pinia';

export const useErrorDialogStore = defineStore('errorDialog', {
  state: () => ({
    open: false,
    title: '',
    message: '',
    details: [], // array of strings
  }),
  actions: {
    show({ title = 'حدث خطأ', message = '', details = [] } = {}) {
      this.title = title;
      this.message = message;
      this.details = Array.isArray(details) ? details : [];
      this.open = true;
    },
    hide() {
      this.open = false;
      this.details = [];
      this.title = '';
      this.message = '';
    },
  },
});
