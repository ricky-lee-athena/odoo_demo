export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const baseUrl = config.public.odooBaseUrl
  const database = config.public.odooDatabase
  const providerId = config.public.googleOAuthProviderId || '3'

  try {
    // Get the origin from the request headers
    const origin = event.node.req.headers.origin ||
                   event.node.req.headers.referer?.split('/').slice(0, 3).join('/') ||
                   'http://localhost:3000'

    const frontendCallbackUrl = `${origin}/oauth-callback`

    // Call Odoo's custom endpoint to get the OAuth URL
    const odooResponse = await $fetch<any>(
      `${baseUrl}/auth_oauth/get_oauth_url`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: {
          jsonrpc: '2.0',
          method: 'call',
          params: {
            provider_id: parseInt(providerId),
            database: database,
            redirect_uri: frontendCallbackUrl
          },
          id: Date.now()
        }
      }
    )

    // Odoo JSON-RPC response format: { jsonrpc: "2.0", id: X, result: {...} }
    // Or error format: { jsonrpc: "2.0", id: X, error: {...} }

    if (odooResponse.error) {
      console.error('Odoo returned error:', odooResponse.error)
      throw new Error(odooResponse.error.message || odooResponse.error.data?.message || 'Odoo error')
    }

    const result = odooResponse.result

    // Check if result has error property (our custom error from controller)
    if (result?.error) {
      throw new Error(result.error)
    }

    if (!result?.url) {
      console.error('Invalid Odoo response:', odooResponse)
      throw new Error('No OAuth URL returned from Odoo. Make sure Google OAuth is configured.')
    }

    return {
      url: result.url,
      provider: result.provider || 'Google'
    }

  } catch (error: any) {
    console.error('Failed to get OAuth URL:', error)

    // Provide more helpful error messages
    let errorMessage = error.message || 'Unknown error'

    if (error.message?.includes('fetch failed') || error.cause?.code === 'ECONNREFUSED') {
      errorMessage = 'Cannot connect to Odoo. Make sure Odoo is running on ' + baseUrl
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to initiate OAuth login',
      data: errorMessage
    })
  }
})
