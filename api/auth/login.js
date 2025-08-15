import { handleCors, sendError, sendSuccess } from '../utils/response.js';

export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  const clientId = process.env.GITHUB_CLIENT_ID;
  const redirectUri = process.env.GITHUB_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return sendError(res, 500, 'GitHub OAuth not configured');
  }

  const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=repo,user`;

  sendSuccess(res, { auth_url: authUrl });
}