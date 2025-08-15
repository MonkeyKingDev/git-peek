import { createToken } from '../utils/auth.js';
import { handleCors, sendError } from '../utils/response.js';
import { githubApiRequest } from '../utils/github.js';

export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  try {
    const { code } = req.query;

    if (!code) {
      return sendError(res, 400, 'Authorization code not provided');
    }

    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;
    const redirectUri = process.env.GITHUB_REDIRECT_URI;

    if (!clientId || !clientSecret) {
      return sendError(res, 500, 'GitHub OAuth not configured');
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        redirect_uri: redirectUri
      })
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      return sendError(res, 400, tokenData.error_description || 'OAuth exchange failed');
    }

    // Get user info using our GitHub utility
    const user = await githubApiRequest('/user', tokenData.access_token);

    // Create JWT token
    const token = createToken(user, tokenData.access_token);

    // Redirect to frontend with session
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/dashboard?session=${token}`);
    
  } catch (error) {
    sendError(res, 500, 'OAuth callback failed', error);
  }
}