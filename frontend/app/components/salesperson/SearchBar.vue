<template>
  <div class="search-bar">
    <div class="search-input-wrapper">
      <input
        type="text"
        :value="searchQuery"
        @input="updateSearchQuery"
        placeholder="Search by name..."
        class="search-input"
      >
    </div>

    <div class="filters">
      <!-- Team Filter -->
      <select
        :value="selectedTeam"
        @change="updateTeamFilter"
        class="filter-select"
      >
        <option :value="null">
          All Teams
        </option>
        <option
          v-for="team in teams"
          :key="team.id"
          :value="team.id"
        >
          {{ team.name }}
        </option>
      </select>

      <!-- Active Status Filter -->
      <select
        :value="activeStatus"
        @change="updateActiveStatus"
        class="filter-select"
      >
        <option value="all">
          All Status
        </option>
        <option value="active">
          Active Only
        </option>
        <option value="inactive">
          Inactive Only
        </option>
      </select>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CrmTeam } from '~/types/salesperson'

const props = defineProps<{
  searchQuery: string
  selectedTeam: number | null
  activeStatus: 'all' | 'active' | 'inactive'
  teams: CrmTeam[]
}>()

const emit = defineEmits<{
  'update:searchQuery': [value: string]
  'update:selectedTeam': [value: number | null]
  'update:activeStatus': [value: 'all' | 'active' | 'inactive']
  'search': []
}>()

function updateSearchQuery(event: Event) {
  const target = event.target as HTMLInputElement
  emit('update:searchQuery', target.value)
}

function updateTeamFilter(event: Event) {
  const target = event.target as HTMLSelectElement
  const value = target.value === 'null' ? null : parseInt(target.value)
  emit('update:selectedTeam', value)
}

function updateActiveStatus(event: Event) {
  const target = event.target as HTMLSelectElement
  emit('update:activeStatus', target.value as 'all' | 'active' | 'inactive')
}
</script>

<style scoped>
.search-bar {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.search-input-wrapper {
  flex: 1;
  min-width: 300px;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #ddd;
  border-radius: 0.5rem;
  font-size: 1rem;
}

.search-input:focus {
  outline: none;
  border-color: #4CAF50;
  box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
}

.filters {
  display: flex;
  gap: 1rem;
}

.filter-select {
  padding: 0.75rem 1rem;
  border: 1px solid #ddd;
  border-radius: 0.5rem;
  font-size: 1rem;
  background-color: white;
  cursor: pointer;
}

.filter-select:focus {
  outline: none;
  border-color: #4CAF50;
}
</style>
