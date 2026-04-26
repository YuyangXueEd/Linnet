# Linnet Setup Bridge

This directory contains the serverless backend scaffold for Linnet's lower-friction setup flow.

The goal is narrow on purpose:

- keep Linnet's public site on GitHub Pages
- keep digest generation on GitHub Actions
- move sensitive setup-time GitHub operations out of the browser

## Planned responsibilities

- GitHub App installation flow
- installation-token exchange
- writing generated config files to the target repo
- writing GitHub Actions secrets
- enabling Actions and workflows
- configuring GitHub Pages
- updating the repository About / Website link to the Pages URL
- triggering the first digest run

## Current scaffold

Implemented today:

- `GET /`
- `GET /api/healthz`
- `GET /api/github/install`
- `GET /api/github/authorize`
- `GET /api/github/callback`
- `GET /api/github/session`
- `POST /api/deploy`

The bridge can now:

- inspect GitHub App config readiness
- generate an app JWT
- query a specific installation with `?installation_id=<id>`
- mint an installation access token and return non-secret metadata about it
- start the GitHub App web authorization flow
- exchange OAuth `code` for a GitHub App user access token
- store that user session in an encrypted HttpOnly cookie
- verify whether the authenticated user can access a target installation repository
- write generated config files into a repo
- write GitHub Actions secrets
- enable repo Actions and workflows
- configure GitHub Pages for workflow-based publishing
- update the repository About / Website link to the Pages URL when permissions allow it
- trigger the first digest workflow

The deploy route now supports the safer browser-based flow by default:

- recommended: GitHub App install + `/api/github/authorize` + encrypted session cookie
- temporary fallback: `ALLOW_UNSAFE_INSTALLATION_ID_DEPLOY=true` for controlled testing only

## Local development

1. Install Node.js and npm on the machine that will run the Worker toolchain.
2. Copy `.dev.vars.example` to `.dev.vars`.
3. Fill in `GITHUB_APP_SLUG` at minimum.
   For GitHub App auth and installation probing, also fill in:
   - `GITHUB_APP_ID`
   - `GITHUB_APP_CLIENT_ID`
   - `GITHUB_APP_CLIENT_SECRET`
   - `GITHUB_APP_PRIVATE_KEY`
   - `SESSION_SECRET`
     Use a long random string that is generated once and kept only on the Worker side. It is used to encrypt the OAuth state and browser session cookie.
   If you want to exercise the current temporary deploy route in a controlled environment, also set:
   - `ALLOW_UNSAFE_INSTALLATION_ID_DEPLOY=true`
4. Install dependencies:

```bash
npm install
```

5. Start local dev:

```bash
npm run dev
```

6. Typecheck:

```bash
npm run check
```

7. Run tests:

```bash
npm test
```

## Environment variables

- `GITHUB_APP_SLUG`
- `GITHUB_APP_ID`
- `GITHUB_APP_CLIENT_ID`
- `GITHUB_APP_CLIENT_SECRET`
- `GITHUB_APP_PRIVATE_KEY`
- `CORS_ALLOWED_ORIGINS`
- `SESSION_SECRET`
- `ALLOW_UNSAFE_INSTALLATION_ID_DEPLOY`

`CORS_ALLOWED_ORIGINS` should list the frontend origins that are allowed to call the bridge with cookies, for example:

- `https://yuyangxueed.github.io`
- `http://127.0.0.1:4321`
- `http://localhost:4321`

## Current endpoint behavior

- `GET /api/healthz`
  - returns service health plus GitHub App config readiness
- `GET /api/github/install`
  - redirects the browser to the GitHub App installation page
- `GET /api/github/authorize`
  - redirects the browser into the GitHub App web authorization flow
- `GET /api/github/callback`
  - exchanges the OAuth `code` for a user access token
  - stores an encrypted HttpOnly session cookie
  - optionally verifies repository access for the requested installation
- `GET /api/github/session`
  - without query params: returns config readiness and user-session state
  - with `?installation_id=<id>`: fetches installation metadata and probes installation-token creation
  - with `owner` + `repo`: also checks whether the authenticated GitHub user can access that repo in the installation
- `POST /api/deploy`
  - validates a deploy payload
  - prefers a verified GitHub user session when present
  - otherwise returns `401` unless you explicitly enable the temporary unsafe mode
  - uses an installation-scoped token for the target repository
  - writes files, secrets, Actions settings, Pages settings, repository homepage metadata, and dispatches `daily.yml`
  - can still be forced into installation-id-only mode with `ALLOW_UNSAFE_INSTALLATION_ID_DEPLOY=true`

Important:

- GitHub warns that `installation_id` passed to an app's `setup_url` can be spoofed.
- `GET /api/github/session` is therefore an installation probe, not a trustworthy user-auth session.
- `POST /api/deploy` now requires a trusted GitHub user session by default, so the bridge does not silently treat a spoofable `installation_id` as trusted.
- `ALLOW_UNSAFE_INSTALLATION_ID_DEPLOY=true` still exists, but only as a controlled testing escape hatch and should not be exposed publicly.

## Required real-world configuration

The secure flow depends on these real GitHub App and Worker settings existing outside the repo:

1. Register a public callback URL in the GitHub App settings that exactly matches your Worker callback endpoint.
2. Set the Worker secrets for:
   - `GITHUB_APP_CLIENT_SECRET`
   - `GITHUB_APP_PRIVATE_KEY`
   - `SESSION_SECRET`
3. Decide the public bridge URL that the setup wizard will call.

## Notes

- This bridge is intentionally separate from `astro/` so the setup backend can evolve without tangling the public site build.
- The user-facing digest site should continue to deploy to GitHub Pages.
- v1 is expected to stay stateless unless callback/session handling proves otherwise.
