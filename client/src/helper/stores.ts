import { defineStore } from 'pinia'
import { useStorage } from '@vueuse/core'

export const usePermissionStore = defineStore('permission', () => {

  const adminView = useStorage('adminView', false)

  const toggleAdminView = () => {
    adminView.value = !adminView.value
  }

  return { adminView, toggleAdminView }
})
