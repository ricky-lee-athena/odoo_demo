# -*- coding: utf-8 -*-
{
    'name': 'OAuth API Bridge',
    'version': '1.0',
    'category': 'Authentication',
    'summary': 'Bridge Google OAuth to API Key generation for frontend clients',
    'description': '''
        Extends auth_oauth to automatically generate API Keys for authenticated users.
        Designed for headless/SPA frontends that need bearer token authentication.

        Features:
        - Automatic API Key generation after OAuth login
        - Custom OAuth callback endpoint for frontend
        - HTTP-only cookie management
        - API Key lifecycle management
    ''',
    'author': 'Your Company',
    'website': 'https://www.yourcompany.com',
    'depends': ['base', 'auth_oauth'],
    'data': [
        'security/ir.model.access.csv',
    ],
    'installable': True,
    'auto_install': False,
    'application': False,
    'license': 'LGPL-3',
}
