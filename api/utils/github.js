/**
 * GitHub API utility functions
 */

const GITHUB_API_BASE = 'https://api.github.com';

/**
 * Make a request to GitHub API with authentication
 * @param {string} endpoint - API endpoint (without base URL)
 * @param {string} accessToken - GitHub access token
 * @param {object} options - Additional fetch options
 * @returns {Promise<object>} API response
 */
export async function githubApiRequest(endpoint, accessToken, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${GITHUB_API_BASE}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `token ${accessToken}`,
      'Accept': 'application/vnd.github.v3+json',
      ...options.headers
    }
  });
  
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('GitHub token expired');
    }
    if (response.status === 404) {
      throw new Error('Resource not found');
    }
    throw new Error(`GitHub API error: ${response.status}`);
  }
  
  return response.json();
}

/**
 * Fetch all pages of a paginated GitHub API endpoint
 * @param {string} endpoint - API endpoint
 * @param {string} accessToken - GitHub access token
 * @param {object} params - Query parameters
 * @param {number} maxItems - Maximum items to fetch (0 = no limit)
 * @returns {Promise<Array>} All items from all pages
 */
export async function fetchAllPages(endpoint, accessToken, params = {}, maxItems = 0) {
  const allItems = [];
  let page = 1;
  const perPage = 100;
  
  while (true) {
    const queryParams = new URLSearchParams({
      ...params,
      per_page: perPage,
      page: page
    });
    
    const items = await githubApiRequest(`${endpoint}?${queryParams}`, accessToken);
    
    if (!Array.isArray(items) || items.length === 0) {
      break;
    }
    
    allItems.push(...items);
    
    // Check limits
    if (items.length < perPage) break; // Last page
    if (maxItems > 0 && allItems.length >= maxItems) {
      return allItems.slice(0, maxItems);
    }
    
    page++;
  }
  
  return allItems;
}

/**
 * Fetch commits with date filtering
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} accessToken - GitHub access token
 * @param {object} dateRange - Date range options
 * @returns {Promise<Array>} Commits data
 */
export async function fetchCommits(owner, repo, accessToken, { since, until } = {}) {
  const params = {};
  if (since) params.since = since;
  if (until) params.until = until;
  
  return fetchAllPages(`/repos/${owner}/${repo}/commits`, accessToken, params, 1000);
}

/**
 * Fetch pull requests with date filtering
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} accessToken - GitHub access token
 * @param {object} dateRange - Date range options
 * @returns {Promise<Array>} Pull requests data
 */
export async function fetchPullRequests(owner, repo, accessToken, { since, until } = {}) {
  const params = {
    state: 'all',
    sort: 'created'
  };
  
  // GitHub doesn't support since/until for PRs, so we'll filter client-side if needed
  const prs = await fetchAllPages(`/repos/${owner}/${repo}/pulls`, accessToken, params, 500);
  
  if (!since && !until) {
    return prs;
  }
  
  return prs.filter(pr => {
    const prDate = new Date(pr.created_at);
    if (since && prDate < new Date(since)) return false;
    if (until && prDate > new Date(until)) return false;
    return true;
  });
}

/**
 * Fetch issues with date filtering
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} accessToken - GitHub access token
 * @param {object} dateRange - Date range options
 * @returns {Promise<Array>} Issues data
 */
export async function fetchIssues(owner, repo, accessToken, { since, until } = {}) {
  const params = { state: 'all' };
  if (since) params.since = since;
  
  const issues = await fetchAllPages(`/repos/${owner}/${repo}/issues`, accessToken, params, 200);
  
  if (!until) {
    return issues;
  }
  
  return issues.filter(issue => {
    const issueDate = new Date(issue.created_at);
    return issueDate <= new Date(until);
  });
}