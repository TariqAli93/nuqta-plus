<template>
  <nav aria-label="مسار التنقل" class="breadcrumbs">
    <ol class="breadcrumbs-list">
      <li v-for="(crumb, index) in crumbs" :key="index" class="breadcrumb-item">
        <router-link
          v-if="index < crumbs.length - 1"
          :to="crumb.to"
          class="breadcrumb-link"
          :aria-current="index === crumbs.length - 1 ? 'page' : undefined"
        >
          <v-icon v-if="crumb.icon" size="16" class="breadcrumb-icon">{{ crumb.icon }}</v-icon>
          {{ crumb.title }}
        </router-link>
        <span v-else class="breadcrumb-current" aria-current="page">
          <v-icon v-if="crumb.icon" size="16" class="breadcrumb-icon">{{ crumb.icon }}</v-icon>
          {{ crumb.title }}
        </span>
        <v-icon
          v-if="index < crumbs.length - 1"
          size="16"
          class="breadcrumb-separator"
          aria-hidden="true"
        >
          mdi-chevron-left
        </v-icon>
      </li>
    </ol>
  </nav>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

// Route to breadcrumb mapping
const routeMap = {
  '/': { title: 'الرئيسية', icon: 'mdi-view-dashboard' },
  '/sales': { title: 'المبيعات', icon: 'mdi-cash-register' },
  '/sales/new': { title: 'بيع جديد', icon: 'mdi-plus-circle' },
  '/customers': { title: 'العملاء', icon: 'mdi-account-group' },
  '/customers/new': { title: 'عميل جديد', icon: 'mdi-account-plus' },
  '/products': { title: 'المنتجات', icon: 'mdi-package-variant' },
  '/products/new': { title: 'منتج جديد', icon: 'mdi-package-variant-plus' },
  '/categories': { title: 'التصنيفات', icon: 'mdi-shape' },
  '/reports': { title: 'التقارير', icon: 'mdi-chart-box' },
  '/notifications': { title: 'التنبيهات', icon: 'mdi-bell' },
  '/users': { title: 'المستخدمون', icon: 'mdi-account' },
  '/settings': { title: 'الإعدادات', icon: 'mdi-cog' },
  '/profile': { title: 'الملف الشخصي', icon: 'mdi-account-circle' },
  '/about': { title: 'حول البرنامج', icon: 'mdi-information' },
};

const crumbs = computed(() => {
  const pathSegments = route.path.split('/').filter(Boolean);
  const breadcrumbs = [{ title: 'الرئيسية', to: '/', icon: 'mdi-view-dashboard' }];

  let currentPath = '';
  pathSegments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const routeInfo = routeMap[currentPath];

    if (routeInfo) {
      breadcrumbs.push({
        title: routeInfo.title,
        to: currentPath,
        icon: routeInfo.icon,
      });
    } else if (index === pathSegments.length - 1) {
      // Last segment might be an ID (for edit/view pages)
      const parentPath = '/' + pathSegments.slice(0, -1).join('/');
      const parentInfo = routeMap[parentPath];
      if (parentInfo) {
        // Check if it's an edit route
        if (route.name?.includes('Edit') || route.name?.includes('Details')) {
          breadcrumbs.push({
            title: route.name?.includes('Edit') ? 'تعديل' : 'تفاصيل',
            to: currentPath,
          });
        }
      }
    }
  });

  return breadcrumbs;
});
</script>

<style scoped lang="scss">
.breadcrumbs {
  margin-bottom: 1rem;
}

.breadcrumbs-list {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  list-style: none;
  padding: 0;
  margin: 0;
}

.breadcrumb-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.breadcrumb-link {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: rgb(var(--v-theme-primary));
  text-decoration: none;
  font-size: 0.875rem;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.8;
    text-decoration: underline;
  }

  &:focus-visible {
    outline: 2px solid rgb(var(--v-theme-primary));
    outline-offset: 2px;
    border-radius: 4px;
  }
}

.breadcrumb-current {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: rgb(var(--v-theme-on-surface));
  font-size: 0.875rem;
  font-weight: 500;
}

.breadcrumb-icon {
  margin: 0;
}

.breadcrumb-separator {
  color: rgb(var(--v-theme-on-surface-variant));
  margin: 0;
}
</style>
