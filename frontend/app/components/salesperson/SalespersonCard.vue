<template>
  <div class="salesperson-card" :class="{ inactive: !salesperson.active }">
    <!-- Avatar -->
    <div class="avatar">
      <img
        v-if="avatarUrl"
        :src="avatarUrl"
        :alt="salesperson.name"
        class="avatar-image"
      >
      <div v-else class="avatar-placeholder">
        {{ initials }}
      </div>
    </div>

    <!-- Basic Info -->
    <div class="info">
      <h3 class="name">
        {{ salesperson.name }}
      </h3>

      <div v-if="email" class="info-item">
        <span class="label">Email:</span>
        <a :href="`mailto:${email}`" class="value">{{ email }}</a>
      </div>

      <div v-if="phone" class="info-item">
        <span class="label">Phone:</span>
        <span class="value">{{ phone }}</span>
      </div>

      <!-- Sales Team -->
      <div class="info-item">
        <span class="label">Team:</span>
        <span class="value">{{ teamName }}</span>
      </div>

      <!-- Performance Metrics (只在欄位存在時顯示) -->
      <div v-if="hasMetrics" class="metrics">
        <div v-if="salesperson.lead_month_count !== undefined" class="metric">
          <span class="metric-label">Leads (Month)</span>
          <span class="metric-value">{{ salesperson.lead_month_count }}</span>
        </div>
        <div v-if="salesperson.lead_day_count !== undefined" class="metric">
          <span class="metric-label">Leads (Day)</span>
          <span class="metric-value">{{ salesperson.lead_day_count }}</span>
        </div>
      </div>

      <!-- Assignment Info (只在欄位存在時顯示) -->
      <div v-if="salesperson.assignment_max && salesperson.assignment_max > 0" class="info-item">
        <span class="label">Max Assignment:</span>
        <span class="value">{{ salesperson.assignment_max }}</span>
      </div>

      <!-- Status Badge -->
      <div class="status-badge" :class="salesperson.active ? 'active' : 'inactive'">
        {{ salesperson.active ? 'Active' : 'Inactive' }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Salesperson } from '~/types/salesperson'

const props = defineProps<{
  salesperson: Salesperson
}>()

const { getAvatarUrl } = useSalespersons()

const avatarUrl = computed(() => getAvatarUrl(props.salesperson))

const initials = computed(() => {
  const names = props.salesperson.name.split(' ')
  return names.length >= 2
    ? `${names[0][0]}${names[1][0]}`.toUpperCase()
    : names[0][0].toUpperCase()
})

const email = computed(() =>
  props.salesperson.email && props.salesperson.email !== false
    ? props.salesperson.email
    : null
)

const phone = computed(() =>
  props.salesperson.phone && props.salesperson.phone !== false
    ? props.salesperson.phone
    : null
)

const teamName = computed(() =>
  Array.isArray(props.salesperson.crm_team_id)
    ? props.salesperson.crm_team_id[1]
    : 'No Team'
)

const hasMetrics = computed(() =>
  props.salesperson.lead_month_count !== undefined ||
  props.salesperson.lead_day_count !== undefined
)
</script>

<style scoped>
.salesperson-card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 0.75rem;
  padding: 1.5rem;
  transition: box-shadow 0.2s;
}

.salesperson-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.salesperson-card.inactive {
  opacity: 0.6;
}

.avatar {
  margin-bottom: 1rem;
  display: flex;
  justify-content: center;
}

.avatar-image {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background-color: #4CAF50;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 600;
}

.info {
  text-align: center;
}

.name {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.info-item {
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.label {
  font-weight: 500;
  color: #666;
  margin-right: 0.5rem;
}

.value {
  color: #333;
}

.value a {
  color: #4CAF50;
  text-decoration: none;
}

.value a:hover {
  text-decoration: underline;
}

.metrics {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin: 1rem 0;
  padding: 1rem;
  background-color: #f5f5f5;
  border-radius: 0.5rem;
}

.metric {
  text-align: center;
}

.metric-label {
  display: block;
  font-size: 0.75rem;
  color: #666;
  margin-bottom: 0.25rem;
}

.metric-value {
  display: block;
  font-size: 1.5rem;
  font-weight: 600;
  color: #4CAF50;
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  margin-top: 1rem;
}

.status-badge.active {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.status-badge.inactive {
  background-color: #ffebee;
  color: #c62828;
}
</style>
