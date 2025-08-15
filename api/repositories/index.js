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
    100 // Limit to 100 repos for performance
  );
  
  sendSuccess(res, repositories);
});