export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const apiKey = getCookie(event, 'odoo_api_key')

  if (!apiKey) {
    return {
      authenticated: false
    }
  }

  // Validate API key by making a simple Odoo request
  try {
    const baseUrl = config.public.odooBaseUrl
    const database = config.public.odooDatabase

    // Call Odoo to get current user info
    const url = `${baseUrl}/json/2/res.users/read`

    const response = await $fetch<any[]>(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `bearer ${apiKey}`,
        ...(database ? { 'X-Odoo-Database': database } : {})
      },
      body: JSON.stringify({
        ids: [],  // Empty array means current user
        fields: ['id', 'name', 'login', 'email', 'image_128']
      })
    })

    if (response && response.length > 0) {
      const userData = response[0]
      return {
        authenticated: true,
        user: {
          id: userData.id,
          name: userData.name,
          email: userData.email || userData.login,
          avatar: userData.image_128 ? `data:image/png;base64,${userData.image_128}` : null
        }
      }
    }

    return { authenticated: false }

  } catch (error: any) {
    console.error('Session validation failed:', error)

    // If 401, API key is invalid
    if (error.statusCode === 401 || error.status === 401) {
      // Clear invalid cookie
      setCookie(event, 'odoo_api_key', '', {
        maxAge: 0,
        httpOnly: true
      })
    }

    return { authenticated: false }
  }
})
