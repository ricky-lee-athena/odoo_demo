# -*- coding: utf-8 -*-
import json
import logging
from datetime import datetime, timedelta
import werkzeug.urls
import werkzeug.utils
from werkzeug.exceptions import BadRequest

from odoo import http, SUPERUSER_ID
from odoo.http import request
from odoo.exceptions import AccessDenied
from odoo.addons.auth_oauth.controllers.main import OAuthController, fragment_to_query_string
from odoo.addons.web.controllers.utils import ensure_db

_logger = logging.getLogger(__name__)


class OAuthAPIBridgeController(OAuthController):
    """
    Custom OAuth controller for frontend API authentication.

    Flow:
    1. Frontend requests OAuth URL from /auth_oauth/get_oauth_url
    2. Frontend redirects user to Google OAuth
    3. Google redirects back to /auth_oauth/api_signin
    4. We validate OAuth, create/update user, generate API key
    5. Set API key in HTTP-only cookie and redirect to frontend
    """

    @http.route('/auth_oauth/get_oauth_url', type='json', auth='none', methods=['POST'], csrf=False)
    def get_oauth_url(self, provider_id, database, redirect_uri):
        """
        Get the OAuth authorization URL for the given provider.

        This endpoint is called by the frontend to get the correct OAuth URL
        including the client_id which is stored in Odoo.

        :param provider_id: OAuth provider ID (e.g., 3 for Google)
        :param database: Database name
        :param redirect_uri: Where to redirect after OAuth (frontend callback URL)
        :return: dict with 'url' and 'provider' keys
        """
        try:
            # Ensure database
            if not http.db_filter([database]):
                return {'error': 'Invalid database'}
            ensure_db(db=database)

            # Get the OAuth provider
            provider = request.env['auth.oauth.provider'].sudo().browse(int(provider_id))

            if not provider.exists() or not provider.enabled:
                return {'error': 'OAuth provider not found or not enabled'}

            # Build the state parameter
            state = {
                'd': database,
                'p': int(provider_id),
                'r': redirect_uri,
                'frontend': True  # Our custom flag
            }

            # Get base URL for the callback
            base_url = request.httprequest.url_root.rstrip('/')

            # Build OAuth authorization URL
            params = {
                'response_type': 'token',
                'client_id': provider.client_id,
                'redirect_uri': f'{base_url}/auth_oauth/api_signin',
                'scope': provider.scope,
                'state': json.dumps(state),
            }

            # Construct the full authorization URL
            oauth_url = f"{provider.auth_endpoint}?{werkzeug.urls.url_encode(params)}"

            return {
                'url': oauth_url,
                'provider': provider.name
            }

        except Exception as e:
            _logger.exception('Error generating OAuth URL')
            return {'error': str(e)}

    @http.route('/auth_oauth/api_signin', type='http', auth='none', readonly=False, csrf=False)
    @fragment_to_query_string
    def api_signin(self, **kw):
        """
        Custom OAuth callback that generates API Key for frontend.

        Query params expected:
        - access_token: OAuth access token from Google
        - state: JSON with {d: database, p: provider_id, r: redirect_url, frontend: true}
        """
        # Parse state early for error handling
        state = None
        redirect_url = 'http://localhost:3000/oauth-callback'  # Default fallback

        try:
            # Parse state
            state = json.loads(kw.get('state', '{}'))
            # Extract redirect URL early for error handling
            if state.get('r'):
                redirect_url = state['r']

            _logger.info('OAuth callback received. State: %s, Has access_token: %s',
                        state, 'access_token' in kw)

            # Verify this is a frontend OAuth request
            if not state.get('frontend'):
                # Fall back to standard OAuth flow
                _logger.info('Not a frontend OAuth request, using standard flow')
                return super().signin(**kw)

            # Ensure database
            dbname = state.get('d')
            if not http.db_filter([dbname]):
                return BadRequest()
            ensure_db(db=dbname)

            provider_id = state.get('p')
            access_token = kw.get('access_token')

            if not access_token:
                raise AccessDenied('No access token provided')

            # Authenticate user via OAuth (this creates user if needed)
            # Returns: (dbname, login, oauth_access_token)
            _, login, oauth_token = request.env['res.users'].with_user(SUPERUSER_ID).auth_oauth(
                provider_id,
                kw
            )
            request.env.cr.commit()

            # Authenticate session with OAuth token
            credential = {'login': login, 'token': oauth_token, 'type': 'oauth_token'}
            auth_info = request.session.authenticate(request.env, credential)

            # Generate API Key for this user
            user = request.env['res.users'].sudo().browse(auth_info['uid'])
            api_key = user._generate_api_key_for_oauth(
                description='Google OAuth Login',
                expiration_days=30  # Configurable
            )

            _logger.info(
                "OAuth API signin successful for user '%s' (uid: %s). API key generated.",
                login, auth_info['uid']
            )

            # Redirect to frontend with API key in secure cookie
            redirect_url = werkzeug.urls.url_unquote_plus(state.get('r', '/'))
            response = request.redirect(redirect_url, 303)

            # Set HTTP-only cookie with API key
            # CRITICAL: Use secure=True in production, httponly=True always
            response.set_cookie(
                key='odoo_api_key',
                value=api_key,
                max_age=30 * 24 * 60 * 60,  # 30 days
                httponly=True,  # Prevent JavaScript access
                secure=False,    # Set to True for HTTPS in production
                samesite='Lax'   # CSRF protection
            )

            return response

        except AccessDenied as e:
            _logger.warning('OAuth API signin failed: %s', str(e))
            # Use pre-extracted redirect_url (already set at top of method)
            error_url = f"{redirect_url}?oauth_error=access_denied"
            return request.redirect(error_url, 303)

        except Exception as e:
            _logger.exception('Unexpected error during OAuth API signin')
            # Use pre-extracted redirect_url (already set at top of method)
            error_url = f"{redirect_url}?oauth_error=server_error"
            return request.redirect(error_url, 303)
