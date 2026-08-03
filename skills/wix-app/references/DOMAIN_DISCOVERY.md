# Dashboard Context And Domain Discovery

Gather bounded, read-only context before translating a dashboard request into the five WHATs. Discovery supplies verified facts and useful terminology; it does not choose the interface or redefine the user's outcome.

## Contents

- [Two-pass discovery](#two-pass-discovery)
- [Discovery contract](#discovery-contract)
- [Capability verification](#capability-verification)
- [Uncertainty and user questions](#uncertainty-and-user-questions)
- [Discovery rules](#discovery-rules)

## Two-Pass Discovery

### Pass A: Context Reconnaissance

Before [DASHBOARD_WORKFLOW.md](DASHBOARD_WORKFLOW.md), inspect only the context that can materially improve interpretation:

1. Read the existing project, dashboard extensions, `patterns.json`, route records, collection declarations, and installed integrations.
2. Identify likely business entities, their owning systems, stable identity, existing management surfaces, and the site's established terminology.
3. Discover available schemas and operations through the narrowest verified project or tool source. Do not enumerate unrelated APIs or applications.
4. Record constraints, existing entities that should be reused, and unresolved questions. Do not create data, request permissions, or mutate infrastructure during reconnaissance.
5. Pass these facts to the five-WHAT gate. Treat them as evidence, not as requirements.

### Pass B: Targeted Verification

After the five WHATs identify required actions, verify only those capabilities before data routing or implementation:

1. Resolve the exact operation, execution owner, execution host, identifier source, required scopes, and permission state.
2. Copy identifiers, action keys, payload fields, routes, and schemas from verified results. Never reconstruct opaque values from memory or infer them from display labels.
3. Record dependencies between capabilities. Complete prerequisite discovery before using a dependent result.
4. Mark unavailable behavior `unsupported` and reconcile it with the journey. Do not substitute a toast, local state, or an invented operation.
5. Ask the user only when a remaining material choice cannot be resolved from the project or verified capabilities.

## Discovery Contract

Record discovery before `workflow`, `dataFoundation`, or `presentation` in `dashboard-contract.json` or `.dashboard-route.json`:

```json
{
  "discovery": {
    "context": {
      "businessDomain": "content operations",
      "actorContext": ["reviewer"],
      "terminology": {
        "record": "Submission",
        "completedState": "Approved"
      }
    },
    "entities": [
      {
        "id": "submission",
        "name": "Submission",
        "system": "native CMS",
        "identityField": "_id",
        "identitySource": "verified collection metadata",
        "source": "existing ContentSubmissions collection"
      }
    ],
    "existingSurfaces": [],
    "capabilities": [
      {
        "id": "request-changes",
        "entityId": "submission",
        "effect": "persist reviewer feedback and transition status",
        "support": "verified",
        "source": "verified collection update capability",
        "executionOwner": "ContentSubmissions collection",
        "executionHost": "dashboard",
        "permission": {
          "status": "verified",
          "requiredScopes": ["collection update"],
          "evidence": "installed app grant and collection permissions"
        },
        "dependencies": []
      }
    ],
    "constraints": [],
    "unresolved": []
  }
}
```

Use stable local IDs such as `submission` and `request-changes` to connect later contracts. `dataFoundation.discoveryEntityId` references the discovered entity. Every workflow action references its verified operation through `capabilityId`.

An existing surface entry uses `{ "id", "name", "owner", "purpose" }`. An unresolved entry uses `{ "question", "impact" }`, where impact is `blocking`, `material`, or `minor`. Resolve blocking and material uncertainty before generation.

## Capability Verification

Treat capability support and permission as separate facts:

- `support: verified` means the operation exists for the selected entity and host.
- `support: unsupported` means the required operation was checked and is unavailable.
- `support: unknown` means discovery is incomplete; it is never implementation evidence.
- `permission.status: verified` means the required app and data grants were checked.
- `permission.status: not-required` requires evidence that the operation needs no app scope.
- `permission.status: missing` or `unknown` blocks that action.

For compound work, represent each independently observable effect as a capability or dependency. Report partial failure honestly. For revisioned or replacement operations, record the concurrency requirement in the capability effect or constraint, then carry it into Verify.

Domain discovery does not bypass [DATA_FOUNDATION.md](DATA_FOUNDATION.md). A verified vertical API operation may own an action while the managed record surface still resolves through a collection. Check collection eligibility before choosing Auto Patterns or custom UI.

## Uncertainty And User Questions

Do not ask the user to provide context the project or available tools can establish. Ask one focused question when:

- two plausible business entities imply materially different outcomes;
- the user must choose between an internal transition and an owning-product action;
- a destructive or externally visible effect was not explicitly requested;
- the desired outcome cannot survive a verified capability limitation without changing scope.

Preserve the user's answer in the discovery or workflow contract. Do not treat a likely domain convention as consent for an email, notification, deletion, publication, payment, or other external effect.

## Discovery Rules

- **DD-01:** Complete bounded context reconnaissance before the five-WHAT breakdown. Inspect relevant project and site context without mutating it.
- **DD-02:** Keep discovery factual and solution-independent. Existing capabilities inform the journey but never silently redefine the requested outcome.
- **DD-03:** Record stable identity and provenance for every managed entity. Never invent or reconstruct opaque identifiers, action keys, payload fields, schemas, or routes.
- **DD-04:** Bind every workflow action to one verified discovery capability. Unknown, unsupported, missing-permission, and unresolved capabilities cannot back visible actions.
- **DD-05:** Resolve capability dependencies in order. Never execute or configure a dependent operation with placeholder results from an unfinished prerequisite.
- **DD-06:** Resolve blocking and material uncertainty before generation. Ask only for decisions that inspection and verified tools cannot answer.
- **DD-07:** Treat domain capability, collection eligibility, and presentation as separate decisions. A verified API does not bypass data-foundation or route gates.
- **DD-08:** Require explicit user intent for destructive or externally visible effects. Domain conventions and available permissions are not consent.
