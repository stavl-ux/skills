# Dashboard Data Foundation

Receive the completed five-WHAT journey from [DASHBOARD_WORKFLOW.md](DASHBOARD_WORKFLOW.md), then resolve data ownership before selecting a route or component. After resolution, use [DASHBOARD_PRESENTATION.md](DASHBOARD_PRESENTATION.md) to express the journey through representations and interaction surfaces that fit the verified data. The goal is a CMS collection interface with a real schema, stable record identity, known permissions, and a supported source-of-truth path. A backend API response is not itself a reason to build a custom table.

## Contents

- [Resolution order](#resolution-order)
- [Foundation contract](#foundation-contract)
- [Source types](#source-types)
- [Derived collections](#derived-collections)
- [Failure rules](#failure-rules)

## Resolution Order

1. Preserve the journey's required outcome, evidence, actions, and visible success criteria while inspecting the project, enabled Wix applications, declared collections, and installed integrations.
2. Identify the owning data system for every record type.
3. Resolve each system to one of the supported collection surfaces below.
4. Inspect collection metadata and a representative query before designing the UI.
5. Count resolved collection IDs. Multiple API calls against one collection still count as one. A joined record surface backed by two collections counts as two.
6. Record any mismatch between required actions and verified capabilities instead of weakening the journey silently.
7. Exactly one resolved collection selects Auto Patterns. Two or more joined collections may select a custom table after route preflight.

Do not create a collection merely to satisfy this gate. The collection must be the real source of truth or have the maintained projection contract described below.

## Foundation Contract

Record this information before generation. Custom and hybrid dashboards place it in `.dashboard-route.json`; standard Auto Patterns pages place the same decisions in generator input and `patterns.json` ownership:

| Field | Required evidence |
| --- | --- |
| Original system | Native CMS, Wix business app, connected external database, or app-owned data |
| Access mechanism | Native collection, Wix App Collection, external database adaptor, or Data Collections Extension |
| Collection ID | Exact queryable collection ID, not a display label |
| Schema | Verified fields and types used by columns, filters, views, details, and writes |
| Identity | Stable record ID and any owning-app navigation identifier |
| Capabilities | Read, insert, update, remove, query operators, pagination, and reference behavior |
| Permissions | Intended dashboard audience and verified access for every operation |
| Freshness | Whether reads are live, eventually consistent, cached, or projected |
| Write owner | Collection write, owning Wix application, external adaptor, or unavailable |

Recommended route-record shape:

```json
{
  "sources": ["Wix Stores Products"],
  "resolvedCollections": [
    {
      "system": "wix-stores",
      "mechanism": "wix-app-collection",
      "collectionId": "<verified Stores collection ID>",
      "schemaStatus": "verified",
      "read": true,
      "write": false,
      "freshness": "source-managed"
    }
  ]
}
```

Never treat this record as proof by itself. The audit and runtime verification must agree with the implementation.

## Source Types

### Native CMS Collection

Use the existing collection directly. Resolve its exact ID, schema, permissions, indexes, references, and missing-reference behavior. Do not create an app namespace copy.

### Wix App Collection

Wix App Collections expose data owned by Wix business applications through Wix Data. Enabling their visibility in CMS does not make the records app-owned or grant new write capabilities. Inspect the specific collection's fixed schema and permissions, then query it by its documented collection ID.

Use this route for Stores, Bookings, Events, and other Wix application data when the required entity has a Wix App Collection. The dashboard table reads the collection rather than calling the vertical API and adapting the response in React. Mutations use only supported collection operations or navigate to the owning Wix application.

Official reference: [Wix App Collections](https://dev.wix.com/docs/api-reference/business-solutions/cms/collection-management/wix-app-collections/introduction).

### Connected External Database

An external database adaptor translates Wix Data requests to the external system and exposes the result as a collection. Resolve the installed connection and collection first; do not build the dashboard directly on an arbitrary external API when a collection-backed manager is required.

Inspect the adaptor's actual filter, sort, pagination, reference, and write support. A writable-looking schema is not permission evidence. External Database Service Plugins are not currently supported by the Wix CLI framework, so do not fabricate or hand-register one from a CLI app.

Official references: [external database adaptor overview](https://dev.wix.com/docs/develop-websites-sdk/code-your-site/work-with-data/external-databases/overview/about-integrating-external-databases-with-your-wix-site) and [External Database Service Plugin](https://dev.wix.com/docs/api-reference/business-solutions/cms/external-databases/external-database-service-plugin/introduction).

### App-Owned Collection

Use [DATA_COLLECTION.md](DATA_COLLECTION.md) only for records the app genuinely owns: preferences, annotations, workflow state, app configuration, or a deliberately maintained operational projection. The Data Collections Extension is not a generic database driver and must not become an unmaintained copy of Wix business data.

## Derived Collections

A derived operational collection is allowed only when the product requires durable app-owned fields or a join that the original sources cannot expose. Define before implementation:

- authoritative source and stable source ID;
- initial backfill and incremental update mechanism;
- event, polling, or manual reconciliation triggers;
- idempotency and duplicate handling;
- deletion and tombstone behavior;
- freshness indicator and acceptable lag;
- retry, dead-letter, and user-visible failure behavior;
- maintainer and recovery ownership;
- which fields may be edited locally and how conflicts resolve.

The dashboard must read the maintained collection, report stale or failed synchronization honestly, and never swallow persistence errors. Representative development fixtures must remain isolated from live operational data.

## Failure Rules

- **DF-01:** A record table backed by one resolved collection must use Auto Patterns. A custom WDS table cannot be justified by API origin, computed flags, filters, or unsupported neighboring analytics.
- **DF-02:** If a required business or external source has no verified collection interface, stop and report the missing foundation. Do not fabricate a driver, infer a schema, or bypass the gate with a custom table.
- **DF-03:** Do not collapse permission, transport, schema, synchronization, and not-installed failures into one empty-data or not-installed state. Preserve the original error and map verified categories separately.
- **DF-04:** Do not insert sample records into a live source or operational projection to hide unavailable data. Use isolated fixtures or an explicit development-only path.
- **DF-05:** A derived collection without the complete maintenance contract is not an eligible dashboard source.
