<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white shadow">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <div class="flex items-center gap-4">
          <h1 class="text-xl font-bold text-gray-900">Odoo Portal</h1>
        </div>

        <div v-if="user" class="flex items-center gap-4">
          <div class="flex items-center gap-3">
            <div v-if="user.avatar" class="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-200">
              <img
                :src="user.avatar"
                :alt="user.name"
                class="w-full h-full object-cover"
              />
            </div>
            <div v-else class="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
              {{ getInitials(user.name) }}
            </div>
            <div class="hidden md:block">
              <div class="text-sm font-medium text-gray-900">{{ user.name }}</div>
              <div class="text-xs text-gray-500">{{ user.email }}</div>
            </div>
          </div>

          <button
            @click="handleLogout"
            class="text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors"
          >
            登出
          </button>
        </div>
      </div>
    </header>

    <main class="py-6">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
const { user, logout } = useAuth()

const handleLogout = async () => {
  if (confirm('確定要登出嗎？')) {
    await logout()
  }
}

const getInitials = (name: string) => {
  const names = name.split(' ')
  if (names.length >= 2) {
    return `${names[0][0]}${names[1][0]}`.toUpperCase()
  }
  return names[0][0].toUpperCase()
}
</script>
