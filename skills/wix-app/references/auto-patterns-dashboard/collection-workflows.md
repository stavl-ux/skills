# Auto Patterns Collection Workflows

Use for saved views, collection and row actions, selection, bulk operations, and resolved action behavior.

## Contents

- [Views](#views)
- [Saved View Transitions](#saved-view-transitions)
- [Collection Page Actions](#collection-page-actions)
- [Action Cell](#action-cell)
- [Bulk Actions](#bulk-actions)
- [Resolved Actions](#resolved-actions)

## Views

### When To Use Views

Saved Views are named, saved operational worksets. Use them when the manager needs recurring subsets such as `All products`, `Low stock`, `Discontinued`, or `My queue`.

Views are separate from the collection page layout:

- `layout: [Table, Grid]` enables the built-in Table/Grid **layout switcher**.
- `views` configures named Saved Views, their filters, and optional column preferences.
- Configure both when the user needs both visual representations and named worksets.
- `isDefaultView` selects the default saved View. It does not select Table or Grid as the initial presentation.

The native CMS `Choose layout` dropdown is a different product surface. Do not call it a Saved View. Auto Patterns does not document its `List` layout, a dropdown presentation for the layout switcher, or a `defaultLayout` configuration key.

For a dynamic condition that compares fields, combines predicates, or depends on elapsed time, do not claim that a View calculates it. First provide maintained filterable fields, then configure the View against their documented filter IDs:

- `stockOnHand <= reorderPoint` -> `inventoryStatus`
- unpaid OR unfulfilled for more than 24 hours OR customer issue -> `needsAttention`, `exceptionType`, and `exceptionSince`
- reviewed queue -> `isReviewed`

Define who updates each field on create, source changes, time transitions, and backfill. This remains a one-collection Auto Patterns route; filter complexity is data shaping, not evidence for a custom WDS table.

### Type Definitions
```typescript
interface ViewsConfig {
  enabled?: boolean;
  presets?: ViewsPreset | CategoriesPreset;
  saveViewModalProps?: { placeholderName?: string; learnMore?: { url?: string } };
  viewsDropdownProps?: {
    showTotal?: boolean;
    hideAllItemsView?: boolean;
    customAllItemsViewLabel?: string;
  };
}

interface ViewsPreset {
  type: 'views';
  views: PresetView[];
}

interface CategoriesPreset {
  type: 'categories';
  categories: {
    id: string;
    label: string;
    views: PresetView[];
    icon?: { tooltipContent: string; size?: 'small' | 'medium' };
  }[];
}

interface PresetView {
  id: string; // Forbidden: predefined-views, saved-views, all-items-view
  label: string;
  isDefaultView?: boolean;
  columnPreferences?: { id: string; direction?: 'asc' | 'desc'; show?: boolean }[];
  filters?: Record<string, AutoFilterValue>; // Key matches filter config ID
}
```

### Validation Logic
- **IF** `views.enabled` is false **THEN** all other settings ignored.
- **IF** controlling columns in views **THEN** `table.customColumns.enabled` MUST be true.
- **IF** setting `columnPreferences` **THEN** must list ALL visible columns if reordering/hiding.
- **IF** setting filters **THEN** keys MUST match defined filter IDs.
- **IF** a View represents workflow state **THEN** include every maintained field that defines membership.
- **IF** a CMS filter appears in the filter panel **THEN** declare it in `filters.items`; do not rely on an automatically exposed field that lacks an Auto Patterns field mapping.
- **IF** a Saved View uses `filterType: 'enum'` **THEN** its matching `filters.items` entry MUST provide `enumConfig.options`, and every selected View value MUST match an option `value` exactly.

### Implementation Rules
- **MUST** set `enabled: true` to activate.
- **MUST** use valid filter structures (Date/Number/Boolean/Enum/Reference) matching `AppConfig`.
- **MUST** avoid reserved IDs (`predefined-views`, `saved-views`, `all-items-view`).
- **SHOULD** set `isDefaultView: true` on exactly one preset if default override needed.
- **SHOULD** use `type: 'views'` for a short flat set of manager worksets; use categories only when the sets need a meaningful hierarchy.

Views and panel filters share the collection query but have different entry behavior. Selecting a View resets current filters and applies that preset; panel changes then refine the selected View until another View is selected. Do not promise that panel refinements survive a View switch.

### Canonical Example
```typescript
filters: {
  items: [
    {
      id: 'status',
      fieldId: 'status',
      enumConfig: {
        options: [
          { value: 'pending', label: 'Pending' },
          { value: 'approved', label: 'Approved' }
        ],
        selectionMode: 'single',
        optionType: 'radio'
      }
    },
    { id: 'isReviewed', fieldId: 'isReviewed' },
    { id: 'needsAttention', fieldId: 'needsAttention' }
  ]
},
views: {
  enabled: true,
  presets: {
    type: 'views',
    views: [
      {
        id: 'pending',
        label: 'Pending',
        filters: {
          status: { filterType: 'enum', value: [{ id: 'pending', name: 'Pending' }] }
        }
      },
      {
        id: 'needs-attention',
        label: 'Needs Attention',
        isDefaultView: true,
        filters: {
          isReviewed: { filterType: 'boolean', value: [{ id: 'unchecked', name: 'Not Reviewed' }] },
          needsAttention: { filterType: 'boolean', value: [{ id: 'checked', name: 'Needs Attention' }] }
        }
      },
      {
        id: 'reviewed',
        label: 'Reviewed',
        filters: {
          isReviewed: { filterType: 'boolean', value: [{ id: 'checked', name: 'Reviewed' }] }
        }
      }
    ]
  }
}
```

## Saved View Transitions

A workflow action may move a record between operational worksets, such as `Needs Attention` to `Reviewed`. Treat View membership as a post-action contract:

- Update every maintained field used by the source and destination View predicates.
- For a field changed by an optimistic transition, set its filter `id` equal to its `fieldId`, or configure a documented optimistic-actions `predicate` override that maps the filter ID to that record field. Without this mapping the optimistic row can repaint while remaining in a View it no longer matches.
- Persist first, let the optimistic submit return, then refresh the collection in the next task so Auto Patterns can settle its optimistic patch before re-running filters, counts, and selection against canonical data. With the documented void-returning optimistic actions API, schedule `sdk.refreshCollection()` with `setTimeout(..., 0)` after the write succeeds; a synchronous refresh inside `submit` is too early.
- Treat `submit(items)` as the persistence source of truth. Persist and return the submitted full record (`items[0]` or the equivalent schema action result); never ignore it and reconstruct `{ _id, changedField }`, because Wix Data update replaces omitted fields.
- Apply the same transition and refresh behavior to row, bulk, and detail actions.
- Verify the record disappears immediately from Views and active filters it no longer matches without navigation or manual reload, appears once in the destination View, updates counts and supplemental metrics, and cannot remain selected while absent.
- Keep operational filter declarations when adding display filters; replacing `filters.items` can invalidate every View that references them.

Optimistic predicate mapping provides immediate membership feedback; the deferred collection refresh then reconciles that feedback with canonical data. If the installed Auto Patterns version exposes a documented post-success callback, use it instead of task deferral. If neither mechanism is available, use an awaited direct mutation followed by collection refresh for membership-changing transitions rather than leaving stale optimistic state.

Verify the combined contract in preview: select each View, open the filter panel and confirm its values, add a panel refinement and confirm the table changes, then switch Views and confirm the table and panel reset to the new preset.

## Collection Page Actions

### Type Definitions
```typescript
interface CollectionPageActions {
  primaryActions?: ActionGroup;
  secondaryActions?: ActionGroup;
}

type ActionGroup = | { type: 'action'; action: { item: ActionItem } } | { type: 'menu'; menu: { label: string; items: (ActionItem | DividerItem)[] } };

interface DividerItem {
  type: 'divider';
}

interface ActionItem {
  id: string; // Must match custom resolver name if custom
  type: 'create' | 'custom';
  label?: string;
  biName: string; // MANDATORY
  collection?: {
    collectionId: string;
    entityTypeSource: 'cms' | 'custom';
  };
  create?: {
    mode: 'page';
    page: { id: string };
  };
}

// Row Click Action (Table level)
interface OnRowClickConfig {
  id: string;
  type: 'custom';
}

// Row Click Resolver Signature - NOTE: item is nested under actionParams
type CustomActionCollectionPageActionOnRowClickResolver = (params: {
  actionParams: { item: any };  // The clicked row's data - nested under actionParams
  sdk: AutoPatternsSDK;
}) => ResolvedAction;
```

### Validation Logic
- **IF** `type: 'create'` **THEN** `create` config with `page.id` is **REQUIRED**.
- **IF** `type: 'custom'` **THEN** `id` must match a registered resolver name.
- **IF** `onRowClick` is configured **THEN** matching `custom` resolver is **MANDATORY**.
- **IF** `onRowClick` is configured **THEN** default navigation is **DISABLED**.
- **IF** `onRowClick` resolver accesses row data **THEN** use `actionParams.item` (NOT direct `item` param).
- **IF** `onRowClick` is configured **THEN** its resolver must produce the declared visible outcome; an empty handler, `void` placeholder, or comment-only body is invalid.

### Implementation Rules
- **MUST** include a create action only when users can create the managed entity in this workflow.
- **MUST** include `biName` for every action (kebab-case).
- **MUST** implement custom resolvers using `CustomActionCollectionPageActionResolver`.
- **MUST** implement row click resolvers using `CustomActionCollectionPageActionOnRowClickResolver` returning `ResolvedAction`.
- **MUST** place onRowClick resolvers in `components/actions/` folder (same as other custom actions).
- **MUST** register onRowClick resolvers via `useActions` hook pattern (see **custom_actions_override**).
- **MUST** use `actionParams.item` to produce the selected surface outcome. For a SidePanel, call a page-owned `openItem(item)` callback; for a Modal or entity page, invoke its documented navigation API. Do not rebuild the collection table or own a parallel data lifecycle.
- **MUST** choose the detail surface from depth and context: SidePanel for moderate contextual work, Modal for short blocking work, and entity page for deep or multi-section work. These are recommendations, not rules based only on `view` versus `edit`.
- **MUST** decide row, bulk, detail, and edit actions together before generation. Table actions do not automatically propagate to a linked entity page.
- **MUST** map audience permissions and product intent separately. `itemUpdate: CMS_EDITOR` allows named transitions, feedback writes, or authoritative field editing; it does not choose among them. Use an edit entity page only when authoritative field editing belongs to the actor's job. Use a read-only decision surface for evidence-led transitions, and pair view/edit when both decision and general editing are intentional.
- **MUST** keep the first workflow-defining single-record action available on the chosen investigation surface. A review or resolution drill-in cannot end at generic Save/Cancel while omitting its decision actions.
- **MUST** preserve every action named in `presentation.actionPresentation.actionIds` on the investigation surface at the declared prominence. Do not discard assign/update/request actions merely to satisfy a narrower component configuration.
- **NEVER** mix `create` logic with `custom` action types.
- **NEVER** assume `schema` or `optimisticActions` exist without checking.

### Canonical Example
```typescript
{
  primaryActions: {
    type: 'action',
    action: {
      item: {
        id: 'create-pet',
        type: 'create',
        label: 'Add Pet',
        biName: 'create-pet-action',
        collection: { collectionId: 'pets', entityTypeSource: 'cms' },
        create: {
          mode: 'page',
          page: { id: 'pet-details' }
        }
      }
    }
  },
  secondaryActions: {
    type: 'menu',
    menu: {
      label: 'More',
      items: [
        {
          id: 'exportCollection',
          type: 'custom',
          label: 'Export',
          biName: 'export-action',
          collection: { collectionId: 'pets', entityTypeSource: 'cms' }
        }
      ]
    }
  }
}
```

### Canonical Example (onRowClick)
```typescript
// Config
{
  "onRowClick": {
    "id": "myRowClickAction",
    "type": "custom"
  }
}

// Resolver (if custom) - see custom_actions_override for full registration pattern
export const createRowClickAction = (
  openItem: (item: Record<string, unknown>) => void,
): CustomActionCollectionPageActionOnRowClickResolver =>
  ({ actionParams: { item } }) => ({
    label: 'View details',
    icon: <MyIcon />,
    biName: 'view-details-action',
    onClick: () => openItem(item),
  });
```

## Action Cell

### Type Definitions
```typescript
interface ActionCellConfig {
  primaryAction?: SinglePrimary | MultiplePrimary;
  secondaryActions?: {
    items: (ActionCellItem | DividerItem)[];
    inlineCount?: number;
    inlineAlwaysVisible?: boolean;
  };
}

interface SinglePrimary {
  item: ActionCellItem;
  alwaysVisible?: boolean;
}

interface MultiplePrimary {
  items: ActionCellItem[];
  alwaysVisible?: boolean;
}

interface ActionCellItem {
  id: string; // Matches resolver if custom
  type: 'update' | 'delete' | 'custom';
  label?: string;
  biName: string; // MANDATORY
  skin?: 'standard' | 'inverted' | 'premium' | 'dark' | 'destructive';
  update?: { mode: 'page'; page: { id: string } };
  delete?: { mode: 'modal'; modal: ModalConfig };
}

interface DividerItem {
  type: 'divider';
}

// Primary cell action resolver — primary actions don't accept `icon`; use `prefixIcon`/`suffixIcon`.
type CustomActionCellPrimaryActionResolver = (params: {
  actionParams: { item: any };
  sdk: AutoPatternsSDK;
}) => ResolvedActionCellPrimaryAction;
// ResolvedActionCellPrimaryAction = Omit<ResolvedAction, 'icon'> & { prefixIcon?: IconElement; suffixIcon?: IconElement }

// Secondary cell action resolver — uses standard ResolvedAction (with `icon`).
type CustomActionCellSecondaryActionResolver = (params: {
  actionParams: { item: any };
  sdk: AutoPatternsSDK;
}) => ResolvedAction;
```

### Validation Logic
- **IF** `type: 'update'` **THEN** `update` config with `page.id` is **REQUIRED**.
- **IF** `type: 'update'` **THEN** `page.id` resolves to an edit-mode entity page. A view-mode destination is inspection, not update.
- **IF** `type: 'delete'` **THEN** `delete.mode: 'modal'` is **REQUIRED**.
- **IF** `type: 'custom'` **THEN** resolver implementation is **REQUIRED**.
- **IF** `type: 'custom'` **THEN** its `id` MUST exactly match the registered resolver export key; do not mix kebab-case configuration IDs with camelCase exports.
- **IF** `type: 'custom'` **THEN** its resolver MUST perform the declared outcome. Empty handlers and placeholder callbacks are invalid even when TypeScript and build pass.
- **IF** using `secondaryActions.inlineCount` **THEN** value MUST be <= items count.

### Implementation Rules
- **MUST** include `biName` for every action (`{action-purpose}-action`).
- **MUST** place `actionCell` at component level (sibling to `collection`), NOT inside `table`/`grid`.
- **MUST** implement custom resolvers using `CustomActionCellPrimaryActionResolver` (for primary actions) or `CustomActionCellSecondaryActionResolver` (for secondary actions).
- **MUST** use the documented resolver `sdk`, `getOptimisticActions()`, and `errorToast` path for collection mutations. Use explicit `try/catch` only for supported calls outside optimistic actions; `AutoPatternsSDK` does not expose a generic `errorHandler`.
- **MUST** align the primary label, action type, and destination: use `View` for inspection, `Edit` for a real edit-mode page, and the workflow verb for a transition; never label read-only navigation `Edit` or default to generic `Update`.
- **MUST** make the workflow-defining transition the primary row action. If the same transition is a primary bulk action, its normalized label and outcome must match the row primary action unless it is inherently bulk-only.
- **MUST** use row click or `entityPageId` for inspection when already configured; do not add a custom View action whose handler is empty or duplicates that navigation.
- **MUST** keep row, detail-surface, and bulk actions coherent. Editing is supporting when a stronger operational transition defines the dashboard; do not make fields editable merely because the transition needs update permission.
- **MUST** include a confirmed single-record Delete action when the intended audience has `itemRemove`, the collection is app-owned, and removal belongs to the entity lifecycle. Put it in the row's destructive secondary actions or the detail surface; do not leave deletion available only in bulk.
- **SHOULD** use `multiplePrimary` for 2-3 equally important actions.
- **NEVER** use `primaryAction` inside `secondaryActions`.
- **NEVER** use `actionResolvers` prop on `AutoPatternsApp` - this prop does not exist.
- **NEVER** create resolver files outside `components/actions/` folder.

### Canonical Example
```typescript
// Config
actionCell: {
  primaryAction: {
    item: {
      id: 'markReviewed',
      type: 'custom',
      label: 'Mark as Reviewed',
      biName: 'mark-reviewed-action',
      skin: 'standard'
    }
  },
  secondaryActions: {
    items: [
      {
        id: 'editItem',
        type: 'update',
        label: 'Edit',
        biName: 'edit-action',
        update: { mode: 'page', page: { id: 'edit-page' } }
      },
      {
        id: 'deleteItem',
        type: 'delete',
        label: 'Delete',
        biName: 'delete-action',
        skin: 'destructive',
        delete: { mode: 'modal', modal: {} }
      }
    ]
  }
}

// Resolvers (if custom) - see custom_actions_override for full registration pattern

// Config ID and export key match exactly.
export const markReviewed: CustomActionCellPrimaryActionResolver = ({ actionParams, sdk }) => ({
  label: 'Mark as Reviewed',
  prefixIcon: <MyIcon />,
  biName: 'mark-reviewed-action',
  disabled: Boolean(actionParams.item.isReviewed),
  onClick: () => markReviewedWithOptimisticUpdate(actionParams.item, sdk)
});

// Secondary action resolver: uses icon
export const mySecondaryAction: CustomActionCellSecondaryActionResolver = ({ actionParams }) => ({
  label: 'Custom',
  icon: <MyIcon />,
  biName: 'custom-action',
  onClick: () => console.log(actionParams.item)
});
```

## Bulk Actions

### Type Definitions
```typescript
interface BulkActionToolbar {
  primaryActions?: BulkActionGroup[];
  secondaryActions?: (BulkActionItem | DividerItem)[];
}

type BulkActionGroup = | { type: 'action'; action: { item: BulkActionItem } } | { type: 'menu'; menu: { label: string; items: (BulkActionItem | DividerItem)[] } };

interface DividerItem {
  type: 'divider';
}

interface BulkActionItem {
  id: string; // Must match custom resolver name
  type: 'bulkDelete' | 'custom';
  label?: string;
  biName: string; // MANDATORY
  bulkDelete?: {
    mode: 'modal';
    modal: {
      title?: { text?: string; id?: string };
      description?: { text: string };
      actions?: { submit?: { text: string }; cancel?: { text: string } };
      feedback?: { successToast?: { text: string }; errorToast?: { text: string } };
    };
  };
}

type CustomBulkActionsActionResolver = (params: {
  actionParams: { selectedValues: any[]; total: number };
  sdk: AutoPatternsSDK;
}) => ResolvedAction;
```

### Validation Logic
- **IF** `type: 'bulkDelete'` **THEN** `bulkDelete.mode: 'modal'` is **REQUIRED**.
- **IF** `type: 'custom'` **THEN** resolver implementation is **REQUIRED**.
- **IF** `type: 'custom'` **THEN** its `id` MUST exactly match the registered resolver export key and its handler MUST perform the declared outcome.
- **IF** `primaryActions` AND `secondaryActions` both undefined **THEN** toolbar invalid.

### Implementation Rules
- **MUST** include `biName` for all bulk actions (`bulk-{action}-action`).
- **MUST** place toolbar configuration inside `table` or `grid` object.
- **MUST** use `CustomBulkActionsActionResolver` type for custom logic.
- **MUST** register custom resolvers in `AutoPatternsOverridesProvider`.
- **MUST** use the documented resolver SDK and optimistic-action `errorToast` path for mutations; `AutoPatternsSDK` has no generic `errorHandler`.
- **MUST** provide a discoverable single-record equivalent for every bulk workflow transition unless the operation is inherently bulk-only. The equivalent may live in the row action, SidePanel, Modal, or entity page.
- **MUST** mirror the primary bulk transition as the primary row action. Use the same user-facing label and state change; do not make generic View or Edit primary instead.
- **MUST** add bulk Delete when `itemRemove` is granted, deleting the managed entity is a valid lifecycle action, and multi-record removal is useful. Keep a confirmed single-record Delete action available as well. Do not use deletion to process or dismiss a queue.
- **NEVER** use default navigation in bulk actions; implement explicitly.

### Canonical Example
```typescript
// Config
bulkActionToolbar: {
  primaryActions: [{
    type: 'action',
    action: {
      item: {
        id: 'bulkMarkReviewed',
        type: 'custom',
        label: 'Mark as Reviewed',
        biName: 'bulk-mark-reviewed-action'
      }
    }
  }],
  secondaryActions: [
    {
      id: 'bulkDelete',
      type: 'bulkDelete',
      label: 'Delete',
      biName: 'bulk-delete-action',
      bulkDelete: { mode: 'modal', modal: {} }
    }
  ]
}

// Resolver
export const bulkMarkReviewed: CustomBulkActionsActionResolver = ({ actionParams, sdk }) => ({
  label: 'Mark as Reviewed',
  icon: <Check />,
  biName: 'bulk-mark-reviewed-action',
  onClick: () => {
    markReviewedWithOptimisticUpdate(actionParams.selectedValues, sdk);
  }
});
```

## Resolved Actions

### Type Definitions
```typescript
interface ResolvedAction {
  label: string; // Display text
  icon: IconElement; // React Icon Component
  onClick: () => void; // async handlers compile due to TS void-return bivariance
  biName?: string; // type-optional; project convention is to ALWAYS set it (see Implementation Rules)
  disabled?: boolean;
  hidden?: boolean;
  tooltip?: string;
  skin?: string; // recommended values: 'standard' | 'inverted' | 'premium' | 'dark' | 'destructive'
}
```

### Validation Logic
- **IF** `disabled` is true **THEN** `tooltip` is **RECOMMENDED**.
- **IF** implementing a custom action **THEN** return object MUST match `ResolvedAction`.
- **IF** `biName` is provided **THEN** value MUST match configuration `biName`.

### Implementation Rules
- **MUST** include `label`, `icon`, `onClick`, and `biName`.
- **MUST** use valid icon element (e.g. `<Icon />`).
- **MUST** handle async `onClick` operations properly (use try/catch or SDK helpers).
- **SHOULD** use `hidden` for permission checks.
- **SHOULD** use `skin="destructive"` for delete/dangerous actions.

### Canonical Example
```typescript
// Resolver Function Return Value
return {
  label: 'Export',
  icon: <Download />,
  biName: 'export-action',
  onClick: async () => {
    // Action logic
  },
  disabled: !hasData,
  tooltip: !hasData ? 'No data to export' : undefined,
  skin: 'standard'
};
```
