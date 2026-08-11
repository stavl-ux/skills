# Dashboard Data Foundation

Receive discovered entities and capabilities from [DOMAIN_DISCOVERY.md](DOMAIN_DISCOVERY.md) plus the completed five-WHAT journey from [DASHBOARD_WORKFLOW.md](DASHBOARD_WORKFLOW.md), then resolve data ownership before selecting UI. After resolution, use [DASHBOARD_PRESENTATION.md](DASHBOARD_PRESENTATION.md) to express the journey through representations and interaction surfaces that fit the verified data. The goal is an Auto Patterns-compatible collection interface: real schema, stable identity, permissions, and a supported source-of-truth path. Source origin—API, Wix vertical, or multiple systems—does not determine table ownership.

## Contents

- [Resolution order](#resolution-order)
- [Foundation contract](#foundation-contract)
- [Source types](#source-types)
- [Derived collections](#derived-collections)
- [Failure rules](#failure-rules)

## Resolution Order

1. Preserve the journey's required outcome, evidence, actions, and visible success criteria while consuming the discovery contract. Do not repeat broad domain discovery.
2. Resolve each discovered entity to its authoritative data system and verify that identity agrees with discovery provenance.
3. Resolve each system to one of the supported collection surfaces below.
4. Inspect collection metadata and a representative query before designing the UI.
5. Decide whether the user needs a standard record workspace. If so, resolve the data to one Auto Patterns-compatible collection interface; multiple upstream systems may be represented by a maintained projection only when its contract below is complete.
6. Record any mismatch between required actions and verified capabilities instead of weakening the journey silently.
7. Start the table/workspace on Auto Patterns. Move collection ownership to custom WDS only after [AUTO_PATTERNS_DASHBOARD.md](AUTO_PATTERNS_DASHBOARD.md) records a specific unsupported capability that a compatible record interface cannot solve.

Do not create a collection merely to satisfy this gate. The collection must be the real source of truth or have the maintained projection contract described below. This preserves Auto Patterns as the presentation default without creating unowned copies of business data.

## Foundation Contract

Record this information before generation. Custom and hybrid dashboards place it in `.dashboard-route.json`; standard Auto Patterns pages place the same decisions in generator input and `patterns.json` ownership:

| Field | Required evidence |
| --- | --- |
| Discovery entity | Stable `discoveryEntityId` from the discovery contract |
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
      "discoveryEntityId": "product",
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

Never treat discovery or this record as proof by itself. Domain capability establishes what an operation can do; the foundation separately establishes how records are read and managed. The audit and runtime verification must agree with the implementation.

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

### Multiple Source Systems

Do not let the number of systems choose the table. For a unified workspace, first determine whether a maintained projection can provide the needed schema, identity, freshness, and write ownership. If it can, keep Auto Patterns. If it cannot, document the unmet requirement and evaluate the exact unsupported Auto Patterns capability; never use a static React array as an implicit data layer.

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

- **DF-01:** A dashboard record workspace defaults to Auto Patterns. A custom WDS table cannot be justified by source count, API origin, mock data, computed flags, filters, joins that have a viable maintained projection, or unsupported neighboring analytics. Custom table ownership requires a recorded, table-specific unsupported Auto Patterns capability.
- **DF-02:** If a required business or external source has no verified compatible collection interface, stop and report the missing foundation. Do not fabricate a driver, infer a schema, or bypass the gate with a custom table.
- **DF-03:** Do not collapse permission, transport, schema, synchronization, and not-installed failures into one empty-data or not-installed state. Preserve the original error and map verified categories separately.
- **DF-04:** Do not insert sample records into a live source or operational projection to hide unavailable data. Use isolated fixtures or an explicit development-only path.
- **DF-05:** A derived collection without the complete maintenance contract is not an eligible dashboard source.
