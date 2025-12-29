<template>
  <div class="flex items-center justify-center min-h-screen bg-gray-100">
    <div v-if="error" class="text-center max-w-md bg-white rounded-lg shadow-md p-8">
      <div class="text-red-600 text-6xl mb-4">⚠️</div>
      <h1 class="text-2xl font-bold text-red-600 mb-4">認證失敗</h1>
      <p class="text-gray-600 mb-6">{{ error }}</p>
      <button
        @click="navigateTo('/login')"
        class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
      >
        返回登入頁面
      </button>
    </div>
    <div v-else class="text-center bg-white rounded-lg shadow-md p-8">
      <div class="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-6"></div>
      <p class="text-gray-700 text-lg font-medium">正在完成認證...</p>
      <p class="text-gray-500 text-sm mt-2">請稍候</p>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const { checkAuth } = useAuth()

const error = ref<string | null>(null)

definePageMeta({
  layout: false,
})

onMounted(async () => {
  // Check for OAuth errors in query params
  const oauthError = route.query.oauth_error as string

  if (oauthError) {
    switch (oauthError) {
      case 'access_denied':
        error.value = '存取被拒絕。請重試或聯絡支援人員。'
        break
      case 'server_error':
        error.value = '伺服器發生錯誤。請稍後重試。'
        break
      default:
        error.value = '認證過程中發生未知錯誤。'
    }
    return
  }

  // Cookie should be set by Odoo callback
  // Verify authentication worked
  try {
    // Wait a bit to ensure cookie is set
    await new Promise(resolve => setTimeout(resolve, 500))

    const isAuth = await checkAuth()

    if (isAuth) {
      // Success! Redirect to intended page or home
      const redirect = route.query.redirect as string || '/salespersons'
      navigateTo(redirect)
    } else {
      error.value = '認證失敗。未建立工作階段。請重試。'
    }
  } catch (e) {
    console.error('Auth verification failed:', e)
    error.value = '無法驗證認證。請重試。'
  }
})
</script>
