---
name: wix-app
description: "Build and review Wix CLI app extensions: dashboard pages, modals, plugins, menu plugins, custom element widgets, Editor React components, site plugins, embedded scripts, backend APIs, backend events, service plugins, data collections, and App Market readiness. Use for any Wix CLI app feature, extension, CMS schema, dashboard, widget, plugin, backend API, event, service plugin, or App Market review."
---

# Wix App Builder

Require `@wix/cli` 1.1.192 or newer.

The Wix CLI owns scaffolding. This skill classifies the request, selects one execution route, and loads detailed references only when that route requires them.

## Core Workflow

1. Classify the extension. For every record-oriented dashboard, read [DASHBOARD_WORKFLOW.md](references/DASHBOARD_WORKFLOW.md) first and translate the prompt through its five-WHAT journey gate. Define the outcome, understanding, investigation, actions, and visible success before resolving data, choosing a route, or naming a component.
2. Resolve each requested data system through [DATA_FOUNDATION.md](references/DATA_FOUNDATION.md). Count the CMS collection interfaces that the dashboard will actually manage, not API calls or query branches. Reconcile unavailable capabilities with the journey explicitly; never silently weaken the required workflow.
3. Read [DASHBOARD_PRESENTATION.md](references/DASHBOARD_PRESENTATION.md) and define how the completed journey and verified data should be represented. Choose and justify the primary representation, supporting representations, drill-in, hierarchy across the five stages, and state-consistency expectations before selecting a route or component.
4. Choose one route from the dashboard fast path below, then read one selected extension guide. The route must consume the completed workflow, data-foundation, and presentation contracts rather than reinterpret the prompt.
5. Scaffold with the CLI. Custom and hybrid dashboards then save `.dashboard-route.json` and pass the route-only audit before loading WDS documentation or implementing UI. Standard Auto Patterns pages use `patterns.json`; they do not create a route record or run route-only audit.
6. Read only the exact API/component documentation named by the accepted route. Before importing an SDK or host module, identify its execution host, confirm the method supports that host, and verify every required app scope is granted. Call an available permission tool as soon as scopes are known and before writing permission evidence; `recorded` requests setup but does not prove the app or installation grants access. `auth.elevate()` changes identity; it never grants a missing scope. TypeScript compatibility is not runtime evidence. Then implement only in generated files.
7. Validate with the checks available in the current environment before reporting completion.

For non-dashboard extensions, read [CODE_QUALITY.md](references/CODE_QUALITY.md) before implementation. For dashboards, treat workflow, presentation, and data as three connected success contracts. The five WHATs define the problem; Understand → Focus → Investigate → Act → Verify defines the operational journey; presentation determines how that journey is expressed. Do not claim completion after a build alone.

## Dashboard Route

Use this fast path only after completing the workflow, data-foundation, and presentation contracts:

- Existing page with `patterns.json`, or a new manager backed by exactly one resolved CMS collection interface: read [AUTO_PATTERNS_DASHBOARD.md](references/AUTO_PATTERNS_DASHBOARD.md) directly. The collection may be native CMS, a Wix App Collection, an external database collection exposed by an adaptor, or an app-owned collection. A filtered queue, exception list, review workset, saved subset, bulk transition, or contextual record surface over that collection is still a one-collection manager.
- Multiple resolved collections, a true join, a primarily analytical page without a record collection, or a genuinely unsupported non-table region: read [DASHBOARD_ROUTING.md](references/DASHBOARD_ROUTING.md). An API response is not permission to bypass collection resolution or rebuild a one-source table.
- Ambiguous source count or page ownership: inspect the project and data model first, then choose one of the two routes above.

For Auto Patterns, read [configuration.md](references/auto-patterns-dashboard/configuration.md) for base page configuration, [collection-workflows.md](references/auto-patterns-dashboard/collection-workflows.md) for Focus and collection actions, [entity-workflows.md](references/auto-patterns-dashboard/entity-workflows.md) for investigation and editing surfaces, and [extensions.md](references/auto-patterns-dashboard/extensions.md) only for supplemental overrides and SDK utilities. Read only the capabilities required by the completed journey. The selected route owns behavior and acceptance criteria; exact extension, SDK, Auto Patterns, and WDS references own APIs.

## Auto Patterns Extension And Fallback Gate

Auto Patterns is mandatory for every new manager backed by exactly one resolved CMS collection interface. Search, filters, derived worksets, bulk selection or transitions, row actions, contextual SidePanel, Dashboard Modal, and structured input flows do not make the table custom. Do not replace that table with custom WDS by asserting that the original source was an API or that a derived field is required.

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
| Existing site CMS collection | Resolve its ID, schema, permissions, and capabilities; use it directly. |
| Wix business application data | Resolve the corresponding Wix App Collection and inspect it through Wix Data. Do not copy it merely to populate a dashboard table. |
| Connected external database | Resolve the collection exposed by the installed adaptor and inspect its supported operations. Do not call the external API directly for a one-source table. |
| New app-owned operational data | Create a Data Collection extension and obtain the namespace. Derived copies require an explicit synchronization and ownership contract. |
| No supported collection interface | Mark the data foundation blocked. Do not fabricate a driver, insert sample data, or silently fall back to a custom table. |

Use [DATA_FOUNDATION.md](references/DATA_FOUNDATION.md) for source resolution. Use [DATA_COLLECTION.md](references/DATA_COLLECTION.md) only when the app truly owns the collection schema. For custom joins or multi-source operations, use the Data Model and Operations section of [DASHBOARD_ROUTING.md](references/DASHBOARD_ROUTING.md). A reference field defines schema only; separately plan population and missing-reference behavior.
For namespace and code-identifier retrieval, use [APP_IDENTIFIERS.md](references/APP_IDENTIFIERS.md).

## Documentation Discipline

- Wix Data: [WIX_DATA.md](references/data-collection/WIX_DATA.md)
- Dashboard SDK: [DASHBOARD_API.md](references/dashboard-page/DASHBOARD_API.md)
- Stores: [STORES_VERSIONING.md](references/STORES_VERSIONING.md)
- App Market: [APP_MARKET_REVIEW.md](references/APP_MARKET_REVIEW.md)
- Registration recovery: [EXTENSION_REGISTRATION.md](references/EXTENSION_REGISTRATION.md)
- Official extension documentation index: [DOCUMENTATION.md](references/DOCUMENTATION.md)

Before importing WDS, invoke the Wix Design System skill and read the exact installed component documentation and examples named by the selected route. Record the component, documentation target, and reason it is required before implementation. Import `@wix/design-system/styles.global.css` once in the main component entry. Do not approximate a documented WDS component with custom markup or positioning.

Use focused discovery only when the selected local guide does not cover the required API. Read the discovered method schema before implementation.

## Validation

1. For a proposed custom or hybrid dashboard, immediately run `node "$HOME/.agents/skills/wix-app/scripts/audit-dashboard-code.mjs" --route-only <dashboard-source-directory>` after saving `.dashboard-route.json`. Standard Auto Patterns pages skip this step. On `RT-05` or `RT-06`, return to Auto Patterns ownership; do not rewrite the explanation to preserve the rejected route.
2. Treat audit output as an API. Never open, grep, or reverse-engineer the audit script during generation. Fix the named rule from the selected guide and rerun only after a route or code change.
3. For every dashboard implementation, including standard Auto Patterns pages, run `node "$HOME/.agents/skills/wix-app/scripts/audit-dashboard-code.mjs" <dashboard-source-directory> [each referenced backend endpoint]`. Include every app-owned backend file the dashboard calls so the audit sees both sides of the runtime boundary. This code audit is local and blocking; a non-zero result stops implementation and must be corrected before TypeScript, build, or completion.
4. Run TypeScript first. Fix its errors and rerun TypeScript only after a code change. After TypeScript and the dashboard audit pass, run exactly one final project build directly, without piping it through `head`, `tail`, or another early-closing command. Do not repeat a successful build to obtain shorter output.
5. Run `wix preview` and browser checks only when the environment exposes an interactive preview/runtime session. Do not start a long-lived preview command in a non-interactive codegen worker.
6. When browser access exists, open the registered route and verify loader, representative data, console/network, primary workflow, and persistence. Otherwise report runtime validation as `blocked` with the exact manual check; do not retry or wait indefinitely.
