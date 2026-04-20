// @ts-check

/**
 * @typedef {{ id: number, owner: string, repo: string, fullName: string, htmlUrl: string, permissions?: Record<string, string> }} AccessibleRepo
 * @typedef {{ login: string, avatarUrl: string, htmlUrl: string, name?: string }} GitHubUser
 */

const GITHUB_API_BASE = 'https://api.github.com';
const API_VERSION = '2022-11-28';
const REQUIRED_SCOPES = ['contents:write', 'metadata:read', 'actions:write', 'secrets:write'];

/**
 * @param {string} token
 * @returns {Record<string, string>}
 */
function githubHeaders(token) {
  return {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'X-GitHub-Api-Version': API_VERSION,
  };
}

/**
 * @param {Response} response
 * @returns {Promise<Error>}
 */
async function parseResponseError(response) {
  let message = `${response.status} ${response.statusText}`;
  try {
    const data = await response.json();
    if (typeof data?.message === 'string') message = data.message;
    else if (typeof data?.error === 'string') message = data.error;
  } catch {
    // Fall back to status text.
  }
  return new Error(message);
}

/**
 * @param {string} token
 * @param {string} path
 * @param {typeof fetch} [fetchImpl]
 * @returns {Promise<any>}
 */
async function githubGet(token, path, fetchImpl = fetch) {
  const response = await fetchImpl(`${GITHUB_API_BASE}${path}`, {
    headers: githubHeaders(token),
  });
  if (!response.ok) throw await parseResponseError(response);
  return response.json();
}

export function getRequiredScopesDisplay() {
  return REQUIRED_SCOPES.slice();
}

/**
 * @param {{ token: string, fetchImpl?: typeof fetch }} options
 * @returns {Promise<AccessibleRepo[]>}
 */
export async function listAccessibleRepositories(options) {
  const repos = [];
  let page = 1;
  while (page <= 5) {
    const data = await githubGet(
      options.token,
      `/user/repos?per_page=100&affiliation=owner,collaborator,organization_member&page=${page}`,
      options.fetchImpl,
    );
    if (!Array.isArray(data) || data.length === 0) break;
    for (const repo of data) {
      repos.push({
        id: repo.id,
        owner: repo.owner?.login ?? '',
        repo: repo.name ?? '',
        fullName: repo.full_name ?? `${repo.owner?.login ?? ''}/${repo.name ?? ''}`,
        htmlUrl: repo.html_url ?? '',
        permissions: repo.permissions ?? {},
      });
    }
    if (data.length < 100) break;
    page += 1;
  }
  return repos.sort((a, b) => a.fullName.localeCompare(b.fullName));
}

/**
 * @param {{ token: string, fetchImpl?: typeof fetch }} options
 * @returns {Promise<GitHubUser>}
 */
export async function getCurrentUser(options) {
  const data = await githubGet(options.token, '/user', options.fetchImpl);
  return {
    login: data.login,
    avatarUrl: data.avatar_url,
    htmlUrl: data.html_url,
    name: data.name,
  };
}

/**
 * Basic sanity check on a token string before hitting the network.
 * Fine-grained PATs start with `github_pat_`; classic PATs start with `ghp_`.
 * @param {string} token
 * @returns {boolean}
 */
export function looksLikePat(token) {
  const t = token.trim();
  return /^(github_pat_|ghp_|gho_|ghu_|ghs_|ghr_)[A-Za-z0-9_]+$/.test(t);
}
