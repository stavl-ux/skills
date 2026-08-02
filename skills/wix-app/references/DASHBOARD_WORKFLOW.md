# Dashboard Operational Workflow

Every record dashboard must move the user from signal to confirmed outcome. “Understand” supplies context; the operational loop is **Focus → Investigate → Act → Verify**. These needs may share screens.

## Contents

- [Workflow contract](#workflow-contract)
- [Focus](#focus)
- [Investigate](#investigate)
- [Act](#act)
- [Verify](#verify)
- [Route-independent rules](#route-independent-rules)

## Workflow Contract

Define the contract before JSX or Auto Patterns overrides:

```json
{
  "workflow": {
    "intent": {
      "actorRole": "catalog operator",
      "primaryJob": "resolve product issues without editing source product content"
    },
    "focus": {
      "defaultWorkset": "Products needing attention",
      "controls": ["issue filter", "search", "sort"]
    },
    "investigate": {
      "required": true,
      "surface": "entity-page",
      "surfaceReason": "The owning product manager provides the deep source-of-truth record",
      "preserveCollectionContext": false,
      "evidenceMode": "read-only",
      "identityField": "_id",
      "fields": ["name", "issues", "inventory", "media"]
    },
    "editing": {
      "required": false,
      "editableFields": [],
      "transitionFields": [],
      "reason": "Product editing remains in the owning Wix application"
    },
    "actions": [
      {
        "id": "manage-product",
        "kind": "owning-app-navigation",
        "target": "verified product management route",
        "surfaces": ["row", "detail"]
      }
    ],
    "verify": {
      "postcondition": "Updated product no longer appears in unresolved worksets",
      "refresh": ["collection", "views", "counts", "detail", "selection"]
    }
  }
}
```

Custom and hybrid routes store this under `workflow` in `.dashboard-route.json`. Standard Auto Patterns pages express the same contract through page configuration, entity/action resolvers, and generator input. Static declarations are not enough; implementation and runtime evidence must match them.

## Focus

Start with a meaningful workset rather than an undifferentiated dump:

- default to records that need attention when the product goal is operational;
- preserve an honest path to all records when appropriate;
- provide only useful search, filters, sorting, and Saved Views;
- show the active scope, result count, freshness, and relevant loading state;
- distinguish empty source, no matching results, permission failure, synchronization failure, and transient error.

Focus controls must use stored values and maintained fields. Filter complexity does not justify replacing a one-collection Auto Patterns table.

## Investigate

Every actionable record table needs a real drill-in. Valid surfaces are:

- an Auto Patterns entity page;
- a contextual WDS SidePanel mounted through the documented extension path;
- a bounded Dashboard Modal when the task is short and blocking;
- verified navigation to the owning Wix management record.

The surface must receive a stable record identity and show enough context to explain the signal and decide what to do next. A toast, console log, selected-row highlight, or repeated table values is not investigation. Row click and the visible action must open the same destination.

Choose investigation mode from the actor's job, not collection permission. Separate evidence, bounded decision inputs, transition fields, and authoritative editable fields. `itemUpdate` permits allowed mutations; it does not require a general editor.

Prefer SidePanel for moderate inspection and bounded decisions that benefit from queue context; prefer a view entity page for deep, long, multi-section, or linkable inspection; use edit mode only when authoritative editing belongs to the job. These are heuristics, not component rules. Record the reason, context need, evidence mode, and editing policy.

## Act

An action must cause a real, permission-valid outcome:

- persist a mutation through the owning collection or supported API;
- launch a documented editor or management route for the exact record;
- start a real assignment, resolution, export, or communication flow.

Do not render actions whose only effect is a toast, console output, empty callback, or local state unrelated to a real surface. Do not label a control View, Inspect, Details, Edit, Fix, Resolve, or Delete unless its implementation performs that operation. If the source is read-only, navigate to the owning manager or explain that no action is available; do not simulate success.

The investigation surface must continue the same operational job. Keep the primary action and every workflow action offered on a row available after drill-in; do not replace decisions such as Approve or Request Changes with generic Save/Cancel. When a transition needs an explanation, collect that bounded input before persistence. Render evidence for comprehension; do not expose rich content as raw markup unless source editing is intended.

Selection is actionable state. Show selection controls only when at least one real bulk action consumes the selected stable IDs.

## Verify

Verification is part of the action, not a later manual refresh:

1. Await persistence or navigation handoff.
2. Handle permission, validation, conflict, and transient failures separately.
3. Re-fetch canonical data after a mutation.
4. Call `refreshCollection()` when Auto Patterns owns the collection.
5. Refresh affected Views, counts, metrics, detail content, and selected IDs.
6. When a transition changes active filter or View membership, remove the record from every non-matching workset immediately after success without navigation or manual reload.
7. Confirm the intended postcondition in the rendered state and its destination workset.
8. Display a success toast only after success is known.

Never optimistically remove a record from a workset without reconciling against canonical data. A Retry button is recovery from failure, not verification of an action.

## Route-Independent Rules

- **WF-01:** Every populated record table must provide a real investigation surface. A custom route must declare and implement `detailSurface`; Auto Patterns must configure an entity page, row action, or documented supplemental detail surface.
- **WF-02:** A visible action must have a real effect. Reject toast-only, console-only, empty, unresolved-target, and static-state handlers. Toasts are feedback only.
- **WF-03:** Selection controls require at least one real bulk operation that consumes selected stable IDs. Otherwise remove selection.
- **WF-04:** A mutation must be awaited and followed by canonical refresh of every affected workflow surface. Membership-changing transitions must also re-evaluate the active View immediately and reconcile without a manual reload. Success feedback occurs afterward.
- **WF-05:** Investigation, action, and verification requirements apply to Auto Patterns and custom WDS implementations equally.
- **WF-06:** Investigation mode must match the declared actor, field policy, and primary job. Update permission alone never requires general editing; a decision surface keeps the defining actions available, while an edit surface appears only when authoritative field editing is declared.
