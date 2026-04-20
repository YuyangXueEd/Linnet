import test from 'node:test';
import assert from 'node:assert/strict';

import {
  looksLikePat,
  getRequiredScopesDisplay,
  listAccessibleRepositories,
  getCurrentUser,
} from '../src/components/wizard/githubAuth.js';

function jsonResponse(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 400 ? 'Bad Request' : 'OK',
    async json() {
      return body;
    },
  };
}

test('looksLikePat accepts fine-grained and classic PATs', () => {
  assert.ok(looksLikePat('github_pat_11ABCDE'));
  assert.ok(looksLikePat('ghp_1234567890abcdef'));
  assert.ok(looksLikePat('ghu_tokenvalue'));
  assert.ok(looksLikePat('ghs_tokenvalue'));
  assert.ok(looksLikePat('ghr_tokenvalue'));
  assert.ok(looksLikePat('gho_tokenvalue'));
});

test('looksLikePat rejects invalid tokens', () => {
  assert.ok(!looksLikePat(''));
  assert.ok(!looksLikePat('not-a-token'));
  assert.ok(!looksLikePat('token123'));
  assert.ok(!looksLikePat('glpat-something'));
});

test('getRequiredScopesDisplay returns expected scopes', () => {
  const scopes = getRequiredScopesDisplay();
  assert.ok(Array.isArray(scopes));
  assert.ok(scopes.includes('contents:write'));
  assert.ok(scopes.includes('actions:write'));
  assert.ok(scopes.includes('secrets:write'));
});

test('listAccessibleRepositories paginates /user/repos', async () => {
  const page1 = Array.from({ length: 2 }, (_, i) => ({
    id: i + 1,
    name: `repo-${i + 1}`,
    full_name: `octo/repo-${i + 1}`,
    html_url: `https://github.com/octo/repo-${i + 1}`,
    owner: { login: 'octo' },
    permissions: { push: true },
  }));

  const fetchImpl = async (url) => {
    assert.ok(url.includes('/user/repos'), `Unexpected URL: ${url}`);
    return jsonResponse(200, page1);
  };

  const repos = await listAccessibleRepositories({ token: 'ghp_test', fetchImpl });
  assert.deepEqual(
    repos.map((r) => r.fullName),
    ['octo/repo-1', 'octo/repo-2'],
  );
});

test('getCurrentUser maps GitHub API fields', async () => {
  const fetchImpl = async () =>
    jsonResponse(200, {
      login: 'octocat',
      avatar_url: 'https://github.com/images/error/octocat.gif',
      html_url: 'https://github.com/octocat',
      name: 'The Octocat',
    });

  const user = await getCurrentUser({ token: 'ghp_test', fetchImpl });
  assert.equal(user.login, 'octocat');
  assert.equal(user.name, 'The Octocat');
  assert.ok(user.avatarUrl.startsWith('https://'));
});
