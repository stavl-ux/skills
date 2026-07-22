---
name: wix-cli
description: "Quick reference for Wix CLI commands: creating app/headless projects, local dev, building, previewing, releasing, env vars, and account auth. Use when running or choosing Wix CLI commands."
---

# Wix CLI

The Wix CLI develops, tests, and deploys Wix projects from the terminal. Run project commands as `npx wix <command>` from the project root. Full reference: [dev.wix.com/docs/wix-cli.md](https://dev.wix.com/docs/wix-cli.md) (append `.md` to any docs URL for markdown).

See also: [Wix Skills Registry](https://github.com/wix/skills) · [Wix Headless docs](https://dev.wix.com/docs/go-headless.md)

## Project creation

Run in the parent directory where the project folder should be created. Without flags these run interactively.

| Command | What it does |
|---|---|
| `npm create @wix/new@latest -- app [--app-name <name> -t <template-id>]` | Creates a Wix app project: registers a new app in your account (or extends one via `--extend-app-id`) and scaffolds from a template. |
| `npm create @wix/new@latest -- headless [--folder-name <f> --business-name <b> --site-template <commerce\|scheduler\|registration\|blank>]` | Creates a Wix-managed headless project: provisions a business and site, scaffolds, and publishes (skip with `--no-publish`). |
| `npm create @wix/new@latest init` | Connects the **current folder** (existing code) as a Wix-managed headless project; writes `wix.config.json`. No prompts, no flags. |

## Project commands (run inside a project)

| Command | What it does |
|---|---|
| `wix dev` | Local dev server with hot reload (default port 4321; `--port`, `--https` for apps). |
| `wix generate` | Adds an extension to the project. `--type <TYPE>` (e.g. `DASHBOARD_PAGE`, `EMBEDDED_SCRIPT`, `EVENT`, `SERVICE_PLUGIN`); apps also support `--params '<json>'` for non-interactive scaffolding. |
| `wix build` | Builds the project. Required before `preview` and `release`. |
| `wix preview` | Uploads the built project and prints a shareable preview URL. Note: some extensions (embedded scripts, site plugins) only work after `release`. |
| `wix release` | Publishes the project. For apps, creates a new app version and registers extensions. Releasing a headless site also clears its cache. Flags: `-c <comment>`, `-t major\|minor`. |
| `wix env pull` / `env set` / `env remove` | Sync environment variables with Wix's servers; `pull` merges into `.env.local` (includes collaborator-shared vars and headless secrets). |
| `wix translation pull` / `translation push` | Headless only — sync translations with the Multilingual dashboard. |
| `wix generate manifest` | Apps only — generates the manifest for an Editor React Component extension (build first). |

## Global commands

| Command | What it does |
|---|---|
| `wix login` | Logs in to your Wix account. `--api-key <token>` for CI/automation. |
| `wix logout` | Logs out. |
| `wix whoami` | Shows the logged-in user's email. |
| `wix skills add` / `skills update` | Installs or updates [Wix skills](https://dev.wix.com/docs/wix-cli/guides/development/about-wix-skills.md) in the project. |
| `wix telemetry on\|off` | Toggles usage telemetry. |
