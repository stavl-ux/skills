# Dashboard Workflows

Use this guide only after completing the five-WHAT journey in [DASHBOARD_WORKFLOW.md](DASHBOARD_WORKFLOW.md), resolving data through [DATA_FOUNDATION.md](DATA_FOUNDATION.md), and defining the presentation through [DASHBOARD_PRESENTATION.md](DASHBOARD_PRESENTATION.md). Consume those contracts without reinterpreting the prompt. Read only the exact installed API and component documentation named by the selected route.

## Contents

- [Route selection](#route-selection)
- [Custom table route](#custom-table-route)
- [Custom table with contextual detail](#custom-table-with-contextual-detail)
- [Analytics and multi-region route](#analytics-and-multi-region-route)
- [Focused modal route](#focused-modal-route)
- [WDS component documentation gate](#wds-component-documentation-gate)
- [Data model and operations](#data-model-and-operations)
- [Host and API compatibility](#host-and-api-compatibility)
- [Visualizations](#visualizations)
- [Runtime validation](#runtime-validation)

## Route Selection

Choose one primary route from the user's physical page and workflow. Components and data operations do not create separate dashboard routes.

### Route Precedence

Apply these gates in order. Stop at the first match, then use only that route section and the exact external references it names.

1. Existing `patterns.json` selects the Auto Patterns change route.
2. A new manager backed by exactly one resolved CMS collection interface selects Auto Patterns, including Wix App Collections and external database collections exposed by an adaptor. A contextual SidePanel, Dashboard Modal action, entity page, derived field, or API origin does not change table ownership.
3. A KPI, chart, or calculated summary triggers analytics evaluation, but does not transfer ownership of a supported one-collection table. First check whether the analytics region can be added through the documented Auto Patterns header, section, slot, or child-component path. The page may use the analytics route for composition while `regionOwners.collection` remains `auto-patterns`.
4. Only after the Auto Patterns extension path is unavailable, selected-record contextual work selects table-and-panel.
5. A genuine multi-collection joined table selects custom-table.
6. A focused blocking task that is not an action of an Auto Patterns manager selects Dashboard Modal.

### Route Decision

| Request | Primary route |
| --- | --- |
| New one-collection CRUD or management surface, including an Auto Patterns table plus contextual detail, an entity edit page, or a bounded action overlay | [AUTO_PATTERNS_DASHBOARD.md](AUTO_PATTERNS_DASHBOARD.md) |
| Existing page directory contains `patterns.json` | [AUTO_PATTERNS_DASHBOARD.md](AUTO_PATTERNS_DASHBOARD.md) |
| Custom/multi-source WDS table without selected-record detail or analytics regions | [Custom table](#custom-table-route) |
| Unsupported custom table where a row opens detail, edit, assignment, or resolution, without analytics regions | [Custom table with contextual detail](#custom-table-with-contextual-detail) |
| KPI, chart, calculated summary, or multi-region page, including table + SidePanel pages | [Analytics and multi-region](#analytics-and-multi-region-route) |
| Focused blocking form or confirmation | [Focused modal](#focused-modal-route) |

If a page combines analytics with a table, assign ownership per region before choosing the primary route. A supported one-collection management region remains Auto Patterns even when a supplemental KPI or chart requires WDS or a chart library. If a genuinely custom table opens record detail, apply the contextual-detail contract to that operational region. This is an explicit combined route, not permission to replace a supported collection region or load every dashboard reference.

### Routing Gates

- **Auto Patterns is mandatory for every manager backed by exactly one resolved collection.** Before using a custom table, contextual-detail, analytics, or WDS component route, resolve the source through [DATA_FOUNDATION.md](DATA_FOUNDATION.md), then open [AUTO_PATTERNS_DASHBOARD.md](AUTO_PATTERNS_DASHBOARD.md).
- Count resolved collection IDs, not API calls or query branches. Search, projections, OR predicates, date comparisons, derived statuses, saved worksets, and filtered subsets of one collection still have one resolved collection.
- Query complexity does not transfer table ownership. For a one-collection manager, adapt the data model with maintained filterable fields when needed, then keep Auto Patterns as the collection surface.
- Unsupported capability is regional evidence, not page-wide permission. An unsupported chart, KPI formula, or visualization does not justify a custom WDS table. A one-collection custom table is invalid; extend the Auto Patterns-owned collection region or mark the foundation blocked.
- A contextual detail surface, input flow, or bounded confirmation does not make a one-collection manager custom. Use the documented Auto Patterns row action, child-component/AppContext, Modal, or entity-page path. Search, filters, Table/Grid, lifecycle-appropriate CRUD, saved views, documented row or bulk actions, and documented SidePanel/Modal/entity-page extensions stay Auto Patterns-owned.
- Do not classify a page as `custom-table` merely because it has a Table/Grid switch, gallery/card presentation, search, filters, a restock-style action, or sample records. These are Auto Patterns candidates and must be evaluated there first.
- Use the [WDS component documentation gate](#wds-component-documentation-gate) when a documented Auto Patterns extension needs the exact WDS composition for its supplemental surface. Select a custom route only after an exact unsupported capability is recorded.
- A new app-owned collection does not imply Auto Patterns or Dashboard Modal; the physical workflow selects the page route.
- Desktop selected-record context uses WDS SidePanel. Keep Auto Patterns as the primary page owner when that panel is opened from its documented row-action/AppContext extension path. Use the linked Auto Patterns entity page for structured create or edit inputs. A focused blocking task uses Dashboard Modal, including when launched from a documented Auto Patterns action. Do not scaffold a Dashboard Modal when the selected workflow is a SidePanel.
- Data creation and reference operations add the [Data model and operations](#data-model-and-operations) contract to the selected route; they do not replace it.
- Existing `patterns.json` always selects the Auto Patterns change workflow before editing.

### Route Record

For custom WDS and hybrid routes, scaffold the Dashboard Page first. Then save `.dashboard-route.json` in the generated dashboard source directory before implementing custom UI:

```json
{
  "route": "custom-table-panel",
  "sourceCount": 2,
  "sources": ["Appointments", "Clients"],
  "resolvedCollections": [
    { "system": "bookings", "mechanism": "wix-app-collection", "collectionId": "<verified appointments ID>", "schemaStatus": "verified", "read": true, "write": false, "freshness": "source-managed" },
    { "system": "contacts", "mechanism": "wix-app-collection", "collectionId": "<verified clients ID>", "schemaStatus": "verified", "read": true, "write": false, "freshness": "source-managed" }
  ],
  "secondary": "SidePanel detail",
  "regionOwners": {
    "collection": "custom-wds-table",
    "metrics": null,
    "chart": null,
    "detail": "wds-side-panel"
  },
  "dataAdaptation": "Resolve client display fields by appointment reference",
  "fallbackCategory": "multi-source",
  "workflow": {
    "journey": {
      "outcome": {
        "actorRole": "appointments operator",
        "desiredOutcome": "inspect an appointment and open its owning management record"
      },
      "understand": { "questions": ["Which appointments need attention?"], "signals": ["time", "status", "client"] },
      "focus": { "defaultWorkset": "Upcoming appointments", "controls": ["search", "status filter"] },
      "investigate": {
        "questions": ["Does this appointment require management?"],
        "evidenceFields": ["time", "status", "client", "service"],
        "contextPriority": "high"
      },
      "act": { "actions": [{
        "id": "manage-appointment",
        "kind": "owning-app-navigation",
        "operation": "navigate",
        "target": "verified appointment route",
        "surfaces": ["row", "detail"],
        "decisionInputFields": [],
        "transitionFields": [],
        "authoritativeEditableFields": []
      }] },
      "verify": {
        "visibleResult": "The owning appointment record opens",
        "postconditions": ["the destination identity matches the selected appointment"],
        "refresh": ["table", "detail", "selection"]
      }
    },
    "implementation": {
      "investigationSurface": "side-panel",
      "surfaceReason": "Moderate appointment context should remain beside the workset",
      "preserveCollectionContext": true,
      "evidenceMode": "read-only",
      "identityField": "id"
    }
  },
  "presentation": {
    "primaryRepresentation": { "type": "table", "reason": "Appointments must be compared across time, status, client, and service" },
    "supportingRepresentations": [],
    "drillIn": {
      "interface": "side-panel",
      "reason": "Appointment review benefits from retaining the active workset",
      "preservesContext": true
    },
    "stageEmphasis": { "understand": ["upcoming appointment scope"], "focus": ["appointments needing attention"], "investigate": ["appointment, client, and service context"], "act": ["manage appointment"], "verify": ["correct owning record opens"] },
    "consistency": ["filters", "selected record", "detail"]
  }
}
```

Allowed custom fallback categories are `multi-source` and `external-data`; record tables still require at least two resolved collections. `unsupported-presentation` cannot transfer ownership of a one-collection table. Filtering, OR/date logic, derived state, a gallery/table switch, or a detail overlay are never valid fallback categories.

For multi-region pages, `regionOwners` records which implementation owns `collection`, `metrics`, `chart`, and `detail`. Use `auto-patterns` for a one-collection region even when another region uses WDS or a chart library. A one-collection analytics route may not assign collection ownership to `custom-wds-table`.

When `regionOwners.metrics` is non-null, also record `metricSurface`, `metricCheckedExample`, `metricContainmentOwner`, and `metricLayoutOwner`. `metricSurface` must name the installed composition actually rendered (`AnalyticsSummary` or `StatisticsWidget`). Copy containment from that exact installed example; do not infer that a component either needs or forbids an external Card.

When record detail exists, select and justify it in `presentation.drillIn`, then adapt it to the verified runtime in `workflow.implementation`. Keep those fields aligned unless `presentation.drillIn.adaptationReason` explains a capability-driven difference. Do not duplicate the decision in route-level `detailSurface` fields.

Do not proceed with custom or hybrid implementation without this record. Standard generated Auto Patterns pages use `patterns.json` and their registered wrapper as ownership evidence and do not need a route record. Update a custom route record if evidence changes the route.

Immediately after saving the record, and before WDS lookup, dependency installation, or implementation, run:

```bash
node "$HOME/.agents/skills/wix-app/scripts/audit-dashboard-code.mjs" --route-only <dashboard-source-directory>
```

Treat the audit output as an API; do not inspect its source. `RT-05` or `RT-06` rejects collection ownership, so return to the Auto Patterns route instead of rephrasing the evidence or repairing custom UI.

## Custom Table Route

Use this route for a WDS management table that joins at least two resolved collections. Use the contextual-detail route when selecting a row opens record detail.

### Entry Gate

Do not use this route for a one-collection manager. Resolve the source through [DATA_FOUNDATION.md](DATA_FOUNDATION.md) and return to [AUTO_PATTERNS_DASHBOARD.md](AUTO_PATTERNS_DASHBOARD.md).

The following do **not** qualify a page for this custom route by themselves: Table/Grid or gallery presentation, search, filters, standard CRUD, saved views, sample data, or a same-collection row action. If those are the only requirements, return to the Auto Patterns guide.

### Required Documentation

Read [DASHBOARD_PAGE.md](DASHBOARD_PAGE.md) for the host extension. Invoke the Wix Design System skill, then read the installed `Table`, `TableToolbar`, `TableActionCell`, selected filter controls, `EmptyState`, and relevant Pagination examples. Apply the [WDS component documentation gate](#wds-component-documentation-gate) and [Data model and operations](#data-model-and-operations) sections when applicable.

### Pre-Build Contract

Record the source of truth, join/transformation, visible columns, exact filter values, primary action, write path, and post-success state. Define loading, empty collection, no-results, permission, error, and populated states before JSX.

### Table Rules

- **CT-01:** Keep source records, table row adapters, visible rows, and selected IDs distinct. Map CMS `_id` to the stable table `id` and resolve IDs back to source records before writes.
- **CT-02:** Keep labeled column headers visible in normal and bulk-selection states.
- **CT-03:** Define a width and overflow strategy for every column. A value, badge, date, amount, or action must never paint over another cell. When required columns cannot fit at the supported dashboard viewport, preserve their usable widths and enable the documented table horizontal scroll; do not compress, hide, or clip the final action column to force the table to fit.
- **CT-04:** For variable statuses, show one primary status plus a compact `+N` summary, or deliberately use a taller wrapping row. Never invade the final action column.
- **CT-05:** Keep `TableActionCell` in a dedicated final column using documented sizing and behavior. A labeled action always reserves non-zero space; budget preceding columns so its text and focus ring remain visible.
- **CT-06:** Precompute result-count copy as one string before passing it to a toolbar label. Do not compose adjacent JSX text fragments.
- **CT-07:** Use no more than three visible filters. Submitted values must match stored values exactly.
- **CT-08:** Controlled WDS selection uses stable row `id` values: keep `selectedIds` in state and pass the state setter directly to `Table.onSelectionChanged`, because that callback receives the selected ID array. `Table.ToolbarContainer` may expose selection context for rendering toolbar actions, but it is not the `onSelectionChanged` payload. Never read `selectedRows` from the change callback. Selecting rows replaces normal toolbar actions with selected count and applicable bulk actions; it does not replace column headers.
- **CT-09:** Every empty, no-results, error, or permission surface includes its relevant verified recovery action: create/setup, clear filters, retry, or request access.
- **CT-10:** If a row opens detail or performs work, expose that interaction through the documented final-column `TableActionCell`; row click and its action must invoke the same handler. Use documented hover/focus action visibility by default; a permanently visible row action requires an explicit workflow reason. Row click alone is not a sufficient visible or keyboard affordance.
- **CT-11:** A populated table always renders the documented `<Table.Content />` branch. `Table.EmptyState` is only the source-empty or filtered-empty branch; correcting its API must never remove the populated table content.

### Data States

| State | Required surface |
| --- | --- |
| Loading | Stable page/table shell with documented loading feedback. |
| Load failure | Recoverable error with retry. |
| No source records | Hide filters and row actions; show `EmptyState` with a verified create/setup CTA. |
| No matching rows | Keep active filters visible; show clear-filters recovery. |
| Visible rows | Show relevant controls, labeled columns, and working actions. |

### Actions

- Resolve selected table IDs to complete source records before a mutation.
- Use the documented Wix Data or API write method; do not write display-only DTOs.
- Define success feedback, refresh behavior, selection clearing, and queue membership before coding.
- Preserve context and selection on failure, and expose a useful recovery path.

### Invalid Implementations

- Custom table markup that approximates WDS behavior.
- Hidden column headers, index-based row IDs, selection callbacks that treat selected IDs as `selectedRows`, or filters using display labels as unverified values.
- Variable non-wrapping badge arrays in bounded cells.
- Page-level clipping used to hide table overflow or the final action. Do not replace required table horizontal scrolling with squeezed cells, truncated controls, or zero-width action columns.
- A blank table area used as an empty state.

### Acceptance

Test the longest row, every status, narrowest supported width, matching and zero-result filters, visible checked selection, hover/focus row actions, every row/bulk mutation, empty-state CTA, retry, console, network, and persisted refresh. Run `node "$HOME/.agents/skills/wix-app/scripts/audit-dashboard-code.mjs" <dashboard-source-directory>` before build validation; this audit is blocking and a successful build does not replace it.

## Custom Table With Contextual Detail

Use this self-contained route for a custom WDS table where selecting a desktop row opens contextual record detail, editing, assignment, or resolution work.

### Entry Gate

For a one-collection manager, use [AUTO_PATTERNS_DASHBOARD.md](AUTO_PATTERNS_DASHBOARD.md). A Table/Grid presentation, search, filters, CRUD, sample data, or a documented same-collection action is not a reason to bypass Auto Patterns.

### Required Documentation

Read [DASHBOARD_PAGE.md](DASHBOARD_PAGE.md) and apply the [WDS component documentation gate](#wds-component-documentation-gate). Invoke the Wix Design System skill and retrieve the installed `Table`, `TableToolbar`, `TableActionCell`, selected filters, `EmptyState`, and `Button` documentation. Before writing the panel, retrieve the exact installed `SidePanel` **Skin**, **Height**, **Header**, **Custom header**, **Dividers**, **Content sections**, **Custom footer**, and **Quick view** examples. Keep their JSX available while implementing; parent props do not describe compound Header/Content/Footer APIs. Use the standard `DashboardSidePanelHost` integration defined below, rather than copying Quick View's demo frame. Apply [Data model and operations](#data-model-and-operations) for collections, joins, references, and writes.

### Pre-Build Contract

Record the source of truth, join, visible columns, filter values, selected-record behavior, mutation path, post-success state, and these overlay decisions: primitive, stable host, height owner, overflow owner, and scroll owner.

### Table Contract

- **TP-01:** Keep source records, row adapters, visible rows, and selected ID distinct. Row click and the final action must call the same selection handler. Pass that selected ID to the documented `Table.isRowActive` predicate so the open record remains visibly active. The panel is valid only while its ID remains visible; clear selection and close it after filtering, deletion, refresh, or permission changes remove the row.
- **TP-02:** Keep labeled headers visible. Define every column's width and overflow behavior before renderers. When the selected record workflow requires more columns than fit at the supported viewport, enable documented table horizontal scrolling; do not squeeze or clip the final action column.
- **TP-03:** Use one primary status plus `+N` for variable issue sets; show the complete status set in record detail. Every interactive row exposes a documented `TableActionCell` in a dedicated final column with an explicit View/Edit action; row click mirrors it but never replaces its affordance. Use documented hover/focus action visibility by default; set persistent `visibility: "always"` only when the prompt explicitly requires a permanently displayed row control. Reserve a non-zero width for a labeled action and budget the preceding column widths so the action can never be clipped.
- **TP-04:** Precompute toolbar count text as one string. Never compose `{count} item{suffix}` as separate JSX children.
- **TP-05:** Implement stable loading, recoverable load/permission failure, empty source, no-results, and populated states. Compute source-empty from all loaded records and filtered-empty from visible records separately. Empty source data hides filters/actions and shows its primary create/setup CTA inside the empty state; filtered zero results keep active filters and provide clear-filters recovery. Never show `Clear filters` when no source records exist.
- **TP-06:** Bulk selection visibly checks the selected rows and resolves stable table IDs to complete source records before writing. Use controlled WDS selection: keep `selectedIds` in state and pass its setter to `Table.onSelectionChanged`, which receives the selected ID array. Do not read `selectedRows` from this callback; toolbar selection context is only for rendering the toolbar.
- **TP-06a:** Inherit **CT-11** in full: the selected-record workflow does not replace the table's populated `<Table.Content />` branch. Use `Table.EmptyState` only for source-empty or filtered-empty states.

### SidePanel Contract

- **TP-07:** Use WDS `SidePanel` with `skin="floating"` as an overlay for desktop contextual work. Do not scaffold or substitute Drawer, Dashboard Modal, a fixed-width flex sibling, or a push column unless the prompt explicitly requires that separate behavior.
- **TP-08:** A floating `SidePanel` is not a portal. Mount it through a `DashboardSidePanelHost`, outside `Page`, `Card`, table, and their overflow containers. The host is the only approved custom positioning: `position: fixed`, `top: 0`, `right: 0`, `bottom: 0`, a dashboard overlay `zIndex`, `display: flex`, and `alignItems: stretch`. Render the `SidePanel` as the host's direct child: no intermediate wrapper, `pointerEvents` layer, or content-sized parent. It has no width, height, padding, shadow, or overflow styles. This anchors the WDS panel to the available dashboard viewport instead of page/table content. A bare `<RecordPanel />` after `<Page>` is invalid because it remains in normal document flow.
- **TP-09:** Never combine a `position: relative; overflow: hidden; height: 100%` page wrapper with an absolute `height: 100%` panel child. Never use `position: absolute`, `100vh`, `100dvh`, fixed panel dimensions, or unverified `height: 100%` as a generic host fix. The stretching fixed host owns anchoring; WDS `SidePanel` owns its dimensions, shadow, and internal scrolling.
- **TP-10:** Default record detail uses `SidePanel.Header` with its documented `title` API only. Put status first in Content. Add custom Header children only when the exact Custom header example is required, preserving its documented horizontal inset; never place a bare badge or title against the panel edge.
- **TP-11:** Every contextual record-detail panel uses `SidePanel.Header`, one `SidePanel.Content`, and `SidePanel.Footer`. The Footer always includes a right-aligned secondary WDS `Button` labeled `Close`, even for read-only detail; add a right-aligned primary WDS action when the record has a verified mutation path. Never use a native HTML button or manually styled substitute. Use internal Content groups and the standard thin WDS `Divider` when separation is necessary. Reserve multiple Content regions plus `SidePanel.Divider` for genuinely independent panel regions justified by the Content sections example. Only Content scrolls; Header and Footer stay visible.
- **TP-12:** Let `skin="floating"` own panel shadow and geometry. The fixed overlay host must allow the shadow to render on every edge; do not add wrapper `boxShadow`, `overflow: auto/hidden`, or fixed width/height around the panel.
- **TP-13:** Apply the mutation-readiness contract from [DASHBOARD_ROUTING.md](DASHBOARD_ROUTING.md#4-mutation-readiness) to every editable panel action. A save control starts disabled with unchanged values, enables only for a valid meaningful change, and is disabled while writing. The write handler independently rejects no-op writes.

### Detail Hierarchy And Actions

1. Header: record identity through the documented `title` API; use a custom header only when the retrieved example requires it.
2. Content opening: action-relevant status and 2-4 summary facts needed for the task.
3. Context: related person, account, location, or metadata.
4. Working fields: only fields with a verified write path; show read-only facts as text.
5. Footer: secondary actions, then right-aligned primary action.

Treat the panel as an extension of the selected row. Preserve identity, statuses, and action semantics. A state-changing bulk action normally has a single-record equivalent in the Footer and uses the same mutation path.

### Invalid Implementations

- SidePanel mounted inside a page/card/table wrapper, rendered as a bare page-flow sibling, pushed beside the table, or sized from page/table content.
- Custom header/body/footer containers, native HTML footer controls, bare custom-header badges, routine record groups split by thick `SidePanel.Divider` bands, hard-coded panel geometry, clipped shadow, doubled padding, or a record-detail panel with only the header close icon and no Footer.
- Full status arrays competing with the table action column.
- A stale panel remaining open for a filtered-out record, or an open record without its active table-row state.
- A read-only panel that hides the row's primary operational action.
- A save or update action enabled for unchanged, empty, invalid, or already-saving form state.

### Acceptance

Test the densest row and all table states. Hover and keyboard-focus an interactive row and confirm its action appears. Open a known row, compare row and panel facts, complete the single-record action, and verify persistence. For every editable action, test initial, changed, reverted, saving, and recoverable-failure states. Filter the selected row out and confirm the panel closes. Change table height while open: panel bounds and shadow remain stable on all edges, only Content scrolls, and Footer remains visible. Run `node "$HOME/.agents/skills/wix-app/scripts/audit-dashboard-code.mjs" <dashboard-source-directory>` before build validation; this audit is blocking and a successful build does not replace it.

## Analytics And Multi-Region Route

Use this route for KPIs, summaries, charts, calculated worksets, or pages combining multiple information regions. It does not imply that Auto Patterns supports charts.

### Entry Gate

For a one-resolved-collection manager, use [AUTO_PATTERNS_DASHBOARD.md](AUTO_PATTERNS_DASHBOARD.md). Record ownership for the collection, metrics, chart, and detail regions. Select analytics as primary only after checking whether the KPI/chart can be added through a documented Auto Patterns header, section, slot, or child-component path. An unsupported chart or calculated summary does not transfer ownership of a supported Table/Grid, filters, search, CRUD, or action region.

### Required Documentation

Read [DASHBOARD_PAGE.md](DASHBOARD_PAGE.md), then apply the [Visualizations](#visualizations) and [WDS component documentation gate](#wds-component-documentation-gate) sections. Retrieve the installed WDS `Page`, `Layout`, `Cell`, `Card`, `AnalyticsSummary`, and `StatisticsWidget` props plus the exact candidate composition examples. Use `AnalyticsSummary` when the requested top region is a set of summary cards or an analytics summary layout. Use `StatisticsWidget` for the compact grouped-statistic composition demonstrated by its installed example. Copy the selected example's containment instead of assuming either a flat surface or a Card wrapper. For every chart, read the exact supported chart-library documentation before implementation; a WDS card or metric component does not supply chart behavior. Apply the selected table contract to the operational region and the contextual-detail contract when rows open record detail. Those secondary contracts own only their region; this route still owns whole-page composition.

### Pre-Build Contract

List the page regions in reading order, name the primary operational surface, and record each region's WDS layout span at wide and narrow dashboard widths. Define every metric's source and every data state before JSX.

### Build Contract

- **AN-01:** Define each metric's source, formula, date boundary, null behavior, and refresh behavior before choosing a visualization.
- **AN-02:** Keep summary content compact and coherent. Put the primary operational surface before secondary explanation; do not create an isolated card for legends or copy that belongs beside the relevant metric.
- **AN-03:** Compose page regions with WDS `Layout` and `Cell`, using documented responsive spans. Do not build the page grid from horizontal `Box` rows, ad hoc `flex: 1`, fixed widths, or manual gaps.
- **AN-04:** Validate response shape before rendering. A missing metric or malformed series must not blank the whole page.
- **AN-05:** Give loading, empty, partial, error, and populated data deliberate surfaces. Keep the page structure stable while requests resolve.
- **AN-06:** Use a proven chart library and its exact documentation when a chart is required. Do not claim Auto Patterns chart support without explicit installed documentation.
- **AN-07:** Keep equal-level metric groups visually equal and fill their intended grid row. Use one compact summary band or a deliberate documented grid; do not leave arbitrary holes between cards.
- **AN-08:** Keep filters and their results together. A dense operational table is normally full width, including when a floating SidePanel opens above it.
- **AN-09:** When an analytics page includes selected-record detail, inherit the table-and-panel SidePanel contract in full: use the standard stretching fixed `DashboardSidePanelHost`, preserve the selected row with `Table.isRowActive`, keep the table full width beneath it, and validate that the panel stays anchored when table or page height changes.
- **AN-10:** Separate source-empty from filtered-empty operational data. Source-empty hides table controls and presents an in-context primary setup/create CTA. Filtered-empty preserves active filters and presents clear-filters recovery. Do not render a filtered-empty message or `Clear filters` when the source has no records.
- **AN-11:** A chart lives in a bounded chart region inside its Card. Use the selected chart library's documented responsive-container pattern so its canvas or SVG fills that region and cannot paint into the next dashboard surface. For Chart.js, use `responsive: true` with `maintainAspectRatio: false` when the chart region has an intended height; do not combine a fixed-height chart wrapper with `maintainAspectRatio: true`.
- **AN-12:** An analytics page with an operational table inherits the selected table route's populated-table contract. Keep `<Table.Content />` for visible rows; `Table.EmptyState` handles only source-empty or filtered-empty states and must not replace the normal table body.
- **AN-13:** Preserve the selected metric composition. Top-level summary cards normally use the installed `AnalyticsSummary`/`AnalyticsLayout` example; compact grouped statistics use the installed `StatisticsWidget` example. Record and reproduce that example's containment, separators, spacing, and `Layout`/`Cell` placement. Do not flatten a contained example, invent a wrapper, target internals with custom styling, or split one documented group into manually styled widgets.
- **AN-14:** Preserve collection-region ownership. For one resolved collection, keep the table in Auto Patterns. A custom chart, metric formula, neighboring analytical region, API origin, or computed flag is not table fallback evidence. When Auto Patterns owns the collection region, use its documented header, section, slot, child-component, action, and AppContext paths to compose supplemental WDS analytics.

### Invalid Implementations

- Selecting the table-and-panel route as primary for a page that also requests KPIs or several page regions.
- Replacing a supported one-collection Auto Patterns table with WDS because a neighboring chart or metric region is custom.
- A metric strip whose containment differs from the installed example recorded in the route contract.
- Multiple separate `StatisticsWidget` instances arranged by horizontal `Box` or flex wrappers instead of the documented widget composition and `Layout`/`Cell` placement.
- Unequal card widths, unused grid gaps, or a small explanatory card competing with the operational surface.
- A table or filter region narrowed, clipped, or pushed by the selected-record panel.

### Acceptance

Verify every metric against known source records and dates, inspect the composition at wide and narrow dashboard widths, and test source-empty, filtered-empty, partial, and populated responses. Compare the rendered KPI region with the exact installed metric example recorded in the route contract; its containment, spacing, separators, and responsive behavior must remain visible. Confirm equal-level analytics surfaces align, every chart remains inside its own Card, the operational region stays full width, and any combined table/detail acceptance checklist passes. Console and network must remain clean; one failed visualization must not erase unrelated content. Run `node "$HOME/.agents/skills/wix-app/scripts/audit-dashboard-code.mjs" <dashboard-source-directory>` before build validation.

## Focused Modal Route

Use this route for a focused, blocking, bounded dashboard task such as confirmation or an isolated form. Do not use it for selected-row inspection that should preserve desktop page context.

### Required Documentation

Read [DASHBOARD_MODAL.md](DASHBOARD_MODAL.md), apply the [WDS component documentation gate](#wds-component-documentation-gate), read [dashboard.openModal()](dashboard-page/DASHBOARD_API.md#openmodal), and retrieve the installed WDS `Modal` and `CustomModalLayout` documentation and composition example. Do not use a modal template as a substitute for the retrieved component example.

### Modal Contract

- **DM-01:** Scaffold a Dashboard Modal extension and open it through the documented dashboard API. Do not render a hand-built or WDS Modal directly inside a Dashboard Page.
- **DM-02:** Keep the task focused and bounded. Use a SidePanel for non-blocking selected-record context and Drawer for mobile sliding work.
- **DM-03:** Use the documented modal header, content, and footer composition. Secondary actions precede a right-aligned primary action.
- **DM-04:** Give one element ownership of scrolling. Constrain the surface to its documented viewport behavior; only Content scrolls when necessary, and horizontal overflow is forbidden.
- **DM-05:** Apply the mutation-readiness contract from [DASHBOARD_ROUTING.md](DASHBOARD_ROUTING.md#4-mutation-readiness): validate inputs, disable a no-op or invalid save, preserve entered data on recoverable failure, communicate success, and intentionally close or return a result to the caller.
- **DM-06:** Treat `observeState` params as initially absent or partial. Guard the params object and required identity before dereferencing, keep a stable loading/error surface mounted, and prefer passing a record ID plus a small serializable context object when the modal can load authoritative data itself.

### Acceptance

Open the modal from its real caller, complete and cancel the task, test initial missing params, loading, changed, reverted, saving, validation, and request-failure states, and verify focus, content containment, footer visibility, console, network, and persisted result. A successful build without this runtime check is `blocked`, not verified.

## WDS Component Documentation Gate

Use this gate after the Auto Patterns route has been evaluated. It serves either an Auto Patterns extension that needs the exact WDS composition for a supplemental surface, or a genuinely unsupported workflow that requires a custom dashboard route.

### Documentation Target

Use the bundled `wix-design-system` skill rather than a hard-coded Storybook or source-repository URL. Its `wds.cjs` helper resolves the version installed in the generated app, so the props and examples match the package that will run.

```bash
WDS="<wix-design-system skill>/scripts/wds.cjs"
node "$WDS" component <Component>
node "$WDS" example <Component> "<Example>"
```

Use a direct source or Storybook link only when the installed documentation lacks the required behavior. Record that exception and the version or commit it applies to.

### Required Record

Before supplemental or custom JSX, record:

```text
Auto Patterns capability: <supported-via-override or unsupported capability>
primary owner: <Auto Patterns collection page or custom dashboard>
required surface: <surface>
documentation read: <installed WDS component/example or chart-library API>
reason: <why this surface fits the workflow>
```

### Surface Map

| Required workflow surface | Exact installed documentation to retrieve | Route rule |
| --- | --- | --- |
| Moderate-depth view or edit that should preserve table context | `components SidePanel Button`; SidePanel examples: `Skin`, `Height`, `Header`, `Custom header`, `Content sections`, `Custom footer`, `Quick view` | Keep Auto Patterns primary and mount the floating SidePanel through its documented row-action/AppContext extension. |
| Short, focused, blocking view/edit task, confirmation, or destructive decision | `components Modal CustomModalLayout`; the `CustomModalLayout` composition example; Dashboard Modal API | Use Dashboard Modal for the bounded task without replacing the collection page. |
| Extensive or multi-section view/edit flow, complex validation, deep linking, or long work | Auto Patterns [entity workflows](auto-patterns-dashboard/entity-workflows.md) | Use the linked entity page; viewing and editing are both valid when the workflow depth warrants a full page. |
| Mobile sliding work | `component Drawer`; its relevant composition example | Do not substitute it for desktop SidePanel. |
| Top-level summary cards or analytics summary layout | `components AnalyticsSummary StatisticsWidget Layout Cell Card`; compare the exact candidate examples | Use the analytics route and reproduce the chosen example's containment. Prefer `AnalyticsSummary` for requested summary cards; use `StatisticsWidget` only when its compact grouped-statistic composition matches. |
| Chart or graph | Exact installed/supported chart-library API plus `components Layout Cell Card` | Do not invent chart APIs or claim Auto Patterns chart support. |
| Custom operational table | `components Table TableToolbar TableActionCell EmptyState`; selected control examples | Use the table route selected by the workflow. |

### Rules

- A component name in a prompt is not enough: retrieve its exact documentation and composition example first.
- Controls inside a documented WDS compound surface use documented WDS controls. Do not place native HTML `button`, `input`, `select`, or `textarea` elements inside SidePanel, Modal, Card, or table action regions when WDS provides the equivalent.
- For a metric region, record the selected component/example, containment owner, and layout owner. These values come from the installed example, not a universal wrapper assumption.
- Choose SidePanel, Modal, or entity page from information depth, task duration, blocking behavior, need for table context, validation complexity, and deep-linking needs. Do not map `view` or `edit` to one mandatory component.
- A WDS component gate does not transfer ownership of a supported one-collection table from Auto Patterns to custom React. Extend the generated page with the narrow documented action/AppContext/entity-page path instead.
- Do not hand-compose a documented surface from generic `Box` or a copied scaffold template. A floating `SidePanel` is the exception only for its mount: use the contextual-detail route's standard `DashboardSidePanelHost` for fixed viewport anchoring. Do not invent other panel positioning, sizing, shadow, or overflow styles.
- When multiple surfaces are needed, read only the component documentation mapped to those surfaces. Do not load the whole WDS library.
- Validate the real browser behavior specific to the surface: containment and scrolling for overlay components; empty, populated, and interaction states for tables; data shape and failure states for charts; documented containment, spacing, separators, and responsive behavior for metric widgets.

## Data Model And Operations

Treat source selection, schema, relationship values, and manager workflows as separate deliverables.

### Canonical Implementation References

Read [DATA_COLLECTION.md](DATA_COLLECTION.md) before creating or changing app-owned collection schema. Use its [Relationships](DATA_COLLECTION.md#relationships), [Initial Data Rules](DATA_COLLECTION.md#initial-data-rules), and [Permissions](DATA_COLLECTION.md#permissions) sections when applicable. Read [data-collection/WIX_DATA.md](data-collection/WIX_DATA.md) before implementing data reads, writes, reference assignment, or permissions-sensitive operations; use its [SDK Methods & Interfaces](data-collection/WIX_DATA.md#sdk-methods--interfaces) and [Permissions](data-collection/WIX_DATA.md#permissions) sections. This file is a routing and product-workflow checklist, not an SDK reference.

### Host And API Compatibility

Apply this gate when a Dashboard Page uses site structure, published-site metadata or URLs, Wix business data, an external service, or any SDK/host module not explicitly approved by the selected dashboard guide. Ordinary Auto Patterns collection reads do not load this gate unless they add one of those capabilities.

Before implementation, record:

```text
executionHost: <Dashboard Page, Dashboard Modal, Site, Editor, or backend>
requiredCapability: <data or operation>
selectedApi: <package + method>
hostEvidence: <exact installed schema/docs/example>
requiredScopes: <exact scope IDs, or [] when none>
permissionStatus: <verified or blocked>
permissionEvidence:
  requestStatus: <not-required, recorded, or applied>
  installationStatus: <not-required, current, update-required, or unknown>
  verificationMethod: <not-required, runtime-request, or app-configuration-and-installation>
  verificationResult: <not-required, succeeded, or blocked>
  details: <exact configuration/install evidence or successful request status and ID>
capabilityStatus: <verified or blocked>
canonicalUrlSource: <official metadata field or not applicable>
```

- Match the method to the execution host, identity, and permissions. A matching name, available TypeScript type, package installation, or successful build is not evidence that a host channel exists at runtime.
- Verify required scopes against the app's actual granted permissions before implementation. Documentation that names a scope, a package being installed, a successful build, or `auth.elevate()` is not proof of a grant. `auth.elevate()` changes the identity used for an authorized call; it does not add scopes or bypass app installation consent.
- Call an available permission-recording tool immediately after identifying `requiredScopes`, before writing `permissionEvidence`, route preflight, or implementation. Treat output such as `recorded` or `declared` as a pending request: use `requestStatus: recorded`, `installationStatus: unknown`, `verificationResult: blocked`, and `permissionStatus: blocked`.
- For a scoped API, set `permissionStatus: verified` only when `permissionEvidence` is structured, `requestStatus` is `applied`, `installationStatus` is `current`, and `verificationResult` is `succeeded`. `runtime-request` evidence must name a successful `2xx` request and request ID. `app-configuration-and-installation` evidence must name the inspected granted configuration plus the completed update or reinstall. A permission-tool receipt is never either form of evidence. For an API with no required scopes, use `not-required` for all four evidence states. Free-form evidence is invalid.
- Set `capabilityStatus: verified` only when `hostEvidence` names the exact method and explicitly supported execution host. Otherwise mark the capability `blocked`.
- If tooling can add a missing scope, add it and complete any required app update/reinstall before setting `permissionStatus: verified`. Otherwise set both permission or capability status to `blocked`, report the exact scope and user action, and stop. Do not generate a page that can only fail with `401` or `403`.
- Do not call Site-only frontend host methods from Dashboard or backend code unless the exact method documentation or installed schema explicitly lists that execution host. A backend route does not make a frontend-only API supported. If support is unclear, use a documented service that supports the selected host; do not guess a replacement API.
- For schema-discovery APIs, discover the current site's identifiers and fields at runtime instead of copying sample or environment-specific values. In particular, call Analytics Semantic Model `listSemanticModels`, select the intended model from the response, then call `getSemanticModel` and use only returned field names before `querySemanticModelData`. Do not hard-code a semantic-model UUID or `traffic.*` fields.
- For site-page inventory, verify both the page-list method and the source of the canonical published base URL. A published-URL API proves only the base URL; it does not prove page-list access. Never derive a public site URL by rewriting `window.location.origin`, a dashboard URL, or an editor URL.
- Do not replace an unavailable Wix page-list capability with guessed REST paths, slug inference, HTML scraping, or `sitemap.xml` parsing unless the user explicitly chose that external-data behavior and its limitations are part of the product contract. If no documented API provides the requested regular-site page inventory, set `capabilityStatus: blocked` instead of declaring the dashboard ready.
- Validate response shape and API-reported errors before mapping data. Distinguish permission failure, unavailable host method, no published site, and an empty page list.
- Preserve the original exception in diagnostic output before showing a concise user-facing error. Return and render stable failure states: `MISSING_PERMISSION`, `UNSUPPORTED_CAPABILITY`, `SITE_UNPUBLISHED`, or `TRANSIENT_FAILURE`. Backend routes and `src/modules` web methods that call permissioned Wix APIs must inspect SDK status from `error.status` or `error.response?.status`, map `401`/`403` to `MISSING_PERMISSION` with `requiredScopes`, and reserve generic `5xx` responses for transient failures. Dashboard consumers must render the permission state and its setup action separately from transient retry. Never render serialized SDK error JSON in the page. Offer Retry only for `TRANSIENT_FAILURE`.
- When runtime access is unavailable, report the host/API check as `blocked` with the exact Dashboard route and console/network verification required. Do not report the capability as ready after typecheck or build alone.

### 0. Choose the Data Source

| Source | Action |
| --- | --- |
| Existing site CMS collection | Resolve the existing collection by supplied ID, clear name, or verified site context. Do not create an app-owned collection. |
| New app-owned data | Create a Data Collection extension, obtain the app namespace, and use its scoped collection ID. |
| Wix business data or external API | Read the matching API reference. Create a CMS collection only when app-owned persistence is explicitly required. |
| Unknown | Inspect available context or ask one targeted question before choosing storage. |

### 1. Schema

For new app-owned collections, define fields, indexes, permissions, and reference fields. Obtain the required namespace and use the scoped collection identifier. For existing collections, inspect the actual schema before relying on a field name or type.

### 1a. Managed Entity And Workset

Name the entity whose lifecycle the dashboard manages before selecting actions. A queue, exception, alert, or saved subset is often a derived workset over entities such as orders, bookings, or products rather than a separately created/deleted entity.

- Create and delete actions must follow the managed entity's real lifecycle, not generic CRUD availability.
- A processing queue should normally preserve records and transition workflow state, such as `reviewed`, `resolved`, or `assigned`.
- Label actions for the user outcome: `View`, `Edit`, `Mark as reviewed`, or `Resolve`; do not substitute a generic `Update`.

### 2. Relationship Data

Creating a reference field does not populate it. Decide how existing and future records receive relationship values:

- migration or initial-data strategy;
- user assignment workflow;
- validation for missing or invalid references;
- behavior for records with no relationship.

### 3. Manager Workflow

If a manager must assign a relationship from the dashboard, implement a discoverable write flow. The flow must:

1. show available target records;
2. persist the chosen reference on the source record;
3. refresh the table/detail surface;
4. communicate failure without losing context.

### 4. Mutation Readiness

Treat the availability of every write action as part of the workflow, not as decoration. A create, save, assign, resolve, or status-change action must be enabled only when a meaningful, valid mutation can be persisted.

- Capture the loaded value as the initial state and derive a semantic `isDirty`/`canSave` value from the current form state.
- Disable the action when there is no meaningful change, required input is invalid or absent, or a request is already in flight.
- Allow an intentional clear of an existing optional value when that is a valid persisted change; reverting a new value back to its original value is not a change.
- Guard the write handler as well as the control. A no-op click must not issue a data write.
- After success, refresh the initial state or close the workflow; after recoverable failure, preserve the entered value and restore the action only when the mutation remains valid.

### 5. Operational Derived State

When a recurring manager workset depends on OR logic, field comparisons, or elapsed time, persist a queryable operational field instead of moving the collection UI to a custom table. Record:

1. the canonical field and values, such as `needsAttention`, `exceptionType`, `exceptionSince`, or `inventoryStatus`;
2. the write/event/scheduled process that maintains it, including backfill;
3. its behavior when source data is missing;
4. the actual filter-plus-sort query shape.

Create only the most important indexes allowed by the collection. When the runtime query filters and sorts together, validate whether it needs a compound index; a successful build does not prove that query works on the live collection.

### Data Contract

Before building, write down the managed entity, physical source collection(s), derived worksets, required display fields, allowed lifecycle actions, missing-value treatment, and mutation path. For relationships, also record the target collection and reference field. Do not rely on implied naming such as `classRef` without verifying the actual schema.

## Visualizations

Charts and KPI cards are custom dashboard capabilities unless a documented Auto Patterns component supports the exact requirement. WDS provides surrounding dashboard layout and metrics components, not an assumed chart implementation.

### Canonical Implementation References

Use the analytics route for custom-page responsibilities and chart/table composition, and the WDS component gate for layout lookups. Before coding a chart, identify an installed or explicitly approved chart library, then read its exact API and example for the chosen chart type. If no chart library is available, do not invent one; report the dependency gap. This guide does not define a chart library or invent an Auto Patterns chart capability.

### Plan First

For each metric or chart, define:

- source collection or endpoint;
- aggregation and time range;
- expected response shape;
- zero-data behavior;
- loading, error, and partial-data behavior;
- interaction, such as filtering or drill-in;
- accessibility equivalent for visual values.

### Runtime Guardrails

- Validate every response before reading chart series, metric values, or labels.
- Never replace the entire dashboard with a blank page when one visualization fails.
- Keep a stable page shell and render a localized error or retry affordance for the failed capability.
- Do not claim an Auto Patterns chart/statistics widget exists without checking the installed package or its documented catalog.

### Containment

- A chart belongs to a bounded region inside its Card. Its library owns drawing and responsive sizing; do not allow a canvas or SVG to expand into the following table or page region.
- For Chart.js, follow its responsive-container guidance. When the dashboard allocates a chart height, use `responsive: true` and `maintainAspectRatio: false`; do not pair a fixed-height parent with `maintainAspectRatio: true`.
- Validate chart containment at the widest and narrowest supported dashboard widths before completion. Do not use page-level clipping as a substitute for correct chart sizing.

## Runtime Validation

The selected dashboard route owns its acceptance criteria. Apply this common gate after implementation.

1. Open the real Dashboard Page and complete the primary workflow with known data.
2. Inspect browser console and failed network requests from initial load through the final action.
3. Exercise loading, empty source, no-results, permission/error, and populated states that apply.
4. Verify every filter against a known stored value and confirm its recovery path.
5. Complete every primary row, bulk, panel, or modal mutation and refresh to confirm persistence.
6. Test the densest record and narrowest supported viewport for overlap, clipping, hidden actions, or page-level overflow.
7. Run `node "$HOME/.agents/skills/wix-app/scripts/audit-dashboard-code.mjs" <dashboard-source-directory> [each referenced backend endpoint]` for custom WDS dashboards before delegating build validation. This audit is blocking; do not continue after a non-zero result, and a successful build does not replace it.

Classify failures as routing, schema/data, implementation, or runtime validation. Report `passed`, `failed`, or `blocked`; a successful build alone is not runtime evidence.
