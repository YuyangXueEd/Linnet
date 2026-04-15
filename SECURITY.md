# Security Policy

## Secret handling

This project uses API keys and webhook URLs. Follow these rules to keep your credentials safe:

- **Never commit secrets to any file.** All credentials must go in GitHub Secrets (`Settings → Secrets and variables → Actions`).
- `config/sources.yaml` is committed to your repo. Do not put any key or token value there.
- The setup wizard only handles secrets in-browser memory. It never logs or transmits them to any server.

## Supported versions

Security issues are addressed on the latest commit on `main`. There are no versioned releases with separate security backports.

## Reporting a vulnerability

If you find a security issue — particularly anything that could expose a user's API keys, allow unauthorised access to their repo, or cause credential leakage — please report it privately:

**Email:** yuyang.xue@ed.ac.uk

Please do not open a public GitHub issue for security vulnerabilities. Provide a description of the issue and steps to reproduce if possible. I will respond within 7 days and coordinate a fix before any public disclosure.
