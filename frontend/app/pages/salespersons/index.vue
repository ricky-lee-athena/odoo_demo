<template>
  <div class="salespersons-page">
    <header class="page-header">
      <h1>Salespersons</h1>
      <p>Search and filter your sales team members</p>
    </header>

    <!-- Search and Filter Controls -->
    <SalespersonSearchBar
      v-model:search-query="filters.searchQuery"
      v-model:selected-team="filters.selectedTeam"
      v-model:active-status="filters.activeStatus"
      :teams="teams"
      @search="handleSearch"
    />

    <!-- Error Display -->
    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      Loading salespersons...
    </div>

    <!-- Results -->
    <SalespersonList
      v-else-if="sortedSalespersons.length > 0"
      :salespersons="sortedSalespersons"
    />

    <!-- Empty State -->
    <div v-else class="empty-state">
      No salespersons found matching your criteria.
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SalespersonFilters } from '~/types/salesperson'

// Page metadata
definePageMeta({
  title: 'Salespersons',
  middleware: ['auth']  // Require authentication
})

// Composables
const {
  salespersons,
  teams,
  loading,
  error,
  fetchSalespersons,
  fetchTeams
} = useSalespersons()

// Reactive filter state
const filters = ref<SalespersonFilters>({
  searchQuery: '',
  selectedTeam: null,
  activeStatus: 'active' // Default to showing active only
})

// Search handler
async function handleSearch() {
  await fetchSalespersons({
    searchQuery: filters.value.searchQuery,
    teamId: filters.value.selectedTeam,
    activeStatus: filters.value.activeStatus === 'all'
      ? null
      : filters.value.activeStatus === 'active'
  })
}

// 排序後的業務員列表（依姓名排序）
const sortedSalespersons = computed(() => {
  return [...salespersons.value].sort((a, b) => {
    return a.name.localeCompare(b.name)
  })
})

// Initial data load
onMounted(async () => {
  // Load teams for filter dropdown
  await fetchTeams()

  // Load initial salespersons (active only)
  await handleSearch()
})

// Watch for filter changes and auto-search
watch(filters, async () => {
  await handleSearch()
}, { deep: true })
</script>

<style scoped>
.salespersons-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

.page-header {
  margin-bottom: 2rem;
}

.page-header h1 {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.page-header p {
  color: #666;
}

.error-message {
  background-color: #fee;
  color: #c33;
  padding: 1rem;
  border-radius: 0.5rem;
  margin: 1rem 0;
}

.loading-state {
  text-align: center;
  padding: 3rem;
  color: #666;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #999;
}
</style>
