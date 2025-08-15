import { getSessionFromRequest } from '../utils/auth.js';
import { asyncHandler, handleCors, sendSuccess } from '../utils/response.js';

export default asyncHandler(async (req, res) => {
  if (handleCors(req, res)) return;
  
  const session = getSessionFromRequest(req);
  sendSuccess(res, session.user);
});