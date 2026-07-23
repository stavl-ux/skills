# Auto Patterns Extensions

Use for custom actions, columns, sections, slots, AppContext integration, refresh behavior, and SDK utilities.

## Contents

- [Registering Overrides](#registering-overrides)
- [Custom Actions](#custom-actions)
- [Custom Columns](#custom-columns)
- [Custom Sections](#custom-sections)
- [Custom Slots](#custom-slots)
- [AppContext](#appcontext)
- [SDK Utilities](#sdk-utilities)

## Registering Overrides

Keep every override in its documented `components/<type>/` folder and export one `use*` hook from that folder's index. After creating or changing overrides:

1. Import each required hook into `page.tsx`.
2. Call the hook alongside existing override hooks.
3. Add its returned object to `PatternsWizardOverridesProvider` without removing existing overrides.

| Override | Folder | Hook | Provider key |
| --- | --- | --- | --- |
| Action | `components/actions/` | `useActions` | `actions` |
| Column | `components/columns/` | `useColumns` | `columns` |
| Section | `components/sections/` | `useSections` | `sections` |
| Slot | `components/slots/` | `useSlots` | `slots` |

## Custom Actions

### Type Definitions
```typescript
interface ResolvedAction {
  label: string;
  icon?: React.ReactElement;
  onClick: () => void | Promise<void>;
  disabled?: boolean;
  hidden?: boolean;
}

// Action Resolver Signature
type CustomActionResolver = (params: {
  item: any;
  selectedItems?: any[];
}) => ResolvedAction;
```

### Configuration Schema
```json
{
  "actions": [
    {
      "type": "custom",
      "id": "myAction" // Matches override key
    }
  ]
}
```

### Validation Logic
- **IF** `type` is `"custom"` **THEN** `id` MUST match key in `actions` override.
- **IF** action is async **THEN** `onClick` SHOULD return a Promise.
- **IF** action requires selection **THEN** check `selectedItems`.

### Implementation Rules
- **MUST** be placed in `components/actions/` folder.
- **MUST** use `.tsx` extension if the file contains JSX (icons, React elements). Use `.ts` only for pure logic files.
- **MUST** export `useActions` hook from `components/actions/index.tsx`.
- **MUST** return `ResolvedAction` object.
- **MUST** handle errors (use `try/catch` or `errorHandler` for Wix APIs).
- **APPLIES TO** all custom action types: actionCell, collectionPageActions, onRowClick, bulkActions.
- **NEVER** place action resolvers directly in page.tsx or overrides.tsx - always use components/actions/ folder.

### Canonical Example
```tsx
// components/actions/myAction.tsx (use .tsx when file contains JSX like icons)
export const myAction = ({ item }) => ({
  label: 'Approve',
  icon: <Check />,
  onClick: async () => {
    await approveItem(item.id);
  }
});

// components/actions/index.tsx
import { myAction } from './myAction';
export const useActions = () => ({ myAction });
```

## Custom Columns

### Type Definitions
```typescript
interface IColumnValue<T> {
  value: T; // The individual column value
  row: Record<string, any>; // The entire row object containing all field values
}

// Override Function Signature
type ColumnOverride<T> = (props: IColumnValue<T>) => React.ReactNode;
```

### Configuration Schema
```json
{
  "type": "collectionPage",
  "collectionPage": {
    "components": [
      {
        "layout": [
          {
            "type": "Table",
            "table": {
              "columns": [
                {
                  "id": "myCustomColumn" // Matches key in override object
                }
              ]
            }
          }
        ]
      }
    ]
  }
}
```

### Validation Logic
- **IF** overriding a column **THEN** function name MUST match the `column.id` in AppConfig.
- **IF** needing React hooks (useState, useEffect) **THEN** MUST wrap implementation in a separate React component and return it.
- **IF** accessing row data **THEN** MUST use exact field IDs from schema as keys on `row` object.
- **NEVER** use React hooks directly inside the column override function (it is a render function, not a component).

### Implementation Rules
- **MUST** be placed in `components/columns/` folder.
- **MUST** export a `useColumns` hook from `components/columns/index.tsx`.
- **MUST** import type `IColumnValue` from `@wix/auto-patterns` for type safety.
- **MUST** return a ReactNode (JSX) or null.

### Operational Status Columns

Treat status, risk, priority, exception, payment, fulfillment, and attention fields as operational signals when users scan the collection to decide what needs action.

- If an operational field is shown as a badge in an entity header or detail surface, use this documented custom-column override to show the same field as a badge in the collection Table/Grid.
- Keep label normalization and WDS badge skin selection in one shared mapping when both resolvers live in the same feature; do not let the list and detail assign conflicting meanings.
- Use the exact field ID from the collection schema and register the column override through `useColumns`.
- Keep ordinary names, descriptions, dates, identifiers, and neutral categories as text unless their workflow meaning is explicitly a status.
- Read the installed WDS `Badge` documentation before choosing supported skins. Color must communicate the same system meaning on every surface.

### Canonical Example
```tsx
// components/columns/status.tsx
import type { IColumnValue } from '@wix/auto-patterns';
import { Badge } from '@wix/design-system';

export function status({ value, row }: IColumnValue<string>) {
  // Pure rendering logic - NO HOOKS here
  const skin = value === 'Active' ? 'success' : 'danger';
  return <Badge skin={skin}>{value}</Badge>;
}

// components/columns/index.tsx
import { status } from './status';
export const useColumns = () => ({ status });
```

## Custom Sections

### Type Definitions
```typescript
interface Section {
  id: string; // Unique grouping ID
  title: string; // Header text
  primaryAction?: {
    id: string;
    label: string;
    prefixIcon?: React.ReactElement;
    onClick: () => void;
  };
  badge?: {
    visible: boolean;
    skin?: 'light' | 'danger' | 'neutralLight';
  };
}

// Section Renderer Signature
type SectionRenderer = (item: any) => Section;
```

### Configuration Schema
```json
{
  "type": "collectionPage",
  "collectionPage": {
    "components": [
      {
        "layout": [
          {
            "type": "Table",
            "table": {
              "sections": {
                "id": "groupByType" // Matches override key
              }
            }
          }
        ]
      }
    ]
  }
}
```

### Validation Logic
- **IF** `sections.id` is defined **THEN** matching override function MUST exist.
- **IF** multiple items return same `id` from renderer **THEN** they will be visually grouped.
- **NEVER** perform heavy computations in renderer; it runs for every item.

### Implementation Rules
- **MUST** be placed in `components/sections/` folder.
- **MUST** export a `useSections` hook from `components/sections/index.tsx`.
- **MUST** return a valid `Section` object.
- **MUST** handle missing fields gracefully (default values).

### Canonical Example
```tsx
// components/sections/groupByType.ts
import { Section } from '@wix/patterns';

export function groupByType(item: any): Section {
  const type = item.type || 'other';
  return {
    id: type,
    title: type.toUpperCase(),
    badge: { visible: true, skin: 'neutralLight' }
  };
}

// components/sections/index.tsx
import { groupByType } from './groupByType';
export const useSections = () => ({ groupByType });
```

## Custom Slots

### Type Definitions
```typescript
// Slot Component Signature
type SlotComponent = React.FC; // No props passed
```

### Configuration Schema
```json
{
  "type": "collectionPage",
  "collectionPage": {
    "components": [
      {
        "type": "custom",
        "id": "topBanner" // Matches override key
      },
      {
        "type": "collection",
        "collection": { "collectionId": "items" }
      }
    ]
  }
}
```

### Validation Logic
- **IF** `type` is `"custom"` in components array **THEN** `id` MUST match a key in the `slots` override object.
- **IF** implementing a slot **THEN** component MUST NOT expect any props.
- **NEVER** assume slot position; it renders exactly where placed in the `components` array.

### Implementation Rules
- **MUST** be placed in `components/slots/` folder.
- **MUST** export a `useSlots` hook from `components/slots/index.tsx`.
- **MUST** be a standard React Functional Component.
- **MUST** match the `id` in configuration exactly.

### Canonical Example
```tsx
// components/slots/TopBanner.tsx
import { Card, Text } from '@wix/design-system';

export const TopBanner = () => (
  <Card>
    <Card.Content>
      <Text>Welcome to the dashboard</Text>
    </Card.Content>
  </Card>
);

// components/slots/index.tsx
import { TopBanner } from './TopBanner';
export const useSlots = () => ({ topBanner: TopBanner });
```

## AppContext

### Type Definitions
```typescript
interface AppContext {
  items: any[];
  refreshCollection: () => void;
}
```

### Validation Logic
- **IF** using `useAppContext` **THEN** component MUST be inside `AutoPatternsApp` (as children).

### Implementation Rules
- **MUST** wrap child components (modals, panels) with `<AutoPatternsApp>`.
- **MUST** use `useAppContext` to access shared collection data/refresh.
- **MUST** use `refreshCollection` after data mutations in external components.
- **NEVER** use `useAppContext` outside of the `AutoPatternsApp` tree.

### Contextual Detail Integration

Use this SidePanel pattern when an Auto Patterns collection row opens moderate-depth supplemental view or edit content while retaining table context. Use a Modal for a short blocking task and an entity page for a deep, multi-section, or long-running flow.

1. The page component owns `selectedItem` state and renders the generated Auto Patterns collection page unchanged.
2. A documented custom row/action resolver receives `actionParams.item` and calls the page-owned `openItem(item)` callback.
3. The page renders the WDS `SidePanel` as an `AutoPatternsApp` child through the standard dashboard overlay host. The host is outside page, table, and card overflow containers.
4. The panel reads the selected record from page state, uses AppContext for collection-wide data or `refreshCollection`, and clears its selected item after a successful mutation or when the record is no longer present.

The collection table, selection, filters, layouts, CRUD lifecycle, and refresh lifecycle remain Auto Patterns-owned. The SidePanel is contextual detail only; do not recreate the table in custom WDS JSX.

### Canonical Example
```typescript
// 1. Child Component
const MyModal = () => {
  const { items, refreshCollection } = useAppContext();
  return (
    <Modal>
      <Text>Count: {items.length}</Text>
      <Button onClick={refreshCollection}>Refresh</Button>
    </Modal>
  );
};

// 2. Integration
<AutoPatternsApp configuration={config}>
  <MyModal />
</AutoPatternsApp>
```

## SDK Utilities

### Type Definitions
```typescript
interface AutoPatternsSDK {
  closeModal: () => void;
  getOptimisticActions: (collectionId: string) => OptimisticActions;
  getSchema: (collectionId: string) => SchemaConfig | undefined;
  refreshCollection: () => void;
  collectionId: string;
}

interface OptimisticActions {
  createOne: (item: any, params: OptimisticParams) => void;
  createMany: (items: any[], params: OptimisticParams) => void;
  updateOne: (item: any, params: OptimisticParams) => void;
  updateMany: (items: any[], params: OptimisticParams) => void;
  updateAll: (transformFn: (item: any) => Partial<any>, params: OptimisticParams) => void;
  deleteOne: (item: any, params: DeleteParams) => void;
  deleteMany: (items: any[], params: DeleteParams) => void;
  deleteAll: (params: DeleteParams) => void;
}

interface OptimisticParams {
  submit: (items: any[]) => Promise<any>;
  successToast: string | ToastConfig;
  errorToast: (error: Error, actions: { retry: () => void }) => string | ToastConfig;
}

type DeleteParams = OptimisticParams & { showUndoToast: true };

interface ToastConfig {
  message: string; // Must use 'message' (not 'text')
  action?: { text: string; onClick: () => void };
}
```

### Validation Logic
- **IF** using `delete*` operations **THEN** `showUndoToast: true` is **REQUIRED**.
- **IF** returning `ToastConfig` **THEN** use `message` property (NOT `text`).
- **IF** using schema in submit **THEN** check `schema` existence first (can be undefined).

### Implementation Rules
- **MUST** use `optimisticActions` for data mutations (create/update/delete).
- **MUST** handle async submit failures in `errorToast`.
- **MUST** use `sdk.collectionId` for current context.
- **NEVER** use OptimisticActions for read-only operations.

### Canonical Example
```typescript
const optimisticActions = sdk.getOptimisticActions(sdk.collectionId);
const schema = sdk.getSchema(sdk.collectionId);

optimisticActions.updateOne(item, {
  submit: async (items) => {
    // Check schema existence
    if (!schema) return items[0];
    return await schema.actions.update(items[0]);
  },
  successToast: 'Item updated successfully',
  errorToast: (err, { retry }) => ({
    message: 'Update failed', // Use 'message'
    action: { text: 'Retry', onClick: retry }
  })
});
```
