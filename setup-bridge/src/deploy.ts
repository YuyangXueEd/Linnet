import { GitHubApiError, GitHubAppConfig, createInstallationAccessToken } from './github';

const GITHUB_API_BASE = 'https://api.github.com';
const GITHUB_API_VERSION = '2026-03-10';
const DEFAULT_COMMIT_MESSAGE = 'chore: configure Linnet via setup bridge';
const DEFAULT_WORKFLOWS = ['daily.yml', 'weekly.yml', 'monthly.yml', 'pages.yml'];

export type DeployFile = {
  path: string;
  body: string;
};

export type DeploySecret = {
  name: string;
  value: string;
};

export type RepoRef = {
  owner: string;
  repo: string;
};

export type DeployRequest = {
  installationId: number;
  repo: RepoRef;
  files: DeployFile[];
  secrets: DeploySecret[];
  commitMessage?: string;
  autoEnableActions?: boolean;
  workflowsToEnable?: string[];
  configurePages?: boolean;
  pagesSourcePath?: '/' | '/docs';
  triggerWorkflowId?: string;
  triggerWorkflowRef?: string;
};

export type DeployResult = {
  repo: {
    owner: string;
    repo: string;
    defaultBranch: string;
    htmlUrl: string;
  };
  committedPaths: string[];
  writtenSecrets: string[];
  actions: {
    attempted: boolean;
    enabled: boolean;
    enabledWorkflows: string[];
  };
  pages: {
    attempted: boolean;
    status: 'created' | 'updated' | 'unchanged' | 'skipped';
    htmlUrl: string | null;
    sourceBranch: string | null;
    sourcePath: string | null;
    buildType: string | null;
  };
  repositoryHomepage: {
    attempted: boolean;
    status: 'updated' | 'unchanged' | 'skipped' | 'failed';
    htmlUrl: string | null;
    errorMessage: string | null;
  };
  workflowDispatch: {
    attempted: boolean;
    workflowId: string | null;
    ref: string | null;
    triggered: boolean;
    errorMessage: string | null;
    workflowUrl: string | null;
  };
};

type RepoInfo = {
  id: number;
  name: string;
  full_name: string;
  default_branch?: string;
  html_url?: string;
  homepage?: string | null;
};

type GitReference = {
  object?: {
    sha?: string;
    type?: string;
  };
};

type GitCommit = {
  sha?: string;
  tree?: {
    sha?: string;
  };
};

type GitBlob = {
  sha?: string;
};

type GitTree = {
  sha?: string;
};

type GitCreatedCommit = {
  sha?: string;
};

type RepoSecretPublicKey = {
  key: string;
  key_id: string;
};

type PagesSite = {
  html_url?: string;
  build_type?: string;
  source?: {
    branch?: string;
    path?: string;
  };
};

type InstallationAccessTokenResponse = {
  token: string;
  expires_at: string;
  permissions?: Record<string, string>;
};

function githubHeaders(token: string): Record<string, string> {
  return {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'User-Agent': 'linnet-setup-bridge',
    'X-GitHub-Api-Version': GITHUB_API_VERSION,
    'Content-Type': 'application/json',
  };
}

async function parseGitHubError(response: Response): Promise<GitHubApiError> {
  const text = await response.text();
  let details: unknown = null;
  try {
    details = text ? JSON.parse(text) : null;
  } catch {
    details = text || null;
  }

  let message = `${response.status} ${response.statusText}`;
  if (details && typeof details === 'object' && details !== null && 'message' in details) {
    const detailMessage = (details as { message?: unknown }).message;
    if (typeof detailMessage === 'string' && detailMessage) message = detailMessage;
  }

  return new GitHubApiError(message, response.status, details);
}

async function githubInstallationRequest<T>(
  token: string,
  path: string,
  init: RequestInit = {},
  fetchImpl: typeof fetch = fetch,
): Promise<T | null> {
  const response = await fetchImpl(`${GITHUB_API_BASE}${path}`, {
    ...init,
    headers: {
      ...githubHeaders(token),
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) throw await parseGitHubError(response);
  if (response.status === 204) return null;
  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) return null;
  return (await response.json()) as T;
}

export function utf8ToBase64(input: string): string {
  return Buffer.from(new TextEncoder().encode(input)).toString('base64');
}

export function buildDefaultPagesUrl(owner: string, repo: string): string {
  const isUserSiteRepo = repo.toLowerCase() === `${owner.toLowerCase()}.github.io`;
  return `https://${owner}.github.io${isUserSiteRepo ? '/' : `/${repo}/`}`;
}

export function buildWorkflowUrl(repoHtmlUrl: string, workflowId: string): string {
  return `${repoHtmlUrl.replace(/\/+$/, '')}/actions/workflows/${encodeURIComponent(workflowId)}`;
}

function normalizeComparableUrl(value: string | null | undefined): string {
  return (value ?? '').trim().replace(/\/+$/, '');
}

function decodeBase64(value: string): Uint8Array {
  return new Uint8Array(Buffer.from(value, 'base64'));
}

function encodeBase64(value: Uint8Array): string {
  return Buffer.from(value).toString('base64');
}

async function encryptSecretForGitHub(value: string, base64PublicKey: string): Promise<string> {
  const tweetsodiumModule = (await import('tweetsodium')) as typeof import('tweetsodium') & {
    'module.exports'?: { seal(message: Uint8Array, publicKey: Uint8Array): Uint8Array };
  };
  const tweetsodium = (
    tweetsodiumModule.default ??
    tweetsodiumModule['module.exports'] ??
    tweetsodiumModule
  ) as { seal(message: Uint8Array, publicKey: Uint8Array): Uint8Array };
  const publicKey = decodeBase64(base64PublicKey);
  const message = new TextEncoder().encode(value);
  const encrypted = tweetsodium.seal(message, publicKey);
  return encodeBase64(encrypted);
}

async function getScopedInstallationToken(
  config: GitHubAppConfig,
  installationId: number,
  repoName: string,
  fetchImpl: typeof fetch,
): Promise<InstallationAccessTokenResponse> {
  return createInstallationAccessToken(config, installationId, {
    repositories: [repoName],
  }, fetchImpl);
}

async function getRepository(
  token: string,
  repo: RepoRef,
  fetchImpl: typeof fetch,
): Promise<RepoInfo> {
  const data = await githubInstallationRequest<RepoInfo>(token, `/repos/${repo.owner}/${repo.repo}`, {}, fetchImpl);
  if (!data) throw new GitHubApiError('Repository metadata request returned no content', 500);
  return data;
}

async function upsertRepositoryFiles(
  token: string,
  repo: RepoRef,
  defaultBranch: string,
  files: DeployFile[],
  commitMessage: string,
  fetchImpl: typeof fetch,
): Promise<string[]> {
  const encodedBranch = defaultBranch.split('/').map((part) => encodeURIComponent(part)).join('/');
  const headRef = await githubInstallationRequest<GitReference>(
    token,
    `/repos/${repo.owner}/${repo.repo}/git/ref/heads/${encodedBranch}`,
    {},
    fetchImpl,
  );
  const headCommitSha = headRef?.object?.sha ?? null;
  if (!headCommitSha) {
    throw new GitHubApiError(`Could not resolve HEAD for ${repo.owner}/${repo.repo}@${defaultBranch}.`, 500);
  }

  const headCommit = await githubInstallationRequest<GitCommit>(
    token,
    `/repos/${repo.owner}/${repo.repo}/git/commits/${encodeURIComponent(headCommitSha)}`,
    {},
    fetchImpl,
  );
  const baseTreeSha = headCommit?.tree?.sha ?? null;
  if (!baseTreeSha) {
    throw new GitHubApiError(`Could not resolve the base tree for ${repo.owner}/${repo.repo}@${defaultBranch}.`, 500);
  }

  const tree = [];
  for (const file of files) {
    const blob = await githubInstallationRequest<GitBlob>(
      token,
      `/repos/${repo.owner}/${repo.repo}/git/blobs`,
      {
        method: 'POST',
        body: JSON.stringify({
          content: file.body,
          encoding: 'utf-8',
        }),
      },
      fetchImpl,
    );
    const blobSha = blob?.sha ?? null;
    if (!blobSha) {
      throw new GitHubApiError(`Could not create blob for ${file.path}.`, 500);
    }
    tree.push({
      path: file.path,
      mode: '100644',
      type: 'blob',
      sha: blobSha,
    });
  }

  const nextTree = await githubInstallationRequest<GitTree>(
    token,
    `/repos/${repo.owner}/${repo.repo}/git/trees`,
    {
      method: 'POST',
      body: JSON.stringify({
        base_tree: baseTreeSha,
        tree,
      }),
    },
    fetchImpl,
  );
  const nextTreeSha = nextTree?.sha ?? null;
  if (!nextTreeSha) {
    throw new GitHubApiError(`Could not create the next tree for ${repo.owner}/${repo.repo}.`, 500);
  }

  const nextCommit = await githubInstallationRequest<GitCreatedCommit>(
    token,
    `/repos/${repo.owner}/${repo.repo}/git/commits`,
    {
      method: 'POST',
      body: JSON.stringify({
        message: commitMessage,
        tree: nextTreeSha,
        parents: [headCommitSha],
      }),
    },
    fetchImpl,
  );
  const nextCommitSha = nextCommit?.sha ?? null;
  if (!nextCommitSha) {
    throw new GitHubApiError(`Could not create the next commit for ${repo.owner}/${repo.repo}.`, 500);
  }

  await githubInstallationRequest(
    token,
    `/repos/${repo.owner}/${repo.repo}/git/refs/heads/${encodedBranch}`,
    {
      method: 'PATCH',
      body: JSON.stringify({
        sha: nextCommitSha,
        force: false,
      }),
    },
    fetchImpl,
  );

  return files.map((file) => file.path);
}

async function upsertRepositorySecrets(
  token: string,
  repo: RepoRef,
  secrets: DeploySecret[],
  fetchImpl: typeof fetch,
): Promise<string[]> {
  if (secrets.length === 0) return [];

  const publicKey = await githubInstallationRequest<RepoSecretPublicKey>(
    token,
    `/repos/${repo.owner}/${repo.repo}/actions/secrets/public-key`,
    {},
    fetchImpl,
  );
  if (!publicKey) throw new GitHubApiError('Repository secret public key request returned no content', 500);

  const writtenSecrets: string[] = [];
  for (const secret of secrets) {
    const encryptedValue = await encryptSecretForGitHub(secret.value, publicKey.key);
    await githubInstallationRequest(
      token,
      `/repos/${repo.owner}/${repo.repo}/actions/secrets/${encodeURIComponent(secret.name)}`,
      {
        method: 'PUT',
        body: JSON.stringify({
          encrypted_value: encryptedValue,
          key_id: publicKey.key_id,
        }),
      },
      fetchImpl,
    );
    writtenSecrets.push(secret.name);
  }

  return writtenSecrets;
}

async function setRepositoryActionsEnabled(
  token: string,
  repo: RepoRef,
  fetchImpl: typeof fetch,
): Promise<void> {
  await githubInstallationRequest(
    token,
    `/repos/${repo.owner}/${repo.repo}/actions/permissions`,
    {
      method: 'PUT',
      body: JSON.stringify({ enabled: true }),
    },
    fetchImpl,
  );
}

async function enableWorkflow(
  token: string,
  repo: RepoRef,
  workflowId: string,
  fetchImpl: typeof fetch,
): Promise<void> {
  await githubInstallationRequest(
    token,
    `/repos/${repo.owner}/${repo.repo}/actions/workflows/${encodeURIComponent(workflowId)}/enable`,
    {
      method: 'PUT',
    },
    fetchImpl,
  );
}

async function ensurePagesSite(
  token: string,
  repo: RepoRef,
  defaultBranch: string,
  sourcePath: '/' | '/docs',
  fetchImpl: typeof fetch,
): Promise<DeployResult['pages']> {
  const body = {
    build_type: 'workflow',
    source: {
      branch: defaultBranch,
      path: sourcePath,
    },
  };

  try {
    const existing = await githubInstallationRequest<PagesSite>(
      token,
      `/repos/${repo.owner}/${repo.repo}/pages`,
      {},
      fetchImpl,
    );

    const isAlreadyConfigured =
      existing?.build_type === 'workflow' &&
      existing?.source?.branch === defaultBranch &&
      existing?.source?.path === sourcePath;

    if (isAlreadyConfigured) {
      return {
        attempted: true,
        status: 'unchanged',
        htmlUrl: existing?.html_url ?? buildDefaultPagesUrl(repo.owner, repo.repo),
        sourceBranch: existing?.source?.branch ?? defaultBranch,
        sourcePath: existing?.source?.path ?? sourcePath,
        buildType: existing?.build_type ?? 'workflow',
      };
    }

    await githubInstallationRequest(
      token,
      `/repos/${repo.owner}/${repo.repo}/pages`,
      {
        method: 'PUT',
        body: JSON.stringify(body),
      },
      fetchImpl,
    );

    return {
      attempted: true,
      status: 'updated',
      htmlUrl: existing?.html_url ?? buildDefaultPagesUrl(repo.owner, repo.repo),
      sourceBranch: defaultBranch,
      sourcePath,
      buildType: 'workflow',
    };
  } catch (error) {
    if (!(error instanceof GitHubApiError) || error.status !== 404) throw error;

    const created = await githubInstallationRequest<PagesSite>(
      token,
      `/repos/${repo.owner}/${repo.repo}/pages`,
      {
        method: 'POST',
        body: JSON.stringify(body),
      },
      fetchImpl,
    );

    return {
      attempted: true,
      status: 'created',
      htmlUrl: created?.html_url ?? buildDefaultPagesUrl(repo.owner, repo.repo),
      sourceBranch: created?.source?.branch ?? defaultBranch,
      sourcePath: created?.source?.path ?? sourcePath,
      buildType: created?.build_type ?? 'workflow',
    };
  }
}

async function updateRepositoryHomepage(
  token: string,
  repo: RepoRef,
  homepageUrl: string | null,
  currentHomepage: string | null | undefined,
  fetchImpl: typeof fetch,
): Promise<DeployResult['repositoryHomepage']> {
  const nextHomepage = homepageUrl?.trim() ?? '';
  if (!nextHomepage) {
    return {
      attempted: false,
      status: 'skipped',
      htmlUrl: null,
      errorMessage: null,
    };
  }

  if (normalizeComparableUrl(currentHomepage) === normalizeComparableUrl(nextHomepage)) {
    return {
      attempted: false,
      status: 'unchanged',
      htmlUrl: nextHomepage,
      errorMessage: null,
    };
  }

  try {
    await githubInstallationRequest<RepoInfo>(
      token,
      `/repos/${repo.owner}/${repo.repo}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ homepage: nextHomepage }),
      },
      fetchImpl,
    );

    return {
      attempted: true,
      status: 'updated',
      htmlUrl: nextHomepage,
      errorMessage: null,
    };
  } catch (error) {
    return {
      attempted: true,
      status: 'failed',
      htmlUrl: nextHomepage,
      errorMessage: error instanceof Error ? error.message : String(error),
    };
  }
}

async function triggerWorkflowDispatch(
  token: string,
  repo: RepoRef,
  workflowId: string,
  ref: string,
  fetchImpl: typeof fetch,
): Promise<void> {
  await githubInstallationRequest(
    token,
    `/repos/${repo.owner}/${repo.repo}/actions/workflows/${encodeURIComponent(workflowId)}/dispatches`,
    {
      method: 'POST',
      body: JSON.stringify({ ref }),
    },
    fetchImpl,
  );
}

export async function deployWithInstallation(
  config: GitHubAppConfig,
  request: DeployRequest,
  fetchImpl: typeof fetch = fetch,
): Promise<DeployResult> {
  const installationToken = await getScopedInstallationToken(
    config,
    request.installationId,
    request.repo.repo,
    fetchImpl,
  );

  const repoInfo = await getRepository(installationToken.token, request.repo, fetchImpl);
  const defaultBranch = repoInfo.default_branch ?? 'main';
  const commitMessage = request.commitMessage?.trim() || DEFAULT_COMMIT_MESSAGE;
  const workflowsToEnable = request.workflowsToEnable?.length
    ? request.workflowsToEnable
    : DEFAULT_WORKFLOWS;
  const configurePages = request.configurePages !== false;
  const pagesSourcePath = request.pagesSourcePath ?? '/';
  const autoEnableActions = request.autoEnableActions !== false;
  const triggerWorkflowId = request.triggerWorkflowId ?? 'daily.yml';
  const triggerWorkflowRef = request.triggerWorkflowRef ?? defaultBranch;
  const repoHtmlUrl = repoInfo.html_url ?? `https://github.com/${request.repo.owner}/${request.repo.repo}`;

  const actionsResult: DeployResult['actions'] = {
    attempted: autoEnableActions,
    enabled: false,
    enabledWorkflows: [],
  };

  if (autoEnableActions) {
    await setRepositoryActionsEnabled(installationToken.token, request.repo, fetchImpl);
    actionsResult.enabled = true;

    for (const workflowId of workflowsToEnable) {
      await enableWorkflow(installationToken.token, request.repo, workflowId, fetchImpl);
      actionsResult.enabledWorkflows.push(workflowId);
    }
  }

  const pagesResult = configurePages
    ? await ensurePagesSite(installationToken.token, request.repo, defaultBranch, pagesSourcePath, fetchImpl)
    : {
        attempted: false,
        status: 'skipped' as const,
        htmlUrl: null,
        sourceBranch: null,
        sourcePath: null,
        buildType: null,
      };
  const repositoryHomepageResult = configurePages
    ? await updateRepositoryHomepage(
        installationToken.token,
        request.repo,
        pagesResult.htmlUrl ?? buildDefaultPagesUrl(request.repo.owner, request.repo.repo),
        repoInfo.homepage,
        fetchImpl,
      )
    : {
        attempted: false,
        status: 'skipped' as const,
        htmlUrl: null,
        errorMessage: null,
      };

  const committedPaths = await upsertRepositoryFiles(
    installationToken.token,
    request.repo,
    defaultBranch,
    request.files,
    commitMessage,
    fetchImpl,
  );

  const writtenSecrets = await upsertRepositorySecrets(
    installationToken.token,
    request.repo,
    request.secrets,
    fetchImpl,
  );

  const workflowDispatchResult: DeployResult['workflowDispatch'] = {
    attempted: true,
    workflowId: triggerWorkflowId,
    ref: triggerWorkflowRef,
    triggered: false,
    errorMessage: null,
    workflowUrl: buildWorkflowUrl(repoHtmlUrl, triggerWorkflowId),
  };

  try {
    await triggerWorkflowDispatch(
      installationToken.token,
      request.repo,
      triggerWorkflowId,
      triggerWorkflowRef,
      fetchImpl,
    );
    workflowDispatchResult.triggered = true;
  } catch (error) {
    if (error instanceof GitHubApiError) {
      workflowDispatchResult.errorMessage = error.message;
    } else {
      throw error;
    }
  }

  return {
    repo: {
      owner: request.repo.owner,
      repo: request.repo.repo,
      defaultBranch,
      htmlUrl: repoHtmlUrl,
    },
    committedPaths,
    writtenSecrets,
    actions: actionsResult,
    pages: pagesResult,
    repositoryHomepage: repositoryHomepageResult,
    workflowDispatch: workflowDispatchResult,
  };
}
