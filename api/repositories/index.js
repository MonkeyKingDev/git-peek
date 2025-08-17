import { getSessionFromRequest } from '../utils/auth.js';
import { asyncHandler, handleCors, sendSuccess } from '../utils/response.js';
import { fetchAllPages } from '../utils/github.js';

export default asyncHandler(async (req, res) => {
  if (handleCors(req, res)) return;
  
  const session = getSessionFromRequest(req);
  
  const repositories = await fetchAllPages(
    '/user/repos', 
    session.access_token, 
    { sort: 'updated' },
    200 // Limit to 200 repos for performance
  );
  
  sendSuccess(res, repositories);
});