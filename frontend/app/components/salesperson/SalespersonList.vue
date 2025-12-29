<template>
  <div class="salesperson-list">
    <div class="grid">
      <SalespersonCard
        v-for="salesperson in salespersons"
        :key="salesperson.id"
        :salesperson="salesperson"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Salesperson } from '~/types/salesperson'

defineProps<{
  salespersons: Salesperson[]
}>()
</script>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}

@media (max-width: 768px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
