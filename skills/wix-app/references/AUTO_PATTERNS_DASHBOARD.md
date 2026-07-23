# Auto Patterns Dashboard

Use this guide for new and existing one-collection management surfaces. It owns route evaluation, generation, updates, supported extension paths, and validation.

## Contents

- [Route and workflow contract](#route-and-workflow-contract)
- [Change workflow](#change-workflow)
- [Generation and configuration](#generation-and-configuration)

## Route And Workflow Contract

Use this route for a new management surface backed by one CMS collection when Auto Patterns supports the complete physical page.

### Capability References

This file owns route evaluation, standard generation, permissions, and validation. A basic new collection manager can be generated from this file without reading a capability reference. Read only the narrowest matching capability reference when the request needs the capability in that row. Do not load custom WDS guidance unless the required capability has no documented Auto Patterns path.

| Requested capability | Exact Auto Patterns reference |
| --- | --- |
| AppConfig, pages, collection structure, or Table/Grid configuration | [Configuration](auto-patterns-dashboard/configuration.md) |
| Saved Views, row actions, or bulk actions | [Collection workflows](auto-patterns-dashboard/collection-workflows.md) |
| Custom row action resolver | [Extensions](auto-patterns-dashboard/extensions.md) and, when selection is involved, [Collection workflows](auto-patterns-dashboard/collection-workflows.md) |
| Custom displayed field, column, section, or slot | [Extensions](auto-patterns-dashboard/extensions.md) |
| Entity page, entity form, or entity header | [Entity workflows](auto-patterns-dashboard/entity-workflows.md) |
| KPI or chart supplemental region | Check the custom header, section, slot, and child-component references above; then read [DASHBOARD_ROUTING.md](DASHBOARD_ROUTING.md) only for that region's WDS/chart contract |
| External child component needs collection data or refresh | [Extensions](auto-patterns-dashboard/extensions.md) |
| Record detail, viewing, or editing beyond the collection row | [Collection workflows](auto-patterns-dashboard/collection-workflows.md) and [Extensions](auto-patterns-dashboard/extensions.md); use the surface guidance below |
| Deep or multi-section record flow | [Entity workflows](auto-patterns-dashboard/entity-workflows.md) |
| Short focused or blocking record flow | a documented Auto Patterns action plus [DASHBOARD_MODAL.md](DASHBOARD_MODAL.md) |

### Route Contract

- **AP-01:** Mark each requested capability `supported`, `supported-via-override`, or `unsupported`, with the checked documentation target.
- **AP-02:** Use Auto Patterns when the collection manager and every extension of its physical workflow have a documented configuration or override path. A contextual WDS `SidePanel` is supported-via-override when a documented row action sets the selected record and the panel is an `AutoPatternsApp` child with AppContext/refresh access. A Dashboard Modal is supported as a bounded action launched through the dashboard API. A KPI or chart may be supported-via-override when a documented header, section, slot, or child-component path owns its placement. Unsupported analytics behavior changes only that region's implementation; it does not transfer collection-table ownership.
- **AP-03:** A Table/Grid switch, row action, derived display, or named workset is not automatically unsupported. Check its focused reference before falling back; record that exact file in the capability decision.
- **AP-04:** Auto Patterns documents Table and Grid. Do not promise the native CMS layout menu, List layout, custom layout labels, or a configurable initial layout unless the installed docs explicitly support them.
- **AP-05:** Do not use a custom WDS dashboard route until this evaluation records the first `unsupported` capability. A new one-collection manager stays on this route when every requested capability is `supported` or `supported-via-override`.
- **AP-06:** Keep one physical collection classified as one source even when the workflow is described as an exception queue, review workset, alert list, or saved subset, or uses OR conditions, elapsed-time rules, comparisons, bulk transitions, or contextual record detail. Materialize operational state as maintained fields such as `needsAttention`, `exceptionType`, `exceptionSince`, and `isReviewed`, then configure filters/Views and documented actions against those fields. Do not rebuild the table to express query logic or attach a supplemental surface.
- **AP-12:** When an app-owned collection grants the intended collaborator `itemUpdate: CMS_EDITOR`, its management workflow must include an edit entity page or paired view/edit pages. A custom transition action does not satisfy general editing.

### Extension Choice

Keep Auto Patterns as the owner of the collection table, layouts, filters, selection, CRUD, and refresh lifecycle. Add only the narrow supplemental surface required by the workflow:

| Workflow shape | Recommended extension |
| --- | --- |
| Moderate view/edit depth where table context should remain visible | Custom row/action override opens a WDS `SidePanel` child of `AutoPatternsApp`. |
| Short, focused, blocking view/edit task or confirmation | Launch a Dashboard Modal from a documented custom action. |
| Extensive or multi-section view/edit flow, complex validation, deep linking, or long work | Link to an Auto Patterns `entityPage` in the appropriate mode. |
| KPI or chart around a supported one-collection manager | Keep Auto Patterns as the table owner and mount the analytical component through a documented header, section, slot, or child-component override. |

These are best-practice defaults, not intent-to-component rules: viewing and editing may use any surface when its depth and context justify it. For SidePanel or Modal, invoke the Wix Design System skill and read the exact installed component documentation before importing WDS. The supplemental surface is not evidence that the table itself should be rebuilt in WDS.

### Action Coherence

- Treat inspect, edit, workflow transition, create, and delete as different intents.
- Give a bulk workflow transition a single-record equivalent in the row detail surface or row actions unless it is inherently bulk-only.
- Do not add create or delete merely because the collection supports CRUD. Derive actions from the user workflow: expose required transitions consistently for one and many records, and omit unrelated lifecycle actions.
- For an inspect-first workflow, use `View` or the specific workflow verb as the row action; keep full-record editing available from the chosen detail surface when appropriate.

Before generation, make one compact workflow decision table:

| Decision | Required answer |
| --- | --- |
| Data ownership | App-owned, site-owned, Wix business data, or external |
| Audience capabilities | `itemRead`, `itemInsert`, `itemUpdate`, and `itemRemove` available to the intended user |
| Mutability | Which fields and transitions this user may change |
| Detail mode | `edit`, `view`, or paired `view` + `edit`, with one reason |
| Action surfaces | Row, bulk, detail, and edit actions that must remain coherent |

Resolve permissions per operation before choosing entity mode. Permissions describe what is technically allowed; they do not automatically add unrelated actions. When the intended CMS collaborator has `itemUpdate: CMS_EDITOR` and the dashboard manages app-owned records, preserve the generated edit default or pair an inspect-first view page with an edit page. Use view-only when update is unavailable to that audience. Named immutable fields may remain read-only inside an otherwise editable workflow; if another surface owns all editing, align collection permissions so this audience is read-only. Collection actions do not automatically appear on entity pages: configure relevant single-record transitions on the detail surface and omit unrelated create/delete defaults.

### Canonical Auto Patterns Profile: Inventory Manager

Use Auto Patterns for a single `Inventory Products`-style collection that needs product name, image, SKU, category, stock/reorder values, standard search or filters, Table and Grid presentation, and a documented row action such as **Mark restocked**.

This remains an Auto Patterns page even when the user asks for:

- a card/gallery-first presentation alongside a table;
- filters for category or stock status;
- representative sample records; or
- a row action that updates the same collection.

Configure the documented Auto Patterns Table/Grid layouts and action override. Do not replace them with a custom WDS gallery, a hand-built layout toggle, or a custom React table unless a required capability is explicitly documented as unsupported.

### Build Contract

1. Reuse a verified collection or create the required app-owned Data Collection and obtain its namespace.
2. Define schema, permissions, references, operational derived fields, indexes, initial data, and missing-reference behavior before page generation.
3. Scaffold with the Wix CLI and run the bundled Auto Patterns generator exactly as documented.
4. Keep the generated page component thin. Put configuration in `patterns.json` and every override in its documented separate file. Standard Auto Patterns pages do not create `.dashboard-route.json` or run route-only audit.
5. When the prompt asks for representative data, create 3-5 realistic records and verify the collection and dashboard show the same items.
6. Before adding any custom dashboard JSX, verify `patterns.json` exists and the generated Auto Patterns wrapper is registered by the CLI-scaffolded extension. Put supplemental UI only in a documented override or child-component path.
7. For a multi-region page, record `regionOwners`. A custom analytical region must not replace the generated Auto Patterns collection page unless the table itself has documented unsupported-capability evidence.

### Invalid Implementations

- Rebuilding supported CRUD, filters, pagination, Table/Grid layouts, or actions in custom WDS React.
- Rebuilding the collection table because a chart, KPI, or other neighboring region is unsupported.
- Adding JSX directly to an Auto Patterns-owned page instead of using a documented override.
- Creating an unregistered `page.tsx` beside the CLI-scaffolded page component.
- Treating a schema reference field as populated data.

### Acceptance

- The collection, schema, permissions, and representative records exist as planned.
- The generated page uses `patterns.json` and the documented page lifecycle.
- Table/Grid, Saved Views, actions, create/edit/delete flows, and overrides behave as requested.
- Individual, bulk, and detail-surface actions form one coherent workflow and follow the managed entity lifecycle.
- Loading, empty, no-results, error, and populated states are intentional.
- Browser, console, network, and persistence checks pass.
- The registered dashboard page opens, its loader settles, and a build-only success is not reported as runtime success.

## Change Workflow

Use this route when the existing Dashboard Page directory contains `patterns.json`.

### Required Documentation

Read the existing `patterns.json`, then read only the matching consolidated capability reference listed above.

### Change Contract

- **APC-01:** Treat `patterns.json` as ownership evidence. Inspect configuration and registered overrides before editing.
- **APC-02:** Change content, layouts, columns, actions, and page configuration in `patterns.json` when supported.
- **APC-03:** Put action, column, component, header, section, and slot overrides in their documented separate files and register them through the existing page component. Keep the Auto Patterns collection page as owner when adding a contextual SidePanel child, Dashboard Modal action, or linked entity-page input flow.
- **APC-04:** Do not hand-write UI in the generated page component or create a second page component.
- **APC-05:** If no documented configuration, slot, or override supports the requested capability, record the missing path and move the entire physical page to a custom Dashboard Page or split the workflow. Do not partially replace the generated lifecycle.

### Acceptance

- Existing collection/entity navigation and CRUD behavior remain intact.
- The change uses the narrowest documented configuration or override.
- No generated lifecycle logic is duplicated in custom React.
- The changed workflow passes browser, console, network, and persistence checks.

## Generation And Configuration

Generates declarative `patterns.json` + a thin page component (`<page-name>.tsx`) for simple CRUD dashboard pages using `@wix/auto-patterns`. Supports both creating new pages and updating existing ones.

### Quick Start Checklist

- [ ] **Step 1:** Determine if this is a new page or update to existing
- [ ] **Step 2:** For new pages — scaffold via `wix generate`, generate schema, run generator script
- [ ] **Step 2 (alt):** For existing pages — read `patterns.json`, consult references, edit directly
- [ ] **Step 3:** Install dependencies (`@wix/auto-patterns`, `@wix/patterns`)
- [ ] **Step 4:** Verify per [APP_VALIDATION.md](APP_VALIDATION.md)

### Required App Permissions

Auto-patterns calls `@wix/data` at runtime to CRUD the collection. The app must declare these scopes in the Wix Dev Center — they are NOT added automatically:

- `SCOPE.DC-DATA.READ` — for `get`, `query`, `count`, `distinct`
- `SCOPE.DC-DATA.WRITE` — for `insert`, `update`, `save`, `remove`, `bulk*`

Add them at: `https://manage.wix.com/apps/{app-id}/dev-center-permissions` (replace `{app-id}` with your app ID).

Without these scopes, the dashboard page renders but all data operations fail.

### Core Rules

#### Configuration Generation

1. **Analyze** schema requirements.
2. **Select** fields based on data types (max 3 initially).
3. **Validate** against the constraints below.

#### Enum Handling

- **IF** `enumConfig` is required (implicit or explicit):
  - **THEN** ASK user for possible option values.
  - **THEN** Derive `label` from `value` (e.g., "dog" -> "Dog") unless specified.
  - **NEVER** guess or invent enum values.

#### Structural Limits

- **MUST** have exactly 2 pages in `pages` array (`collectionPage` + `entityPage`).
- **MUST** have exactly 1 component with `layout` array in `collectionPage`.
- **MUST** use TypeScript for configuration.

#### Field Selection

- **MAX** 3 columns initially for `collectionPage`.
- **IF** the workflow allows users to create the managed entity **THEN** include a `create` action in `collectionPage` navigating to `entityPage`.
- **IF** the page represents a derived queue, alert set, or processing workset **THEN** do not add create/delete actions unless they belong to the underlying entity lifecycle.
- **NEVER** fill optional fields unless explicitly requested.

#### Type Binding

- **IF** `type: 'collectionPage'` **THEN** only `collectionPage` field allowed.
- **IF** `type: 'entityPage'` **THEN** only `entityPage` field allowed.
- **NEVER** mix types in single page config.

#### Validation

- **MUST** align with `AppConfig` structure.
- **MUST** remove unsupported configuration entries.

### Part A: Creating a New Auto-Patterns Page

#### Step 1: Scaffold the Dashboard Page

An auto-patterns page is a dashboard page — scaffold it with the Wix CLI:

```bash
wix generate --params '{"extensionType":"DASHBOARD_PAGE","title":"<title>","route":"<route>"}'
```

The CLI generates the page folder, the component stub `<page-name>.tsx`, the builder file `<page-name>.extension.ts` (which registers the extension and points its `component` at `<page-name>.tsx`), a unique UUID, and the `src/extensions.ts` registration — do NOT hand-write any of these. The folder name comes from `route`. After scaffolding, the page folder looks like this:

```
src/extensions/dashboard/pages/<page-name>/
├── <page-name>.extension.ts   # Builder file (generated — registration + UUID, component → <page-name>.tsx)
├── <page-name>.tsx            # CLI component stub (overwritten in Step 3)
└── patterns.json              # Declarative AppConfig — added in Step 3, edit this to iterate
```

> **Why this matters for Step 3:** the generator writes the auto-patterns wrapper to `<page-name>.tsx` — the SAME file the builder already registers — so it overwrites the stub and is wired up automatically. Do NOT let it produce a separate `page.tsx`; that would leave the wrapper unregistered next to the empty stub, and the dashboard would render blank.

#### Step 2: Generate the Schema

You must produce the input JSON for the generator script. Top-level keys: `collection`, `schema`, `relevantCollectionId`, `extensionName`.

**`collection`** (from the data collection you scaffolded):

- `idSuffix` — the collection's short ID
- `fields` — array of `{ key, displayName, type }` (types: TEXT, NUMBER, BOOLEAN, DATE, IMAGE, URL, RICH_TEXT, etc.)

**`relevantCollectionId`** (top-level, sibling to `collection` and `schema`) — full scoped collection ID (e.g., `@namespace/my-collection`)

**`schema.content`** — 20 string fields you generate:

- `collectionRouteId` — URL-friendly collection ID (kebab-case, e.g., "cool-gadgets")
- `singularEntityName` — URL-friendly singular form (e.g., "cool-gadget")
- `pageTitle` — Main page title (e.g., "Cool Gadgets Collection")
- `pageSubtitle` — Page description
- `actionButtonLabel` — Primary create button (e.g., "Add New Gadget")
- `toolbarTitle` — Table toolbar title
- `toolbarSubtitle` — Table toolbar subtitle
- `emptyStateTitle` — Title when no items exist
- `emptyStateSubtitle` — Empty state description
- `emptyStateButtonText` — Empty state CTA button text
- `deleteModalTitle` — Delete confirmation title
- `deleteModalDescription` — Delete confirmation description
- `deleteSuccessToast` — Delete success message
- `deleteErrorToast` — Delete error message
- `bulkDeleteModalTitle` — Bulk delete title
- `bulkDeleteModalDescription` — Bulk delete description
- `bulkDeleteSuccessToast` — Bulk delete success
- `bulkDeleteErrorToast` — Bulk delete error
- `entityPageTitle` — Entity detail page title
- `entityPageSubtitle` — Entity detail page subtitle

**`schema.layout`** — organize ALL collection fields into sections:

```json
{
  "main": [
    {
      "title": "Basic Info",
      "subtitle": "Core details",
      "fields": ["field1", "field2"]
    }
  ],
  "sidebar": [
    { "title": "Status", "subtitle": "Metadata", "fields": ["isActive"] }
  ]
}
```

Rules: Every field must appear exactly once. Main = user-facing content. Sidebar = metadata/status. If there are no sidebar-worthy fields, use `"sidebar": []`.

**`schema.columns`** — ordered list for the table view:

```json
[{ "id": "fieldKey", "displayName": "Short Name" }]
```

Include ALL fields, primary identifiers first. Display names target ≤10 characters.

**`schema.gridItem`** (only if IMAGE fields exist, otherwise `null`):

```json
{
  "titleFieldId": "name",
  "subtitleFieldId": "category",
  "imageFieldId": "photo"
}
```

> **🛑 Nesting is required.** Content, layout, columns, and gridItem are **not** top-level keys and **not** flat siblings under `schema`. The generator rejects flat shapes like `"schema": { "collectionRouteId": "...", "main": [...] }`. Always nest as `"schema": { "content": {...}, "layout": {...}, "columns": [...], "gridItem": null }`.

#### Step 3: Run the Generator Script

The generator script is bundled with this skill at `<SKILL_ROOT>/scripts/generate-auto-patterns.js` — it is **not** copied into the user's app repo. Run it from the project directory using the skill's absolute path (`<SKILL_ROOT>` is the folder containing this skill's `SKILL.md`).

Write the input JSON to a temp file and run the script, pointing `--output` at the folder the CLI scaffolded in Step 1:

```bash
# Write input to temp file
cat > /tmp/auto-patterns-input.json << 'EOF'
{
  "collection": {
    "idSuffix": "<collection-id>",
    "fields": [
      { "key": "<field-key>", "displayName": "<Field Label>", "type": "<TYPE>" }
    ]
  },
  "schema": {
    "content": {
      "collectionRouteId": "<collection-route-id>",
      "singularEntityName": "<singular-entity-name>",
      "pageTitle": "<Page Title>",
      "pageSubtitle": "<Page subtitle>",
      "actionButtonLabel": "<Create button label>",
      "toolbarTitle": "<Toolbar title>",
      "toolbarSubtitle": "<Toolbar subtitle>",
      "emptyStateTitle": "<Empty state title>",
      "emptyStateSubtitle": "<Empty state subtitle>",
      "emptyStateButtonText": "<Empty state button>",
      "deleteModalTitle": "<Delete modal title>",
      "deleteModalDescription": "<Delete modal description>",
      "deleteSuccessToast": "<Delete success toast>",
      "deleteErrorToast": "<Delete error toast>",
      "bulkDeleteModalTitle": "<Bulk delete modal title>",
      "bulkDeleteModalDescription": "<Bulk delete modal description>",
      "bulkDeleteSuccessToast": "<Bulk delete success toast>",
      "bulkDeleteErrorToast": "<Bulk delete error toast>",
      "entityPageTitle": "<Entity page title>",
      "entityPageSubtitle": "<Entity page subtitle>"
    },
    "layout": {
      "main": [
        {
          "title": "<Section title>",
          "subtitle": "<Section subtitle>",
          "fields": ["<field-key>"]
        }
      ],
      "sidebar": []
    },
    "columns": [
      { "id": "<field-key>", "displayName": "<Short Name>" }
    ],
    "gridItem": null
  },
  "relevantCollectionId": "@<namespace>/<collection-id>",
  "extensionName": "<Extension Name>"
}
EOF

# Run generator
node <SKILL_ROOT>/scripts/generate-auto-patterns.js --input /tmp/auto-patterns-input.json --output ./src/extensions/dashboard/pages/<page-name>/
```

The `--output` directory MUST be the exact folder the CLI scaffolded in Step 1 — the script derives the component filename from that folder's name.

The script produces:

- `patterns.json` — The declarative AppConfig
- `<page-name>.tsx` — Thin React wrapper component, written to the SAME filename the CLI scaffolded and the builder already registers (overwrites the stub)

The builder file (`<page-name>.extension.ts`) and `src/extensions.ts` registration from Step 1 stay as-is — no manual registration edit, and no stray `page.tsx`.

#### Step 4: Install Dependencies

The CLI template pins `@wix/auto-patterns` and `@wix/patterns` to exact versions — keep it that way. Check `package.json` first: if both are already in `dependencies`, **skip this step**.

If one is missing, install only that package:

```bash
npm install --save-exact <missing-package>
```

#### Step 5: Validate

Run the lightweight generated-code audit before compilation:

```bash
node "$HOME/.agents/skills/wix-app/scripts/audit-dashboard-code.mjs" <dashboard-source-directory>
```

Fix every named Auto Patterns rule, then run [APP_VALIDATION.md](APP_VALIDATION.md) to verify TypeScript compilation and build. Compilation alone does not prove that entity callbacks are safe during route loading.

### Part B: Updating an Existing Auto-Patterns Page

> **🛑 STOP — UI changes go through overrides, NOT page-component edits.**
> If you're adding a banner, custom header, action, slot, custom column rendering, or row sectioning to an auto-patterns page, use the matching override documented in the capability references below. Do NOT add the UI by hand-writing JSX in the page component (`<page-name>.tsx`) — that bypasses the override registration and breaks the iteration model.

When `patterns.json` already exists in a page directory, edit it directly. **This is the iteration model**: changes to layout, columns, actions, and content are made by editing JSON — the page component (`<page-name>.tsx`) only changes to register new overrides. No React rewrite, no rebuild of CRUD logic.

> **Component filename:** the page component is `<page-name>.tsx` (the file the CLI scaffolded and the `<page-name>.extension.ts` builder registers). References may use "`page.tsx`" as shorthand for this component — edit the existing `<page-name>.tsx`; **never create a new `page.tsx`**, or it will sit unregistered next to the real component.

#### Step 1: Read the Existing Config

Read the current `patterns.json` to understand the configuration structure.

#### Step 2: Consult Reference Documentation

Choose the smallest capability reference that covers the requested change:

| Capability | Use for | Reference |
| --- | --- | --- |
| Configuration | AppConfig, page relationships, routing, Table/Grid structure, sticky columns | [configuration.md](auto-patterns-dashboard/configuration.md) |
| Collection workflows | Saved Views, collection and row actions, selection, bulk operations, `ResolvedAction` | [collection-workflows.md](auto-patterns-dashboard/collection-workflows.md) |
| Entity workflows | Entity layout, view/edit actions, forms, custom components, dynamic headers | [entity-workflows.md](auto-patterns-dashboard/entity-workflows.md) |
| Extensions | Custom actions, columns, sections, slots, AppContext, SDK utilities | [extensions.md](auto-patterns-dashboard/extensions.md) |

#### Step 3: Make Targeted Edits

Edit `patterns.json` based on the user's request. Key constraints:

- **Always 2 pages** — one `collectionPage` + one `entityPage`
- **Bidirectional linking** — `entityPageId` in collection component ↔ `parentPageId` in entity page
- **Max 3 columns initially** for new table views
- **`biName` is mandatory** for every action (kebab-case: `{action-purpose}-action`)
- **`customColumns.enabled: true`** when > 5 columns
- **Grid item only if IMAGE fields exist**
- **Named worksets require Saved Views**: when the request names recurring subsets or saved filters, read [collection-workflows.md](auto-patterns-dashboard/collection-workflows.md) and configure Saved Views in addition to the Table/Grid layout switcher
- **Layout boundary**: Auto Patterns documents only `Table` and `Grid`, with an automatic built-in layout switcher when both exist. It does not document the native CMS `Choose layout` menu, `List`, or a configurable initial layout
- **Route format**: entity page must be `/[segment]/:entityId`
- **Exactly 1 `appMainPage: true`** across all pages

If adding custom overrides (actions, columns, components, slots, etc.):

1. Create the override files in the appropriate `components/` subfolder
2. Update the page component (`<page-name>.tsx`) to register overrides via `PatternsWizardOverridesProvider`
3. Use the relevant consolidated capability reference above for the exact override pattern

> **🛑 Overrides ALWAYS go in their own file under `components/<type>/`** (e.g. `components/columns/status.tsx`) with a `use*` hook — **regardless of size, even for a single small override.** This is structural, required by the override-registration model. **Never inline override render logic in the page component** (`<page-name>.tsx`), and do NOT apply the general ~300-line "split only if large" rule here — it does not override this requirement.

### Non-Matching Intents

Do NOT use this skill when:

- User needs multi-collection data display → return to [DASHBOARD_ROUTING.md](DASHBOARD_ROUTING.md) and choose the custom-dashboard route
- User needs embedded script configuration → see [EMBEDDED_SCRIPT.md](EMBEDDED_SCRIPT.md)
- User needs custom business logic or external APIs that cannot be implemented through a documented action, override, or child component → return to [DASHBOARD_ROUTING.md](DASHBOARD_ROUTING.md) and choose the custom-dashboard route
- User needs contextual record detail → preserve the Auto Patterns collection page, use its documented row-action/AppContext extension, and invoke the Wix Design System skill for the exact installed `SidePanel` documentation
- User needs structured inputs → use the linked Auto Patterns entity page before considering an overlay
- User needs a focused blocking confirmation or isolated input → use the documented custom action path and [DASHBOARD_MODAL.md](DASHBOARD_MODAL.md)
- User needs backend endpoints → see [BACKEND_API.md](BACKEND_API.md)

### Example patterns.json

See [auto-patterns-dashboard/example-patterns.json](auto-patterns-dashboard/example-patterns.json) for a complete working example.
