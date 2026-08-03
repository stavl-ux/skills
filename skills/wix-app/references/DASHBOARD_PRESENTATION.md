# Dashboard Presentation Success

Translate the completed workflow and resolved data foundation into a presentation contract before routing or choosing components. Presentation success determines how the journey is expressed; it does not redefine the user outcome, invent data, or prescribe one interface for every scenario.

## Contents

- [Presentation contract](#presentation-contract)
- [Choose the primary representation](#choose-the-primary-representation)
- [Choose the drill-in](#choose-the-drill-in)
- [Compose the workflow](#compose-the-workflow)
- [Keep meaning and state consistent](#keep-meaning-and-state-consistent)
- [Evaluate presentation success](#evaluate-presentation-success)

## Presentation Contract

Record the presentation decision after completing [DASHBOARD_WORKFLOW.md](DASHBOARD_WORKFLOW.md) and [DATA_FOUNDATION.md](DATA_FOUNDATION.md), and before selecting [AUTO_PATTERNS_DASHBOARD.md](AUTO_PATTERNS_DASHBOARD.md) or [DASHBOARD_ROUTING.md](DASHBOARD_ROUTING.md):

```json
{
  "presentation": {
    "primaryRepresentation": {
      "type": "table",
      "reason": "Accounts must be compared across risk, value, owner, and renewal date"
    },
    "supportingRepresentations": [
      {
        "type": "summary-metrics",
        "reason": "Value at risk provides a quick renewal-health signal",
        "dataScope": "active-workset"
      }
    ],
    "drillIn": {
      "interface": "side-panel",
      "reason": "The user is likely to review several accounts while preserving queue context",
      "preservesContext": true
    },
    "stageEmphasis": {
      "understand": ["renewal outlook", "value at risk"],
      "focus": ["high-risk accounts", "upcoming renewals"],
      "investigate": ["risk reason", "renewal evidence", "current follow-up"],
      "act": ["assign owner", "update next step", "complete follow-up"],
      "verify": ["updated metrics", "updated queue membership"]
    },
    "actionPresentation": {
      "actionIds": ["assign-owner", "update-next-step", "complete-follow-up"],
      "prominence": "immediate",
      "relationshipToEvidence": "adjacent"
    },
    "consistency": ["filters", "views", "metrics", "selected record", "detail"]
  }
}
```

Treat `reason` as the important part of each choice. Prefer a different representation or interface when the task, information depth, interaction duration, context needs, or verified platform capability makes it a better fit. When routing requires an adapted implementation, preserve the presentation intent and record `drillIn.adaptationReason` rather than silently changing the experience.

Charts and metrics declare `dataScope`: `active-workset` follows filters; `entire-collection` remains visibly global.

## Choose The Primary Representation

Choose the default representation that best supports the primary task. Add another representation when it answers a distinct question or materially improves the workflow.

| Representation | Consider when | Presentation succeeds when |
| --- | --- | --- |
| **Table** | Users compare many records across several attributes. | Records are easy to scan, compare, filter, select, and act on. |
| **Gallery** | Visual recognition is central to identifying or evaluating items. | Imagery carries meaning while status and actions remain discoverable. |
| **List** | Items have one dominant identity and limited supporting detail. | Users can scan quickly without unnecessary density. |
| **Kanban** | Work moves through meaningful stages and movement itself is part of the task. | Stage, workload, and valid transitions are understandable. |
| **Timeline or calendar** | Time, sequence, availability, or scheduling drives decisions. | Upcoming activity, conflicts, and timing are clear. |
| **Chart** | The user needs to understand a trend, distribution, or relationship. | The visualization answers a specific business question and connects to relevant records. |
| **Summary metrics** | The user needs a quick health or scope signal. | Metrics clarify current conditions and direct attention to the underlying work. |

Use the data shape as evidence, not as the sole decision. A collection does not automatically require a table, and the availability of a chart does not make it useful. Preserve the owning record workflow when a supplemental representation is added.

## Choose The Drill-In

Choose the smallest interface that provides enough context and room to investigate and act. These are defaults that invite contextual judgment.

| Interface | Consider when | Presentation succeeds when |
| --- | --- | --- |
| **Inline or expanded row** | The user needs quick inspection or a simple action. | Detail appears without creating a separate workspace or disrupting comparison. |
| **Side panel** | Reviewing or updating one item benefits from keeping the dashboard visible. | Collection context is preserved while deeper work remains focused. |
| **Modal** | The user needs to complete a focused, bounded task or decision. | Attention stays on one task and the user returns cleanly afterward. |
| **Entity page** | The task involves complex detail, history, related information, extended editing, or deep linking. | The user has enough space and structure for deeper work. |
| **Owning-app navigation** | Another verified Wix surface owns the authoritative task. | The selected record opens at the correct destination with a clear handoff. |

Consider information depth, task duration, validation complexity, repetition across a queue, need for collection context, destructive consequences, and deep-linking needs together. Record why the selected interface fits those signals.

Repeated inspect-and-act work across a queue usually benefits from a SidePanel when the evidence and bounded actions fit comfortably beside the collection. This lets the user compare, inspect, decide, and advance without repeatedly leaving the workset. An entity page remains a strong fit for deep history, broad related data, long-form work, complex validation, or deep linking.

When an entity page is the better fit, compose its first visible region around the operational job. Keep the investigation evidence and named actions perceptually adjacent—for example, evidence on the left and an action region on the right, or visible actions in the header. Actions that define the requested outcome should not be discoverable only after scrolling or through a generic overflow menu.

## Compose The Workflow

Express Understand → Focus → Investigate → Act → Verify through hierarchy rather than treating each stage as a required screen.

- Lead with the smallest set of summaries, status indicators, and freshness cues that explain the current situation.
- Give the active workset, filters, sorting, saved views, alerts, and primary next action enough prominence to direct attention.
- Reveal investigation evidence progressively and preserve the user's place when repeated decisions benefit from context.
- Distinguish evidence from action inputs. Prefer readable evidence and clearly identifiable workflow actions when maintaining the source record is not the user's main job.
- Give named operational outcomes such as approve, assign, escalate, resolve, or complete greater prominence than generic editing controls when those outcomes define the task.
- Preserve every named workflow action through drill-in. `actionPresentation.actionIds` identifies the actions the selected interface must expose; do not silently reduce that set while adapting the layout.
- Keep editable inputs proportional to the action. A bounded update may need one or two inputs without turning the surrounding record into a general editor.
- Show confirmation where the user will look next: the selected record, active workset, counts, summaries, history, or owning destination.

General edit mode can be a good fit when maintaining authoritative record content is part of the desired outcome. A view-oriented surface with explicit actions can be a better fit when evidence supports a decision or transition. Treat this as a responsibility question rather than a permission or component rule.

## Keep Meaning And State Consistent

- Reuse understandable names, status meaning, formatting, and action labels across summaries, representations, and detail.
- Keep filters, sorting, selected record, and workset meaning coherent when users switch representations or return from drill-in.
- Connect summaries and visualizations to the records that explain them.
- Derive `active-workset` summaries from filtered records.
- Make loading, source-empty, no-results, access, connection, synchronization, and system-error states visually distinct and useful.
- Reconcile affected representations after an action so the confirmed business state appears everywhere relevant.

## Evaluate Presentation Success

Use these questions before implementation and again during runtime validation:

1. Does the default representation make the primary task easier to understand and complete?
2. Can the user recognize what matters and where to act?
3. Does drill-in provide enough evidence without unnecessary loss of context?
4. Are investigation and action legible as distinct responsibilities within one workflow?
5. Are editable inputs limited to what the chosen action or authoritative editing responsibility requires?
6. Do layout, actions, empty states, and feedback remain coherent across the five workflow stages?
7. After a change, do summaries, records, filters, views, and detail tell the same story?
8. Is every promised action available where the user has enough evidence to take it, with a label that matches its actual destination or effect?

Presentation success is achieved when the user can understand the situation, focus on the right work, investigate confidently, complete the intended task, and recognize the confirmed result through an interface suited to that work.
