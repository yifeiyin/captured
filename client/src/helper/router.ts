import { createRouter, createWebHistory } from 'vue-router';
import { startViewTransition } from 'vue-view-transitions';

import Photo from '@/views/Photo.vue';
import Collections from '@/views/Collections.vue';
import Tags from '@/views/Tags.vue';
import PhotosList from '@/views/PhotosList.vue';
import { useTitle } from '@vueuse/core';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      alias: '/photos',
      name: 'home',
      component: PhotosList,
      props: () => ({}),
    },
    {
      path: '/photos/:id',
      name: 'photos.details',
      component: Photo,
      meta: {
        title: 'Photo #:id',
      },
    },
    {
      path: '/collections/:name/photos/:id',
      name: 'collections.photos.details',
      component: Photo,
      props: (route) => ({ collection: route.params.name }),
      meta: {
        title: 'Photo #:id',
      },
    },
    {
      path: '/tags/:name/photos/:id',
      name: 'tags.photos.details',
      component: Photo,
      props: (route) => ({ tag: route.params.name }),
      meta: {
        title: 'Photo #:id',
      },
    },
    {
      path: '/collections',
      name: 'collections',
      component: Collections,
      meta: {
        title: 'Collections',
      },
    },
    {
      path: '/tags',
      name: 'tags',
      component: Tags,
      meta: {
        title: 'Tags',
      },
    },
    {
      path: '/collections/:name',
      name: 'collections.photos',
      component: PhotosList,
      props: (route) => ({ collection: route.params.name }),
      meta: {
        title: 'Collection :name',
      },
    },
    {
      path: '/tags/:name',
      name: 'tags.photos',
      component: PhotosList,
      props: (route) => ({ tag: route.params.name }),
      meta: {
        title: 'Tag :name',
      },
    },
    {
      path: '/admin/upload',
      name: 'admin.upload',
      component: () => import('@/views/admin/Upload.vue'),
      meta: {
        title: 'Upload',
      },
    },
    {
      path: '/auth-test',
      name: 'admin.auth-test',
      component: () => import('@/views/admin/AuthTest.vue'),
      meta: {
        title: 'Passkey Playground',
      },
    },
    {
      path: '/auth',
      name: 'admin.auth',
      component: () => import('@/views/admin/Auth.vue'),
      meta: {
        title: 'Login & Management',
      },
    },
  ],
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    } else if (
      from.name === 'photos.details' &&
      ['home', 'collections.photos', 'tags.photos'].includes(to.name as string)
    ) {
      return {
        el: `a[href="${from.path}"]`,
        top: 150,
      };
    } else {
      return { top: 0 };
    }
  },
});

router.beforeResolve(async (to, from) => {
  if (to.path === from.path) return;
  if (to.path.match(/\/photos\/\d+/) && from.path.match(/\/photos\/\d+/)) {
    return;
  }
  const viewTransition = startViewTransition();
  await viewTransition.captured;
});

router.beforeEach((to) => {
  try {
    let pageTitle = to.meta.title as string | undefined;
    if (pageTitle && pageTitle.includes(':')) {
      pageTitle = pageTitle.replace(/:([a-z0-9_]+)/g, (match) => {
        const paramValue = to.params[match.slice(1)];
        return Array.isArray(paramValue) ? paramValue.join(' ') : paramValue;
      });
    }

    if (pageTitle) {
      useTitle(pageTitle + ' | Captured');
    } else {
      useTitle('Captured');
    }
  } catch (error) {
    console.error('Error while setting page title:', error);
  }
});

export default router;
