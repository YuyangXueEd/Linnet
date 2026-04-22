import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildBridgeUrl,
  buildCleanReturnTo,
  deployViaBridge,
  fetchBridgeSession,
  normalizeBridgeUrl,
  readInstallationIdFromLocation,
} from '../src/components/wizard/setupBridge.js';

test('normalizeBridgeUrl trims trailing slashes', () => {
  assert.equal(
    normalizeBridgeUrl('https://bridge.example.com///'),
    'https://bridge.example.com',
  );
});

test('buildBridgeUrl joins path and query params safely', () => {
  const url = buildBridgeUrl('https://bridge.example.com/', '/api/github/authorize', {
    installation_id: 42,
    owner: 'octocat',
    repo: 'linnet',
  });

  const parsed = new URL(url);
  assert.equal(parsed.origin, 'https://bridge.example.com');
  assert.equal(parsed.pathname, '/api/github/authorize');
  assert.equal(parsed.searchParams.get('installation_id'), '42');
  assert.equal(parsed.searchParams.get('owner'), 'octocat');
  assert.equal(parsed.searchParams.get('repo'), 'linnet');
});

test('readInstallationIdFromLocation reads numeric ids only', () => {
  assert.equal(
    readInstallationIdFromLocation(new URL('https://example.com/setup?installation_id=123')),
    123,
  );
  assert.equal(
    readInstallationIdFromLocation(new URL('https://example.com/setup?installation_id=abc')),
    null,
  );
});

test('buildCleanReturnTo removes github_auth but keeps installation_id', () => {
  const cleaned = new URL(
    buildCleanReturnTo('https://example.com/setup?installation_id=77&github_auth=success'),
  );

  assert.equal(cleaned.searchParams.get('installation_id'), '77');
  assert.equal(cleaned.searchParams.get('github_auth'), null);
});

test('fetchBridgeSession surfaces text errors from non-JSON responses', async () => {
  await assert.rejects(
    fetchBridgeSession({
      bridgeUrl: 'https://bridge.example.com',
      fetchImpl: async () =>
        new Response('Internal Server Error', {
          status: 500,
          headers: {
            'content-type': 'text/plain; charset=utf-8',
          },
        }),
    }),
    /Internal Server Error/,
  );
});

test('deployViaBridge rejects when success response is not JSON', async () => {
  await assert.rejects(
    deployViaBridge({
      bridgeUrl: 'https://bridge.example.com',
      payload: { hello: 'world' },
      fetchImpl: async () =>
        new Response('ok', {
          status: 200,
          headers: {
            'content-type': 'text/plain; charset=utf-8',
          },
        }),
    }),
    /non-JSON response: ok/,
  );
});
