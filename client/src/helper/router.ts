import { createRouter, createWebHistory } from 'vue-router'
import Upload from '../views/admin/Upload.vue'
import Photo from '../views/Photo.vue'
import Collections from '../views/Collections.vue'
import Tags from '../views/Tags.vue'
import PhotosList from '../views/PhotosList.vue'
import { startViewTransition } from 'vue-view-transitions'
import AuthTest from '@/views/admin/AuthTest.vue'
import Auth from '@/views/admin/Auth.vue'


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
    },
    {
      path: '/collections',
      name: 'collections',
      component: Collections,
    },
    {
      path: '/tags',
      name: 'tags',
      component: Tags,
    },
    {
      path: '/collections/:name',
      name: 'collections.photos',
      component: PhotosList,
      props: route => ({ collection: route.params.name }),
    },
    {
      path: '/tags/:name',
      name: 'tags.photos',
      component: PhotosList,
      props: route => ({ tag: route.params.name }),
    },
    {
      path: '/admin/upload',
      name: 'admin.upload',
      component: Upload,
    },
    {
      path: '/auth-test',
      name: 'admin.auth-test',
      component: AuthTest,
    },
    {
      path: '/auth',
      name: 'admin.auth',
      component: Auth,
    },
  ],
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    } else {
      return { top: 0 };
    }
  }
})

router.beforeResolve(async () => {
  const viewTransition = startViewTransition();
  await viewTransition.captured;
});

export default router
