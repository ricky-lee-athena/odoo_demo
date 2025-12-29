export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const apiKey = getCookie(event, 'odoo_api_key')

  // Clear the cookie
  setCookie(event, 'odoo_api_key', '', {
    maxAge: 0,
    httpOnly: true,
    secure: false,  // Set to true in production
    sameSite: 'lax'
  })

  // Optionally: Call Odoo to revoke the API key
  if (apiKey) {
    try {
      const baseUrl = config.public.odooBaseUrl
      const database = config.public.odooDatabase

      // Call custom method to revoke OAuth API keys
      await $fetch(`${baseUrl}/json/2/res.users/revoke_oauth_api_keys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `bearer ${apiKey}`,
          ...(database ? { 'X-Odoo-Database': database } : {})
        },
        body: JSON.stringify({})
      })
    } catch (error) {
      console.error('Failed to revoke API key on Odoo:', error)
      // Continue anyway - cookie is cleared
    }
  }

  return {
    success: true
  }
})
