/**
 * GitHub API utility functions
 */
import fetch from 'node-fetch';

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
 * Fetch pages with early termination based on date range
 * @param {string} endpoint - API endpoint
 * @param {string} accessToken - GitHub access token
 * @param {object} params - Query parameters
 * @param {string} since - Start date (ISO string)
 * @param {string} until - End date (ISO string)
 * @param {string} dateField - Field name containing the date (e.g., 'created_at')
 * @returns {Promise<Array>} Items within date range
 */
export async function fetchPagesWithDateTermination(endpoint, accessToken, params = {}, since, until, dateField) {
  const allItems = [];
  let page = 1;
  const perPage = 100;
  let shouldContinue = true;
  
  while (shouldContinue) {
    const queryParams = new URLSearchParams({
      ...params,
      per_page: perPage,
      page: page
    });
    
    const items = await githubApiRequest(`${endpoint}?${queryParams}`, accessToken);
    
    if (!Array.isArray(items) || items.length === 0) {
      break;
    }
    
    // Filter items and check for early termination
    const validItems = [];
    let shouldTerminate = false;
    
    for (const item of items) {
      // Handle nested date fields like 'commit.author.date'
      let itemDate;
      if (dateField.includes('.')) {
        const parts = dateField.split('.');
        let value = item;
        for (const part of parts) {
          value = value?.[part];
        }
        itemDate = new Date(value || item.created_at);
      } else {
        itemDate = new Date(item[dateField]);
      }
      
      // If we've gone past our date range (too old), stop fetching
      if (since && itemDate < new Date(since)) {
        shouldTerminate = true;
        break;
      }
      
      // Include items within our date range
      if ((!since || itemDate >= new Date(since)) && (!until || itemDate <= new Date(until))) {
        validItems.push(item);
      }
    }
    
    allItems.push(...validItems);
    
    // Stop if we've reached the end of our date range
    if (shouldTerminate || items.length < perPage) {
      shouldContinue = false;
    }
    
    page++;
    
    // Safety limit to prevent infinite loops
    if (page > 50) {
      console.warn(`Reached page limit (50) for ${endpoint}`);
      break;
    }
  }
  
  console.log(`Smart pagination: fetched ${allItems.length} items from ${page - 1} pages`);
  return allItems;
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
  // Note: GitHub API doesn't support 'until' for commits, so we'll filter client-side
  
  console.log(`Fetching commits for ${owner}/${repo} with params:`, params);
  
  // Use smart pagination for until filtering to avoid fetching too much data
  let commits = [];
  if (until) {
    commits = await fetchPagesWithDateTermination(`/repos/${owner}/${repo}/commits`, accessToken, params, since, until, 'commit.author.date');
  } else {
    commits = await fetchAllPages(`/repos/${owner}/${repo}/commits`, accessToken, params, 0); // 0 = no limit
  }
  
  console.log(`Fetched ${commits.length} commits with smart pagination`);
  return commits;
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
    sort: 'created',
    direction: 'desc' // Get newest first for better filtering
  };
  
  console.log(`Fetching PRs for ${owner}/${repo} with date range:`, { since, until });
  
  // For date-filtered requests, use smart pagination to avoid fetching entire history
  let prs = [];
  if (since || until) {
    prs = await fetchPagesWithDateTermination(`/repos/${owner}/${repo}/pulls`, accessToken, params, since, until, 'created_at');
  } else {
    // If no date filter, limit to reasonable amount for performance
    prs = await fetchAllPages(`/repos/${owner}/${repo}/pulls`, accessToken, params, 1000);
  }
  
  console.log(`Fetched ${prs.length} PRs with smart pagination`);
  return prs;
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
  const params = { 
    state: 'all',
    sort: 'created',
    direction: 'desc' // Get newest first
  };
  if (since) params.since = since;
  
  // Use smart pagination for date-filtered requests
  let issues = [];
  if (since || until) {
    issues = await fetchPagesWithDateTermination(`/repos/${owner}/${repo}/issues`, accessToken, params, since, until, 'created_at');
  } else {
    issues = await fetchAllPages(`/repos/${owner}/${repo}/issues`, accessToken, params, 500);
  }
  
  console.log(`Fetched ${issues.length} issues with smart pagination`);
  return issues;
}