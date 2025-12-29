export default defineNuxtRouteMiddleware(async (to, from) => {
  // Skip for login and oauth callback pages
  if (to.path === '/login' || to.path === '/oauth-callback') {
    return
  }

  const { checkAuth, isAuthenticated } = useAuth()

  // Check authentication status if not already checked
  if (!isAuthenticated.value) {
    await checkAuth()
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated.value) {
    return navigateTo({
      path: '/login',
      query: { redirect: to.fullPath }
    })
  }
})
