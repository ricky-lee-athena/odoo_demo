import type { User } from '~/types/auth'

export function useAuth() {
  // Check if user is authenticated (has API key cookie)
  const isAuthenticated = useState<boolean>('auth:isAuthenticated', () => false)
  const user = useState<User | null>('auth:user', () => null)
  const isLoading = useState<boolean>('auth:loading', () => false)

  /**
   * Initialize OAuth login flow
   * Gets the OAuth URL from our server endpoint and redirects to Google
   */
  async function loginWithGoogle() {
    isLoading.value = true
    try {
      // Get the OAuth URL from our server endpoint
      // This endpoint fetches the provider info from Odoo and constructs the correct URL
      const response = await $fetch<{ url: string; provider: string }>('/api/auth/oauth-url')

      // Redirect to Google OAuth
      window.location.href = response.url
    } catch (error) {
      console.error('Failed to initiate OAuth login:', error)
      isLoading.value = false
      // You might want to show an error message to the user here
      alert('無法啟動 Google 登入。請確認 Odoo 設定正確。')
    }
  }

  /**
   * Check current authentication status
   * Calls server endpoint that checks for API key cookie
   */
  async function checkAuth() {
    isLoading.value = true
    try {
      const response = await $fetch<{ authenticated: boolean; user?: User }>('/api/auth/session')
      isAuthenticated.value = response.authenticated
      user.value = response.user || null
      return response.authenticated
    } catch (error) {
      console.error('Auth check failed:', error)
      isAuthenticated.value = false
      user.value = null
      return false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Logout user
   * Clears cookie and optionally revokes API key on Odoo side
   */
  async function logout() {
    try {
      await $fetch('/api/auth/logout', { method: 'POST' })
      isAuthenticated.value = false
      user.value = null

      // Redirect to login page
      navigateTo('/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return {
    isAuthenticated: readonly(isAuthenticated),
    user: readonly(user),
    isLoading: readonly(isLoading),
    loginWithGoogle,
    checkAuth,
    logout
  }
}
