import { getSessionFromRequest } from '../utils/auth.js';
import { asyncHandler, handleCors, sendSuccess } from '../utils/response.js';
import { fetchAllPages } from '../utils/github.js';

export default asyncHandler(async (req, res) => {
  if (handleCors(req, res)) return;
  
  const session = getSessionFromRequest(req);
  
  const starredRepos = await fetchAllPages(
    '/user/starred', 
    session.access_token, 
    { sort: 'created' },
    100 // Limit to 100 starred repos for performance
  );
  
  sendSuccess(res, starredRepos);
});