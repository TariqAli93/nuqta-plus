<template>
  <v-app>
    <v-navigation-drawer app v-model="drawer" permanent width="250" rail rail-width="120">
      <!-- add logo here -->
      <router-link
        to="/"
        class="flex justify-center align-center pa-1 fixed top-0 left-0 right-0 border-b z-50"
        style="background-color: rgba(var(--v-theme-background), 1)"
      >
        <img
          src="@/assets/logo.png"
          :src-dark="'@/assets/logo.png'"
          alt="Nuqta Plus Logo"
          id="navigationDrawerLogo"
        />
      </router-link>

      <v-list :lines="false" density="comfortable" nav style="margin-top: 65px">
        <!-- العناصر الرئيسية -->
        <template v-for="item in filteredMenu" :key="item.title">
          <!-- إذا ماكو مجموعة -->
          <v-list-item
            v-if="!item.group"
            :to="item.to"
            :exact="item.to === '/'"
            :disabled="item.disabled"
            rounded="xl"
            active-class="active-nav-item"
            variant="plain"
            :ripple="false"
          >
            <div class="flex items-center justify-center flex-col mb-2">
              <div class="v-list-item-icon">
                <v-icon>{{ item.icon }}</v-icon>
              </div>
              <div class="v-list-item-title">{{ item.title }}</div>
            </div>
          </v-list-item>

          <!-- إذا بي مجموعة -->
          <v-list-group
            v-else
            :value="navigationDrawerSubItemsOpen"
            :ripple="false"
            fluid
            v-model:open="navigationDrawerSubItemsOpen"
            class="custom-group"
          >
            <!-- عنوان المجموعة -->
            <template #activator="{ props }">
              <v-list-item v-bind="props" variant="plain">
                <div class="flex items-center justify-center flex-col mb-2">
                  <div class="v-list-item-icon">
                    <v-icon>{{ item.icon }}</v-icon>
                  </div>
                  <div class="v-list-item-title">{{ item.title }}</div>
                </div>
              </v-list-item>
            </template>

            <!-- العناصر الداخلية -->
            <v-list-item
              v-for="sub in item.group.items"
              :key="sub.title"
              :to="sub.to"
              active-class="active-nav-item"
              variant="plain"
              :value="sub.to"
            >
              <div class="flex items-center justify-center flex-col gap-2 mb-2 in-group-title">
                <div class="v-list-item-icon">
                  <v-icon size="20">{{ sub.icon }}</v-icon>
                </div>
                <div class="v-list-item-title">{{ sub.title }}</div>
              </div>
            </v-list-item>
          </v-list-group>
        </template>
      </v-list>
    </v-navigation-drawer>

    <v-app-bar app elevation="0" dark class="border-b" color="background">
      <v-container class="px-10 flex align-center">
        <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>
        <v-toolbar-title>{{ currentPageTitle }}</v-toolbar-title>

        <v-spacer></v-spacer>

        <!-- Alerts Badge -->
        <v-badge
          :content="alertStore.unreadCount"
          :model-value="alertStore.unreadCount > 0"
          color="error"
          overlap
        >
          <v-btn icon :to="{ name: 'Notifications' }">
            <v-icon>mdi-bell</v-icon>
          </v-btn>
        </v-badge>

        <v-btn icon @click="toggleTheme">
          <v-icon>{{ isDark ? 'mdi-white-balance-sunny' : 'mdi-weather-night' }}</v-icon>
        </v-btn>

        <v-menu>
          <template #activator="{ props }">
            <v-btn icon v-bind="props">
              <v-icon>mdi-account-circle</v-icon>
            </v-btn>
          </template>
          <v-list>
            <v-list-item>
              <v-list-item-title>{{ authStore.user?.username }}</v-list-item-title>
              <v-list-item-subtitle>{{ authStore.user?.role?.name }}</v-list-item-subtitle>
            </v-list-item>
            <v-divider></v-divider>
            <v-list-item prepend-icon="mdi-account-circle" to="/profile">
              <v-list-item-title>الملف الشخصي</v-list-item-title>
            </v-list-item>
            <v-list-item prepend-icon="mdi-logout" @click="handleLogout">
              <v-list-item-title>تسجيل خروج</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </v-container>
    </v-app-bar>

    <v-main>
      <v-container class="px-10">
        <router-view />
      </v-container>
    </v-main>

    <!-- Footer -->
    <v-footer color="background" app>
      <v-container class="px-10">
        <v-row align="center" no-gutters>
          <v-col cols="12" md="12" class="flex justify-between items-center">
            <div class="text-body-2"><strong>نقطة بلس</strong> - نظام إدارة المبيعات</div>

            <div class="text-body-2">كودل للحلول التقنية</div>
          </v-col>
        </v-row>
      </v-container>
    </v-footer>
  </v-app>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useTheme } from 'vuetify';
import { useAuthStore } from '@/stores/auth';
import { useAlertStore } from '@/stores/alert';

const router = useRouter();
const route = useRoute();
const theme = useTheme();
const authStore = useAuthStore();
const alertStore = useAlertStore();

const drawer = ref(true);
const isDark = computed(() => theme.global.current.value.dark);

const navigationDrawerSubItemsOpen = ref(['/users']);

// حفظ واستعادة تفضيل الثيم من localStorage
const savedTheme = localStorage.getItem('theme') || 'light';
theme.change(savedTheme);

// تطبيق color-scheme على HTML
const applyColorScheme = (themeName) => {
  document.documentElement.style.colorScheme = themeName === 'dark' ? 'dark' : 'light';
};

// تطبيق الثيم المحفوظ عند التحميل
applyColorScheme(savedTheme);

const menuItems = [
  { title: 'الرئيسية', icon: 'mdi-view-dashboard', to: '/', permission: null },

  { title: 'المبيعات', icon: 'mdi-cash-register', to: '/sales', permission: 'view:sales' },
  { title: 'العملاء', icon: 'mdi-account-group', to: '/customers', permission: 'view:customers' },
  { title: 'المنتجات', icon: 'mdi-package-variant', to: '/products', permission: 'view:products' },
  { title: 'التصنيفات', icon: 'mdi-shape', to: '/categories', permission: 'view:categories' },
  { title: 'التقارير', icon: 'mdi-chart-box', to: '/reports', permission: 'view:reports' },
  { title: 'التنبيهات', icon: 'mdi-bell', to: '/notifications', permission: 'view:sales' },

  {
    title: 'الادارة',
    icon: 'mdi-tools',
    to: '/admin',
    permission: null,
    group: {
      items: [
        { title: 'المستخدمون', icon: 'mdi-account', to: '/users', permission: 'view:users' },
        { title: 'الأدوار', icon: 'mdi-shield-account', to: '/roles', permission: 'view:roles' },
        {
          title: 'الصلاحيات',
          icon: 'mdi-shield-key',
          to: '/permissions',
          permission: 'view:permissions',
        },
        { title: 'الاعدادات', icon: 'mdi-cog', to: '/settings', permission: 'view:settings' },
      ],
    },
  },

  { title: 'حول البرنامج', icon: 'mdi-information', to: '/about', permission: null },
];

// 🔹 فلترة القائمة حسب صلاحيات المستخدم
const filteredMenu = computed(() => {
  return menuItems
    .map((item) => {
      // 1) إذا ماكو مجموعة — فلترة عادية
      if (!item.group) {
        if (!item.permission) return item;
        return authStore.hasPermission(item.permission) ? item : null;
      }

      // 2) معالجة المجموعات (sub items)
      const allowedSubs = item.group.items.filter((sub) => {
        if (!sub.permission) return true;
        return authStore.hasPermission(sub.permission);
      });

      // إذا ماكو عناصر مسموحة → نشيل المجموعة كاملة
      if (allowedSubs.length === 0) return null;

      // نرجع المجموعة مع عناصرها المفلترة
      return {
        ...item,
        group: { items: allowedSubs },
      };
    })
    .filter(Boolean); // إزالة null
});

const currentPageTitle = computed(() => {
  const item = menuItems.find((item) => item.to === route.path);
  // sub items
  if (!item) {
    for (const menuItem of menuItems) {
      if (menuItem.group) {
        const subItem = menuItem.group.items.find((sub) => sub.to === route.path);
        if (subItem) return subItem.title;
      }
    }
  }
  return item?.title || 'نقطة بلس';
});

const toggleTheme = () => {
  const newTheme = isDark.value ? 'light' : 'dark';
  theme.change(newTheme);
  localStorage.setItem('theme', newTheme);
  applyColorScheme(newTheme);
};

const handleLogout = () => {
  alertStore.stopPolling();
  authStore.logout();
  router.push({ name: 'Login' });
};

// Start polling for alerts when component mounts
onMounted(() => {
  if (authStore.isAuthenticated) {
    alertStore.startPolling();
  }
});

// Stop polling when component unmounts
onUnmounted(() => {
  alertStore.stopPolling();
});
</script>

<style scoped lang="scss">
#navigationDrawerLogo {
  max-width: 100px;
  height: 56px;
  object-fit: contain;
}
</style>
