# Wix App Skill Handoff

## Purpose

Improve the `skills/wix-app` skill so Codegen can reliably build useful Wix back-office dashboards while choosing the smallest supported implementation path.

The work is about product behavior and safe routing, not making every requested capability appear supported. A dashboard should either use verified Wix capabilities or explain the blocked capability clearly.

## Current State

- Repository: `wix-skills-pr`
- Branch: `skills/rework-wix-app-skill-architecture`
- Current committed HEAD: `dceff6b` (`fix(wix-app): verify API permissions before dashboard build`)
- There are four uncommitted files. Review and commit them before beginning unrelated work.
- `origin` currently points to `stavml/skills`, while work should be published from the user's work account (`stavl-ux`). Confirm the intended remote before pushing.

## Product Decisions To Preserve

### Routing

1. Prefer Auto Patterns for a single CMS collection, including table, list, gallery, saved views, row actions, and an entity page where supported.
2. Do not replace the whole collection surface with custom WDS merely because it also needs a side panel, modal, detail view, action, filter, or derived state.
3. Use a custom WDS table only for a real unsupported presentation need, multiple physical sources, or data that cannot be adapted into a supported Auto Patterns collection workflow.
4. Treat charts, KPI regions, side panels, modals, and entity pages as separate surfaces. They can complement an Auto Patterns collection surface.
5. Choose detail surfaces by information depth, not a rigid rule: quick contextual inspection can use inline detail, a side panel, or a modal; complex work can use an entity page.

### Dashboard Experience

- Model the manager workflow as: understand, focus, investigate, act, and verify.
- Keep one clear primary action for the managed workset.
- Keep row, bulk, detail, and entity-page actions aligned with the entity lifecycle and permissions.
- Preserve selected-row state when contextual detail is open; refresh views, counts, and filters after writes.
- Use useful empty, loading, permission, unsupported-capability, and recoverable-error states. Never render raw SDK error JSON.
- A user with CMS editor access should have matching dashboard editing capabilities when the product task calls for them; a CMS viewer should not be offered writes.

### WDS And Auto Patterns

- Use Auto Patterns guidance for its collection components. Do not apply WDS table guidance to an Auto Patterns table.
- When a custom WDS component is necessary, read the matching documented component or guideline before implementation.
- Side panels must use the documented host and component composition. They belong in the dashboard overlay layer, have header/body/footer, fill the available viewport, and must not be constrained by a page wrapper.
- Use a Modal only when it is the appropriate detail/action surface; follow the documented header/body/footer layout and avoid unnecessary scrollbars.

## Current Uncommitted Change

The latest test involved a “Site Pages QR Codes” dashboard. It failed because the generated app tried to use an unsupported site-page inventory capability and received `403`.

These changes strengthen the host/API safety gate:

- `references/DASHBOARD_ROUTING.md`
  - Require real permission-grant evidence before marking a capability verified.
  - State that a backend route does not make a frontend-only API supported.
  - Define stable failure categories: `MISSING_PERMISSION`, `UNSUPPORTED_CAPABILITY`, `SITE_UNPUBLISHED`, and `TRANSIENT_FAILURE`.
  - Allow Retry only for transient failures.
- `references/BACKEND_API.md`
  - Apply the same backend host, scope, installation, and failure-state rules.
- `scripts/audit-dashboard-code.mjs`
  - Reject `@wix/site-site.getSiteStructure()` regardless of local import alias and in either dashboard or backend code.
  - Reject `permissionStatus: "verified"` when evidence is only documentation, package presence, or `auth.elevate()`.
  - Reject a route record that presents `@wix/site-site.getSiteStructure()` as a supported regular-site page inventory path.
- `scripts/test-audit-dashboard-code.mjs`
  - Add regression coverage for an aliased import and false permission verification.

These changes improve correctness and recovery messaging. They do **not** make regular Wix site-page inventory available where the platform does not expose a supported API. That requires a platform capability, a deliberate alternative data source, or a changed product requirement.

## Validate Before Committing

```bash
cd "/Users/stavl/Desktop/new codex project/wix-skills-pr"
npm run validate:wix-app-dashboard
git diff --check
git status --short
```

Latest result: validation passed with 6 consolidated references and all audit self-tests passing.

## Working Principles

- Keep skill context lean. Prefer one clearly routed, consolidated reference over many small files or duplicated guidance.
- Add deterministic checks only for repeated, high-impact failure modes. Back each new audit rule with a focused regression fixture.
- Do not claim an API works just because it typechecks, builds, appears in docs, or can be elevated.
- Use codegen logs and product screenshots as evidence before changing routing. A component bug should be reported to its owning team rather than encoded as a false skill rule.
- Do not push or change remotes without verifying the target account and branch.

## Starting A New Thread

Tell the next agent:

> Read `PROJECT_HANDOFF.md` in `wix-skills-pr`, inspect `git status`, run the dashboard validation, and continue from the uncommitted host/API safety changes. Do not push until the remote is confirmed as the work account.
