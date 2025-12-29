// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/eslint', '@nuxt/test-utils'],

  runtimeConfig: {
    // Public keys (exposed to client)
    public: {
      odooBaseUrl: process.env.NUXT_ODOO_BASE_URL || 'http://localhost:8069',
      odooDatabase: process.env.NUXT_ODOO_DATABASE || '',
      odooApiKey: process.env.NUXT_ODOO_API_KEY || ''
    }
  }
})