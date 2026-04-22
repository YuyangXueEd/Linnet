import { Context, Hono } from 'hono';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import { cors } from 'hono/cors';
import {
  SESSION_COOKIE_NAME,
  buildCallbackUrl,
  buildGitHubAuthorizeUrl,
  buildReturnUrl,
  createAuthorizeStateToken,
  createSessionCookieValue,
  exchangeCodeForUserAccessToken,
  getAuthenticatedGitHubUser,
  getUserInstallationRepositories,
  readAuthorizeStateToken,
  readSessionCookieValue,
  requireGitHubAuthConfig,
  verifyUserCanAccessRepository,
} from './auth';
import {
  BridgeConfigError,
  BridgeBindings,
  GitHubApiError,
  createInstallationAccessToken,
  getInstallationForAuthenticatedApp,
  parseInstallationId,
  readGitHubAppConfigState,
  requireGitHubAppConfig,
} from './github';
import { DeployRequest, deployWithInstallation } from './deploy';

const SERVICE_NAME = 'linnet-setup-bridge';
const DEFAULT_CORS_ALLOWED_ORIGINS = [
  'https://yuyangxueed.github.io',
  'http://127.0.0.1:4321',
  'http://localhost:4321',
];

const app = new Hono<{ Bindings: BridgeBindings }>();

app.onError((error, c) => {
  if (error instanceof BridgeConfigError) {
    return c.json(
      {
        ok: false,
        service: SERVICE_NAME,
        error: 'bridge_config_invalid',
        message: error.message,
        missing: error.missing,
      },
      503,
    );
  }

  if (error instanceof GitHubApiError) {
    return new Response(
      JSON.stringify({
        ok: false,
        service: SERVICE_NAME,
        error: 'github_api_error',
        message: error.message,
        status: error.status,
        details: error.details,
      }),
      {
        status: error.status,
        headers: {
          'content-type': 'application/json; charset=UTF-8',
        },
      },
    );
  }

  return c.json(
    {
      ok: false,
      service: SERVICE_NAME,
      error: 'internal_error',
      message: error instanceof Error ? error.message : String(error),
    },
    500,
  );
});

function isUnsafeInstallationDeployAllowed(env: BridgeBindings): boolean {
  return env.ALLOW_UNSAFE_INSTALLATION_ID_DEPLOY?.trim().toLowerCase() === 'true';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parseOptionalRepoFromQuery(c: Context<{ Bindings: BridgeBindings }>) {
  const owner = c.req.query('owner')?.trim();
  const repo = c.req.query('repo')?.trim();
  if (!owner || !repo) return null;
  return { owner, repo };
}

function readAllowedOrigins(env: BridgeBindings): string[] {
  const configured = env.CORS_ALLOWED_ORIGINS?.split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  return configured?.length ? configured : DEFAULT_CORS_ALLOWED_ORIGINS;
}

function resolveCorsOrigin(origin: string | undefined, env: BridgeBindings): string | null {
  if (!origin) return null;
  return readAllowedOrigins(env).includes(origin) ? origin : null;
}

function parseDeployRequestBody(payload: unknown): DeployRequest {
  if (!isRecord(payload)) {
    throw new Error('Deploy payload must be a JSON object.');
  }

  const installationId = parseInstallationId(
    typeof payload.installationId === 'number' ? String(payload.installationId) : String(payload.installationId ?? ''),
  );
  if (!installationId) throw new Error('installationId must be a positive integer.');

  const repoValue = payload.repo;
  if (!isRecord(repoValue)) throw new Error('repo must be an object.');
  const owner = typeof repoValue.owner === 'string' ? repoValue.owner.trim() : '';
  const repo = typeof repoValue.repo === 'string' ? repoValue.repo.trim() : '';
  if (!owner || !repo) throw new Error('repo.owner and repo.repo are required.');

  const filesValue = payload.files;
  if (!Array.isArray(filesValue) || filesValue.length === 0) {
    throw new Error('files must be a non-empty array.');
  }
  const files = filesValue.map((file, index) => {
    if (!isRecord(file)) throw new Error(`files[${index}] must be an object.`);
    const path = typeof file.path === 'string' ? file.path.trim() : '';
    const body = typeof file.body === 'string' ? file.body : '';
    if (!path || !body) throw new Error(`files[${index}] must include non-empty path and body.`);
    return { path, body };
  });

  const secretsValue = payload.secrets;
  if (!Array.isArray(secretsValue)) throw new Error('secrets must be an array.');
  const secrets = secretsValue.map((secret, index) => {
    if (!isRecord(secret)) throw new Error(`secrets[${index}] must be an object.`);
    const name = typeof secret.name === 'string' ? secret.name.trim() : '';
    const value = typeof secret.value === 'string' ? secret.value : '';
    if (!name || !value) throw new Error(`secrets[${index}] must include non-empty name and value.`);
    return { name, value };
  });

  const commitMessage = typeof payload.commitMessage === 'string' ? payload.commitMessage : undefined;
  const autoEnableActions = typeof payload.autoEnableActions === 'boolean' ? payload.autoEnableActions : undefined;
  const workflowsToEnable =
    Array.isArray(payload.workflowsToEnable) &&
    payload.workflowsToEnable.every((item) => typeof item === 'string' && item.trim())
      ? payload.workflowsToEnable.map((item) => item.trim())
      : undefined;
  const configurePages = typeof payload.configurePages === 'boolean' ? payload.configurePages : undefined;
  const pagesSourcePath =
    payload.pagesSourcePath === '/' || payload.pagesSourcePath === '/docs'
      ? payload.pagesSourcePath
      : undefined;
  const triggerWorkflowId =
    typeof payload.triggerWorkflowId === 'string' && payload.triggerWorkflowId.trim()
      ? payload.triggerWorkflowId.trim()
      : undefined;
  const triggerWorkflowRef =
    typeof payload.triggerWorkflowRef === 'string' && payload.triggerWorkflowRef.trim()
      ? payload.triggerWorkflowRef.trim()
      : undefined;

  return {
    installationId,
    repo: { owner, repo },
    files,
    secrets,
    commitMessage,
    autoEnableActions,
    workflowsToEnable,
    configurePages,
    pagesSourcePath,
    triggerWorkflowId,
    triggerWorkflowRef,
  };
}

app.use(
  '/api/*',
  cors({
    origin: (origin, c) => resolveCorsOrigin(origin, c.env) ?? '',
    credentials: true,
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type'],
  }),
);

app.get('/', (c) =>
  c.json({
    ok: true,
    service: SERVICE_NAME,
    routes: [
      'GET /api/healthz',
      'GET /api/github/install',
      'GET /api/github/authorize',
      'GET /api/github/callback',
      'GET /api/github/session',
      'POST /api/github/logout',
      'POST /api/deploy',
    ],
  }),
);

app.get('/api/healthz', (c) =>
  c.json({
    ok: true,
    service: SERVICE_NAME,
    timestamp: new Date().toISOString(),
    githubApp: readGitHubAppConfigState(c.env),
  }),
);

app.get('/api/github/install', (c) => {
  const slug = c.env.GITHUB_APP_SLUG?.trim();
  if (!slug) {
    return c.json(
      {
        ok: false,
        error: 'github_app_slug_missing',
        message: 'Set GITHUB_APP_SLUG before using the install endpoint.',
      },
      503,
    );
  }

  return c.redirect(`https://github.com/apps/${encodeURIComponent(slug)}/installations/new`, 302);
});

app.get('/api/github/authorize', async (c) => {
  try {
    const config = requireGitHubAuthConfig(c.env);
    const installationId = parseInstallationId(c.req.query('installation_id'));
    const repo = parseOptionalRepoFromQuery(c);
    const returnTo = c.req.query('return_to')?.trim() || null;
    const redirectUri = buildCallbackUrl(c.req.url);
    const state = await createAuthorizeStateToken(config, {
      nonce: crypto.randomUUID(),
      issuedAt: Date.now(),
      installationId,
      repo,
      returnTo,
    });
    return c.redirect(buildGitHubAuthorizeUrl(config, redirectUri, state), 302);
  } catch (error) {
    if (error instanceof BridgeConfigError) {
      return c.json(
        {
          ok: false,
          error: 'bridge_config_invalid',
          message: error.message,
          missing: error.missing,
        },
        503,
      );
    }
    throw error;
  }
});

app.get('/api/github/callback', async (c) => {
  const code = c.req.query('code')?.trim();
  const stateValue = c.req.query('state')?.trim();
  if (!code || !stateValue) {
    return c.json(
      {
        ok: false,
        error: 'github_callback_invalid',
        message: 'Missing required code or state query parameter.',
      },
      400,
    );
  }

  try {
    const config = requireGitHubAuthConfig(c.env);
    const redirectUri = buildCallbackUrl(c.req.url);
    const state = await readAuthorizeStateToken(config, stateValue);
    const token = await exchangeCodeForUserAccessToken(config, code, redirectUri);
    const user = await getAuthenticatedGitHubUser(token.access_token);

    if (state.installationId && state.repo) {
      const access = await verifyUserCanAccessRepository(token.access_token, state.installationId, state.repo);
      if (!access.verified) {
        return c.json(
          {
            ok: false,
            error: 'github_user_repo_access_denied',
            message: `The authorized user cannot access ${state.repo.owner}/${state.repo.repo} through installation ${state.installationId}.`,
          },
          403,
        );
      }
    }

    const sessionValue = await createSessionCookieValue(config, token, user);
    setCookie(c, SESSION_COOKIE_NAME, sessionValue, {
      httpOnly: true,
      sameSite: 'None',
      secure: true,
      path: '/',
      maxAge: 8 * 60 * 60,
    });

    const successReturn = buildReturnUrl(state.returnTo, {
      github_auth: 'success',
      ...(state.installationId ? { installation_id: String(state.installationId) } : {}),
    });
    return c.redirect(successReturn, 302);
  } catch (error) {
    if (error instanceof BridgeConfigError) {
      return c.json(
        {
          ok: false,
          error: 'bridge_config_invalid',
          message: error.message,
          missing: error.missing,
        },
        503,
      );
    }

    if (error instanceof GitHubApiError) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: 'github_api_error',
          message: error.message,
          status: error.status,
          details: error.details,
        }),
        {
          status: error.status,
          headers: {
            'content-type': 'application/json; charset=UTF-8',
          },
        },
      );
    }

    return c.json(
      {
        ok: false,
        error: 'github_callback_failed',
        message: error instanceof Error ? error.message : String(error),
      },
      400,
    );
  }
});

app.get('/api/github/session', async (c) => {
  const configState = readGitHubAppConfigState(c.env);
  const installationId = parseInstallationId(c.req.query('installation_id'));
  const requestedRepo = parseOptionalRepoFromQuery(c);
  let userSession: {
    authenticated: boolean;
    user: { id: number; login: string; avatarUrl: string | null; htmlUrl: string | null } | null;
    repositoryAccess: { checked: boolean; verified: boolean; repositoryId: number | null };
    repositories: { totalCount: number; truncated: boolean; items: Array<{ id: number; owner: string; repo: string; fullName: string; htmlUrl: string | null }> };
    authWarning: string | null;
  } = {
    authenticated: false,
    user: null,
    repositoryAccess: { checked: false, verified: false, repositoryId: null },
    repositories: { totalCount: 0, truncated: false, items: [] },
    authWarning: null,
  };

  const sessionCookie = getCookie(c, SESSION_COOKIE_NAME);
  if (sessionCookie) {
    try {
      const authConfig = requireGitHubAuthConfig(c.env);
      const session = await readSessionCookieValue(authConfig, sessionCookie);
      userSession = {
        authenticated: true,
        user: session.user,
        repositoryAccess: { checked: false, verified: false, repositoryId: null },
        repositories: { totalCount: 0, truncated: false, items: [] },
        authWarning: null,
      };

      if (installationId) {
        const repositories = await getUserInstallationRepositories(session.token.accessToken, installationId);
        const items = repositories.repositories.map((repository) => ({
          id: repository.id,
          owner: repository.owner?.login ?? '',
          repo: repository.name,
          fullName: repository.full_name,
          htmlUrl: repository.html_url ?? null,
        }));
        userSession.repositories = {
          totalCount: repositories.total_count,
          truncated: repositories.total_count > items.length,
          items,
        };

        if (requestedRepo) {
          const fullName = `${requestedRepo.owner}/${requestedRepo.repo}`.toLowerCase();
          const match = items.find((repository) => repository.fullName.toLowerCase() === fullName);
          userSession.repositoryAccess = {
            checked: true,
            verified: Boolean(match),
            repositoryId: match?.id ?? null,
          };
        }
      }
    } catch (error) {
      userSession.authWarning = error instanceof Error ? error.message : String(error);
      deleteCookie(c, SESSION_COOKIE_NAME, { path: '/' });
    }
  }

  if (!installationId) {
    return c.json({
      ok: true,
      service: SERVICE_NAME,
      configured: configState.missing.length === 0,
      githubApp: configState,
      userSession,
      installation: null,
      note:
        'No installation was queried. Pass ?installation_id=<id> after a GitHub App install if you want the bridge to inspect that installation.',
    });
  }

  try {
    const config = requireGitHubAppConfig(c.env);
    const installation = await getInstallationForAuthenticatedApp(config, installationId);
    const installationToken = await createInstallationAccessToken(config, installationId);

    return c.json({
      ok: true,
      service: SERVICE_NAME,
      configured: true,
      githubApp: configState,
      userSession,
      installation: {
        id: installation.id,
        appId: installation.app_id,
        appSlug: installation.app_slug,
        accountLogin: installation.account?.login ?? null,
        accountType: installation.account?.type ?? null,
        accountUrl: installation.account?.html_url ?? null,
        targetType: installation.target_type,
        repositorySelection: installation.repository_selection,
        htmlUrl: installation.html_url ?? null,
        repositoriesUrl: installation.repositories_url ?? null,
        suspendedAt: installation.suspended_at ?? null,
        createdAt: installation.created_at ?? null,
        updatedAt: installation.updated_at ?? null,
        permissions: installation.permissions,
      },
      installationToken: {
        expiresAt: installationToken.expires_at,
        permissions: installationToken.permissions ?? installation.permissions,
      },
      warning:
        'GitHub warns that setup_url installation_id values can be spoofed. Treat this endpoint as an installation probe, not as proof of user identity.',
    });
  } catch (error) {
    if (error instanceof BridgeConfigError) {
      return c.json(
        {
          ok: false,
          error: 'bridge_config_invalid',
          message: error.message,
          missing: error.missing,
          githubApp: configState,
        },
        503,
      );
    }

    if (error instanceof GitHubApiError) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: 'github_api_error',
          message: error.message,
          status: error.status,
          details: error.details,
        }),
        {
          status: error.status,
          headers: {
            'content-type': 'application/json; charset=UTF-8',
          },
        },
      );
    }

    throw error;
  }
});

app.post('/api/github/logout', (c) => {
  deleteCookie(c, SESSION_COOKIE_NAME, { path: '/' });
  return c.json({
    ok: true,
    service: SERVICE_NAME,
    disconnected: true,
  });
});

app.post('/api/deploy', async (c) => {
  if (!isUnsafeInstallationDeployAllowed(c.env)) {
    const sessionCookie = getCookie(c, SESSION_COOKIE_NAME);
    if (!sessionCookie) {
      return c.json(
        {
          ok: false,
          error: 'safe_auth_required',
          message:
            'No trusted GitHub user session is present. Authorize via /api/github/authorize, or explicitly enable ALLOW_UNSAFE_INSTALLATION_ID_DEPLOY=true for controlled testing only.',
        },
        401,
      );
    }
  }

  let request: DeployRequest;
  try {
    request = parseDeployRequestBody(await c.req.json());
  } catch (error) {
    return c.json(
      {
        ok: false,
        error: 'invalid_deploy_payload',
        message: error instanceof Error ? error.message : String(error),
      },
      400,
    );
  }

  try {
    const config = requireGitHubAppConfig(c.env);
    const authConfig = requireGitHubAuthConfig(c.env);
    const sessionCookie = getCookie(c, SESSION_COOKIE_NAME);
    let usedUnsafeMode = false;

    if (sessionCookie) {
      const session = await readSessionCookieValue(authConfig, sessionCookie);
      const access = await verifyUserCanAccessRepository(
        session.token.accessToken,
        request.installationId,
        request.repo,
      );
      if (!access.verified) {
        return c.json(
          {
            ok: false,
            error: 'github_user_repo_access_denied',
            message: `The authenticated GitHub user cannot access ${request.repo.owner}/${request.repo.repo} through installation ${request.installationId}.`,
          },
          403,
        );
      }
    } else if (isUnsafeInstallationDeployAllowed(c.env)) {
      usedUnsafeMode = true;
    } else {
      return c.json(
        {
          ok: false,
          error: 'safe_auth_required',
          message:
            'A trusted GitHub user session is required for deploy unless you explicitly enable ALLOW_UNSAFE_INSTALLATION_ID_DEPLOY=true for controlled testing.',
        },
        401,
      );
    }

    const result = await deployWithInstallation(config, request);
    return c.json({
      ok: true,
      service: SERVICE_NAME,
      warning: usedUnsafeMode
        ? 'This deploy used installation_id without verified user authorization. Do not expose this mode publicly.'
        : null,
      result,
    });
  } catch (error) {
    if (error instanceof BridgeConfigError) {
      return c.json(
        {
          ok: false,
          error: 'bridge_config_invalid',
          message: error.message,
          missing: error.missing,
          githubApp: readGitHubAppConfigState(c.env),
        },
        503,
      );
    }

    if (error instanceof GitHubApiError) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: 'github_api_error',
          message: error.message,
          status: error.status,
          details: error.details,
        }),
        {
          status: error.status,
          headers: {
            'content-type': 'application/json; charset=UTF-8',
          },
        },
      );
    }

    throw error;
  }
});

export default app;
