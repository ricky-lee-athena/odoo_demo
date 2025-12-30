# -*- coding: utf-8 -*-
import logging
from datetime import datetime, timedelta

from odoo import models, api, _
from odoo.exceptions import UserError

_logger = logging.getLogger(__name__)


class ResUsers(models.Model):
    _inherit = 'res.users'

    def _generate_api_key_for_oauth(self, description='OAuth API Key', expiration_days=30):
        """
        Generate an API key for OAuth-authenticated users.

        This method bypasses the normal UI-based API key creation flow
        and directly generates a key for frontend OAuth authentication.

        :param description: Description for the API key
        :param expiration_days: Number of days until expiration (0 for persistent)
        :return: str - The generated API key

        Security Notes:
        - Only callable in sudo mode (by design)
        - Automatically removes old OAuth-generated keys for this user
        - Respects user's group API key duration limits
        """
        self.ensure_one()

        if not self.active:
            raise UserError(_("Cannot generate API key for inactive user"))

        # Remove existing OAuth-generated API keys for this user to prevent accumulation
        # Keep only manual keys (those with different descriptions)
        existing_oauth_keys = self.sudo().env['res.users.apikeys'].search([
            ('user_id', '=', self.id),
            ('name', 'ilike', 'OAuth%')
        ])
        if existing_oauth_keys:
            _logger.info(
                "Removing %d existing OAuth API key(s) for user '%s'",
                len(existing_oauth_keys), self.login
            )
            existing_oauth_keys._remove()

        # Calculate expiration date
        expiration_date = None
        if expiration_days > 0:
            # Check user's maximum allowed duration
            # Get api_key_duration from user's groups
            max_duration = 0
            for group in self.groups_id:
                if hasattr(group, 'api_key_duration') and group.api_key_duration > 0:
                    max_duration = max(max_duration, group.api_key_duration)

            if max_duration > 0 and expiration_days > max_duration:
                expiration_days = int(max_duration)
                _logger.warning(
                    "API key duration reduced from requested to %d days for user '%s' due to group limits",
                    max_duration, self.login
                )

            expiration_date = datetime.now() + timedelta(days=expiration_days)

        # Generate the API key using Odoo's built-in method
        # This must be called in sudo() mode
        api_key_model = self.sudo().env['res.users.apikeys']
        api_key = api_key_model._generate(
            scope=None,  # Full access (same as manual API keys)
            name=description,
            expiration_date=expiration_date
        )

        _logger.info(
            "Generated API key for user '%s' (uid: %s), expires: %s",
            self.login, self.id, expiration_date or 'Never'
        )

        return api_key

    def revoke_oauth_api_keys(self):
        """
        Revoke all OAuth-generated API keys for this user.
        Useful for logout functionality.
        """
        self.ensure_one()
        oauth_keys = self.sudo().env['res.users.apikeys'].search([
            ('user_id', '=', self.id),
            ('name', 'ilike', 'OAuth%')
        ])
        if oauth_keys:
            oauth_keys._remove()
            _logger.info("Revoked %d OAuth API key(s) for user '%s'", len(oauth_keys), self.login)
        return True
