---
name: wix-app
description: "Build and review Wix CLI app extensions: dashboard pages, modals, plugins, menu plugins, custom element widgets, Editor React components, site plugins, embedded scripts, backend APIs, backend events, service plugins, data collections, and App Market readiness. Use for any Wix CLI app feature, extension, CMS schema, dashboard, widget, plugin, backend API, event, service plugin, or App Market review."
---

# Wix App Builder

Require `@wix/cli` 1.1.192 or newer.

The Wix CLI owns scaffolding. This skill classifies the request, selects one execution route, and loads detailed references only when that route requires them.

## Core Workflow

1. Classify the extension and count physical data sources before interpreting workflow complexity.
2. Read one selected extension guide. Do not open a general dashboard guide before checking the dashboard fast path below.
3. Scaffold with the CLI. Custom and hybrid dashboards then save `.dashboard-route.json` and pass the route-only audit before loading WDS documentation or implementing UI.
4. Read only the exact API/component documentation named by the accepted route, then implement only in generated files.
5. Validate with the checks available in the current environment before reporting completion.

For non-dashboard extensions, read [CODE_QUALITY.md](references/CODE_QUALITY.md) before implementation. Dashboard quality and runtime gates live in the dashboard workflow guide. Do not claim completion after a build alone.

## Dashboard Route

Use this fast path before opening any dashboard reference:

- Existing page with `patterns.json`, or a new manager backed by one physical CMS collection: read [AUTO_PATTERNS_DASHBOARD.md](references/AUTO_PATTERNS_DASHBOARD.md) directly. A filtered queue, exception list, review workset, saved subset, bulk transition, or contextual record surface over that collection is still a one-collection manager. Do not read the general dashboard router unless the Auto Patterns guide identifies a custom or analytical region that needs it.
- Multi-source, external-data, primarily analytical, or genuinely unsupported custom dashboard: read [DASHBOARD_ROUTING.md](references/DASHBOARD_ROUTING.md).
- Ambiguous source count or page ownership: inspect the project and data model first, then choose one of the two routes above.

The Auto Patterns guide routes to its focused capability references. Read only the capability reference needed by the requested workflow. The selected route owns behavior and acceptance criteria; exact extension, SDK, Auto Patterns, and WDS references own APIs.

## Auto Patterns Extension And Fallback Gate

Auto Patterns is the mandatory first route for a new one-collection manager. Search, filters, derived worksets, bulk selection or transitions, row actions, contextual SidePanel, Dashboard Modal, and structured input flows do not make the table custom by themselves. Only when a table capability is absent from its documented configuration or override path may the agent record it as unsupported and replace the collection table.

## Extension Directory

| Need | CLI type | Implementation reference |
| --- | --- | --- |
| Dashboard sidebar page | `DASHBOARD_PAGE` | [DASHBOARD_PAGE.md](references/DASHBOARD_PAGE.md) |
| Dashboard Modal | `DASHBOARD_MODAL` | [DASHBOARD_MODAL.md](references/DASHBOARD_MODAL.md) |
| Extend an existing dashboard | `DASHBOARD_PLUGIN` | [DASHBOARD_PLUGIN.md](references/DASHBOARD_PLUGIN.md) |
| Dashboard menu action | `DASHBOARD_MENU_PLUGIN` | [DASHBOARD_MENU_PLUGIN.md](references/DASHBOARD_MENU_PLUGIN.md) |
| App-owned CMS data | `DATA_COLLECTION` | [DATA_COLLECTION.md](references/DATA_COLLECTION.md) |
| HTTP endpoint | Manual | [BACKEND_API.md](references/BACKEND_API.md) |
| Editor React component | `EDITOR_REACT_COMPONENT` | [EDITOR_REACT_COMPONENT.md](references/EDITOR_REACT_COMPONENT.md) |
| Standalone site widget | `CUSTOM_ELEMENT` | [CUSTOM_ELEMENT_WIDGET.md](references/CUSTOM_ELEMENT_WIDGET.md) |
| Fixed slot on a Wix app page | `SITE_PLUGIN` | [SITE_PLUGIN.md](references/SITE_PLUGIN.md) |
| Business-flow integration | `SERVICE_PLUGIN` | [SERVICE_PLUGIN.md](references/SERVICE_PLUGIN.md) |
| Event-triggered backend logic | `EVENT` | [BACKEND_EVENT.md](references/BACKEND_EVENT.md) |
| Scripts or tracking | `EMBEDDED_SCRIPT` | [EMBEDDED_SCRIPT.md](references/EMBEDDED_SCRIPT.md) |

For every CLI-supported extension except Backend API, use `npx wix generate --params`. If the schema is unknown, run `npx wix schema generate --type <extensionType>`. Do not hand-write builder files, UUIDs, registration, or scaffolding.

## Data Routing

| Source | Action |
| --- | --- |
| Existing site CMS collection | Resolve and use it; do not create app-owned storage. |
| New app-owned data | Create a Data Collection extension and obtain the namespace. |
| Wix business data or external API | Read its exact API; create CMS storage only for explicit app-owned persistence. |
| Unknown | Inspect context or ask one targeted question. |

For a one-collection Auto Patterns page, use [DATA_COLLECTION.md](references/DATA_COLLECTION.md) for app-owned schema and the selected Auto Patterns guide for the page. For custom joins or multi-source dashboard operations, use the Data Model and Operations section of [DASHBOARD_ROUTING.md](references/DASHBOARD_ROUTING.md). A reference field defines schema only; separately plan population and missing-reference behavior.

## Documentation Discipline

- Wix Data: [WIX_DATA.md](references/data-collection/WIX_DATA.md)
- Dashboard SDK: [DASHBOARD_API.md](references/dashboard-page/DASHBOARD_API.md)
- Stores: [STORES_VERSIONING.md](references/STORES_VERSIONING.md)
- App Market: [APP_MARKET_REVIEW.md](references/APP_MARKET_REVIEW.md)
- Registration recovery: [EXTENSION_REGISTRATION.md](references/EXTENSION_REGISTRATION.md)

Before importing WDS, invoke the Wix Design System skill and read the exact installed component documentation and examples named by the selected route. Record the component, documentation target, and reason it is required before implementation. Import `@wix/design-system/styles.global.css` once in the main component entry. Do not approximate a documented WDS component with custom markup or positioning.

Use focused discovery only when the selected local guide does not cover the required API. Read the discovered method schema before implementation.

## Validation

1. For a proposed custom or hybrid dashboard, immediately run `node "$HOME/.agents/skills/wix-app/scripts/audit-dashboard-code.mjs" --route-only <dashboard-source-directory>` after saving `.dashboard-route.json`. On `RT-05` or `RT-06`, return to Auto Patterns ownership; do not rewrite the explanation to preserve the rejected route.
2. Treat audit output as an API. Never open, grep, or reverse-engineer the audit script during generation. Fix the named rule from the selected guide and rerun only after a route or code change.
3. Run the available TypeScript and Wix build validator once. Fix reported errors and rerun only after a code change.
4. For every dashboard implementation, including standard Auto Patterns pages, run `node "$HOME/.agents/skills/wix-app/scripts/audit-dashboard-code.mjs" <dashboard-source-directory>`. This code audit is local and blocking; it checks route-specific runtime contracts that compilation cannot prove.
5. Run `wix preview` and browser checks only when the environment exposes an interactive preview/runtime session. Do not start a long-lived preview command in a non-interactive codegen worker.
6. When browser access exists, open the registered route and verify loader, representative data, console/network, primary workflow, and persistence. Otherwise report runtime validation as `blocked` with the exact manual check; do not retry or wait indefinitely.
