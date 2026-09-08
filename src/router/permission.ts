import type { Router } from 'vue-router'
import { loginByAccessToken } from '@/api/openness'
import { useAuthStore, useUserStore } from '@/store'

export function setupPageGuard(router: Router) {
  router.beforeEach(async (to, from, next) => {
    const accessToken = to.query.accessToken as string | undefined
    if (accessToken) {
      try {
        const res = await loginByAccessToken<Login.LoginResponse>({ accessToken })
        if (res.code === 0) {
          const authStore = useAuthStore()
          authStore.setToken(res.data.token)
          authStore.setUserInfo(res.data)
          const target = to.path === '/login' ? '/' : to.path
          next({ path: target, query: {} })
          return
        }
      } catch (e) {
        // Token login failed, fall through to normal flow
      }
    }

    const userStore = useUserStore()
    if (userStore.userInfo.role !== 1 && to.path.includes('admin'))
      next({ name: '404' })
    else
      next()
  })
}
