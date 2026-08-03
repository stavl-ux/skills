# Dashboard Operational Workflow

Interpret every record-dashboard request before data resolution or routing. The five WHATs define **Understand → Focus → Investigate → Act → Verify**.

## Contents

- [Five-WHAT gate](#five-what-gate)
- [Workflow contract](#workflow-contract)
- [Understand and Focus](#understand-and-focus)
- [Investigate](#investigate)
- [Act](#act)
- [Verify](#verify)
- [Route-independent rules](#route-independent-rules)

## Five-WHAT Gate

Answer these before naming data, routes, or components:

1. What outcome is the actor trying to achieve?
2. What must the actor understand before acting?
3. What requires deeper investigation?
4. Which real actions must be available?
5. What visible result will confirm success?

Treat answers as requirements, not UI selections. Record uncertainty. Surface capability conflicts; never substitute placeholder behavior.

## Workflow Contract

Define `workflow` before the data-foundation contract, JSX, Auto Patterns configuration, or route selection:

```json
{
  "workflow": {
    "journey": {
      "outcome": {
        "actorRole": "content reviewer",
        "desiredOutcome": "decide whether submitted content can be published"
      },
      "understand": {
        "questions": ["What needs review first?"],
        "signals": ["status", "risk", "overdue"]
      },
      "focus": {
        "defaultWorkset": "Pending submissions",
        "controls": ["risk filter", "search", "sort"]
      },
      "investigate": {
        "questions": ["Is this submission safe and publication-ready?"],
        "evidenceFields": ["body", "riskReasons", "author", "reviewHistory"],
        "contextPriority": "high"
      },
      "act": {
        "actions": [
          {
            "id": "request-changes",
            "kind": "mutation",
            "operation": "transition",
            "target": "submission collection",
            "surfaces": ["row", "detail"],
            "decisionInputFields": ["reviewerNotes", "changesRequested"],
            "transitionFields": ["status"],
            "authoritativeEditableFields": []
          }
        ]
      },
      "verify": {
        "visibleResult": "The reviewed submission leaves the pending queue",
        "postconditions": ["status is persisted", "pending count decreases"],
        "refresh": ["collection", "views", "counts", "detail", "selection"]
      }
    },
    "implementation": {
      "investigationSurface": "side-panel",
      "surfaceReason": "The reviewer benefits from preserving queue context while reading and deciding",
      "preserveCollectionContext": true,
      "evidenceMode": "read-only",
      "identityField": "_id"
    }
  }
}
```

Keep `journey` solution-independent. Add `implementation` after routing. Store it in `.dashboard-route.json` or `dashboard-contract.json`. Runtime behavior must match it.

## Understand and Focus

Show the smallest useful signals and a meaningful workset:

- default to records that require action when the outcome is operational;
- preserve an honest path to all records when appropriate;
- provide only useful search, filters, sorting, and Saved Views;
- show scope, count, freshness, and loading state;
- distinguish empty source, no matching results, permission failure, synchronization failure, and transient error.

Use stored, maintained fields. Filter complexity does not justify replacing Auto Patterns.

## Investigate

Every actionable table needs real drill-in. Choose a surface after defining questions, evidence, depth, and context needs. Valid surfaces are an entity view, documented SidePanel, Dashboard Modal, or verified owning-record navigation.

Prefer SidePanel for bounded decisions needing queue context and a view entity page for deep or linkable inspection. Use edit mode only for authoritative editing. Record the reason; these are heuristics.

Use stable identity and sufficient evidence. Toasts, selection, logs, or repeated row values are not investigation. Row click and its action open the same destination.

## Act

Classify fields before selecting entity mode:

- `decisionInputFields` collect bounded information needed to complete an action;
- `transitionFields` are changed by the workflow action;
- `authoritativeEditableFields` are source content the actor is responsible for editing generally.

Keep sets disjoint. Decision and transition fields never imply general editing. Generate edit mode only for `authoritativeEditableFields`, and creation only for an explicit `create` operation.

Every action must persist, navigate to a verified owner, or start a real flow. Preserve row actions after drill-in; never replace decisions with generic Save/Cancel or render placeholder handlers.

## Verify

Make verification part of the action:

1. Await persistence or navigation handoff.
2. Handle permission, validation, conflict, and transient failures separately.
3. Re-fetch canonical data after a mutation.
4. Call `refreshCollection()` when Auto Patterns owns the collection.
5. Refresh every declared View, count, metric, detail surface, and selected ID.
6. Remove a transitioned record from every non-matching active workset immediately after confirmed success.
7. Confirm the declared visible result and postconditions in rendered state.
8. Display success feedback only after success is known.

Never optimistically remove a record without reconciling canonical data. Retry recovers a failure; it does not verify success.

## Route-Independent Rules

- **WF-01:** Complete all five WHATs before data or route selection. Every actionable table then provides stable-identity investigation with evidence that answers them.
- **WF-02:** Every visible action has a real, permission-valid effect. Reject toast-only, console-only, empty, unresolved-target, and static-state handlers.
- **WF-03:** Show selection only when a real bulk operation consumes selected stable IDs.
- **WF-04:** Await mutations and reconcile canonical collection data, Views, counts, detail, and selection. Confirm visible success without manual reload.
- **WF-05:** Apply the journey equally to Auto Patterns and custom WDS routes. Routing never weakens the workflow.
- **WF-06:** Keep decision, transition, and authoritative fields disjoint. Only authoritative editing permits a general editor; preserve row actions on detail.
- **WF-07:** Generate creation only for an explicit `create` operation. Insert permission alone is insufficient.
