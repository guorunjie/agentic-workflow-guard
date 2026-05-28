# Security Policy

Agentic Workflow Guard exists to find risky AI automation before it runs. Please report scanner bypasses, unsafe automatic fixes, package integrity issues, or workflow examples that expose real credentials with care.

## Supported Versions

| Version | Supported |
| --- | --- |
| 1.x | Yes |
| < 1.0 | No |

## Reporting A Vulnerability

Use GitHub private vulnerability reporting when available for `guorunjie/agentic-workflow-guard`. If that is unavailable, open a minimal public issue that says a security report is available, but do not include exploit details, real secrets, private workflow exports, or customer data.

Helpful reports include:

- the affected command, action input, or generated file;
- a minimal synthetic fixture;
- expected and actual findings;
- whether the issue affects SARIF output, JSON reports, rule packs, benchmark metadata, agent skill outputs, or `fix --apply`;
- package version, commit SHA, and operating system.

## Scope

In scope:

- scanner bypasses for supported platforms;
- unsafe automatic fixes that remove evidence or enable side effects;
- malicious or unverifiable rule-pack metadata;
- package release, provenance, or CLI install integrity issues;
- vulnerabilities in GitHub Action behavior.

Out of scope:

- reports that only include real third-party secrets;
- social engineering against maintainers;
- denial-of-service reports without a practical scanner or CI impact;
- issues in external automation platforms themselves.

## Safe Research Guidelines

Use synthetic repositories and synthetic tokens. Do not run agent-generated shell output against live infrastructure. Keep proof-of-concept workflows in dry-run mode unless a maintainer explicitly asks for a deeper reproduction.

## Disclosure Expectations

Maintainers should acknowledge credible reports within 7 days, publish fixes through SemVer releases, and include regression fixtures whenever a scanner bypass is fixed.
