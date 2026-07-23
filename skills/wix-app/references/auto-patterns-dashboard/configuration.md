# Auto Patterns Configuration

Use for AppConfig, page relationships, routing, collection-page structure, and Table/Grid layout configuration.

## Contents

- [AppConfig Structure](#appconfig-structure)
- [Page Configuration](#page-configuration)
- [Collection Page](#collection-page)

## AppConfig Structure

### Type Definitions
```typescript
export interface AppConfig {
  pages: PageConfig[];
}

type PageConfig = CollectionPageConfig | EntityPageConfig;

interface PageBase {
  id: string; // Unique across app
  appMainPage?: boolean; // ONE page must be true
}

interface CollectionPageConfig extends PageBase {
  type: 'collectionPage';
  collectionPage: {
    route: { path: string };
    title: { text: string; hideTotal?: boolean };
    subtitle?: { text: string };
    actions?: PageActions;
    components: [CollectionComponent | CustomComponent]; // EXACTLY ONE component with layout
  };
}

interface EntityPageConfig extends PageBase {
  type: 'entityPage';
  entityPage: {
    mode?: 'edit' | 'view'; // Default 'edit'
    route: { path: string; params: { id: string } };
    title?: { text: string; badges?: { id?: string } };
    subtitle?: { text: string; id?: string };
    actions?: EntityPageActions;
    parentPageId?: string; // ID of parent collection page
    collectionId: string;
    entityTypeSource: 'cms' | 'custom';
    custom?: { id: string }; // REQUIRED if entityTypeSource='custom'
    layout?: {
      main: CardLayout[];
      sidebar?: CardLayout[];
    };
  };
}

// Action Types
interface PageActions {
  primaryActions?: ActionGroup;
  secondaryActions?: ActionGroup;
}

interface EntityPageActions {
  primaryActions?: ActionGroup; // View mode only
  secondaryActions?: ActionGroup; // View mode only
  moreActions?: CustomAction[]; // Both modes
}

type ActionGroup = { type: 'action'; action?: { item: ActionItem } } | { type: 'menu'; menu?: { label: string; items: ActionItem[] } };

interface ActionItem {
  id: string;
  type: 'create' | 'update' | 'delete' | 'custom' | 'bulkDelete';
  label?: string;
  biName: string; // MANDATORY
  skin?: string;
  disabled?: boolean;
  tooltip?: string;
  collection?: CollectionSource; // For create action
  create?: { mode: 'page'; page: { id: string } };
  update?: { mode: 'page'; page: { id: string } };
  delete?: { mode: 'modal'; modal: ModalConfig };
  bulkDelete?: { mode: 'modal'; modal: ModalConfig };
}

// Component Types
interface CollectionComponent {
  type: 'collection';
  entityPageId?: string;
  collection: CollectionSettings;
  filters?: FilterConfig;
  actionCell?: ActionCellConfig;
  bulkActionToolbar?: BulkActionToolbar;
  toolbarTitle?: ToolbarTitle;
  views?: ViewsConfig;
  search?: { shown?: boolean };
  emptyState?: EmptyStateConfig;
  dragAndDrop?: { enabled: boolean; dragAndDropCancel?: { id?: string } };
  layout: [TableLayout, GridLayout];
}

interface CustomComponent {
  type: 'custom';
  id: string;
}

// Sub-Types
interface CollectionSource {
  collectionId: string;
  entityTypeSource: 'cms' | 'custom';
  custom?: { id: string };
}

interface CollectionSettings extends CollectionSource {
  reflectQueryInUrl?: boolean;
  selectAllScope?: 'page' | 'all';
  selectionUpdateMode?: 'preserve' | 'clear';
  paginationMode?: 'cursor' | 'offset';
}

interface TableLayout {
  type: 'Table';
  table?: {
    columns: ColumnConfig[];
    customColumns?: { enabled: boolean };
    dataExtension?: { enabled: boolean };
    stickyColumns?: number;
    showTitleBar?: boolean;
  };
}

interface GridLayout {
  type: 'Grid';
  grid?: {
    item: {
      titleFieldId: string;
      subtitleFieldId?: string;
      imageFieldId?: string;
      cardContentMode?: 'full' | 'title' | 'empty';
      imagePlacement?: 'top' | 'side';
    };
  };
}
```

### Validation Logic
- **IF** `entityTypeSource` is `'custom'` **THEN** `custom: { id: "..." }` is **REQUIRED**.
- **IF** `type: 'collectionPage'` **THEN** `collectionPage` object is **REQUIRED**, `entityPage` object is **FORBIDDEN**.
- **IF** `type: 'entityPage'` **THEN** `entityPage` object is **REQUIRED**, `collectionPage` object is **FORBIDDEN**.
- **IF** `type: 'action'` **THEN** `action` property is **REQUIRED**.
- **IF** `type: 'menu'` **THEN** `menu` property is **REQUIRED**.
- **IF** action type is `'create'` **THEN** `create` config is **REQUIRED**.
- **IF** action type is `'update'` **THEN** `update` config is **REQUIRED**.
- **IF** action type is `'delete'` **THEN** `delete` config is **REQUIRED**.

### Implementation Rules
- **MUST** include `biName` in EVERY action configuration (format: kebab-case, `{action-purpose}-action`).
- **MUST** designate exactly ONE page as `appMainPage: true`.
- **MUST** use TypeScript for configuration.
- **NEVER** fill optional fields unless explicitly requested.
- **NEVER** mix page types in a single configuration.
- **NEVER** set `stickyColumns` to negative, zero, or > column count.
- **NEVER** invent enum values; ASK user for values.

### page.tsx Structure
```tsx
import React from 'react';
import { WixDesignSystemProvider } from '@wix/design-system';
import '@wix/design-system/styles.global.css';
import { WixPatternsProvider } from '@wix/patterns/provider';
import { PatternsWizardOverridesProvider, AutoPatternsApp, type AppConfig } from '@wix/auto-patterns';
import { withDashboard } from '@wix/patterns';
import config from './patterns.json';

const Index: React.FC = () => {
  return (
    <WixDesignSystemProvider features={{ newColorsBranding: true }}>
      <WixPatternsProvider>
        <PatternsWizardOverridesProvider value={{}}>
          <AutoPatternsApp configuration={config as AppConfig} />
        </PatternsWizardOverridesProvider>
      </WixPatternsProvider>
    </WixDesignSystemProvider>
  );
};

export default withDashboard(Index);
```

### Canonical Example
```typescript
export const config: AppConfig = {
  pages: [
    {
      id: "product-list",
      type: "collectionPage",
      appMainPage: true,
      collectionPage: {
        route: { path: "/" },
        title: { text: "Products" },
        actions: {
          primaryActions: {
            type: "action",
            action: {
              item: {
                id: "create-product",
                type: "create",
                label: "Add Product",
                biName: "create-product-action",
                collection: {
                  collectionId: "products",
                  entityTypeSource: "cms"
                },
                create: {
                  mode: "page",
                  page: { id: "product-details" }
                }
              }
            }
          }
        },
        components: [
          {
            type: "collection",
            entityPageId: "product-details",
            collection: {
              collectionId: "products",
              entityTypeSource: "cms"
            },
            layout: [
              {
                type: "Table",
                table: {
                  columns: [
                    { id: "name", name: "Name", width: "200px" },
                    { id: "price", name: "Price", width: "100px" }
                  ]
                }
              },
              {
                type: "Grid",
                grid: {
                  item: { titleFieldId: "name" }
                }
              }
            ]
          }
        ]
      }
    },
    {
      id: "product-details",
      type: "entityPage",
      entityPage: {
        route: { path: "/product/:id", params: { id: "id" } },
        collectionId: "products",
        entityTypeSource: "cms",
        layout: {
          main: [
            {
              type: "card",
              card: {
                title: { text: "Basic Info" },
                children: [
                  { type: "field", field: { fieldId: "name" } }
                ]
              }
            }
          ]
        }
      }
    }
  ]
};
```

## Page Configuration

### Type Definitions
```typescript
interface PageConfig {
  id: string; // Unique ID
  type: 'collectionPage' | 'entityPage';
  appMainPage?: boolean; // EXACTLY ONE page must have true
}

interface CollectionPage extends PageConfig {
  type: 'collectionPage';
  collectionPage: {
    route: { path: '/' };
    components: [{
      entityPageId: string; // REQUIRED: Links to entity page ID
      // ... component config
    }];
  };
}

interface EntityPage extends PageConfig {
  type: 'entityPage';
  entityPage: {
    parentPageId: string; // REQUIRED: Links to collection page ID
    route: {
      path: string; // MUST be '/[segment]/:entityId'
      params: { id: 'entityId' };
    };
  };
}

interface StickyConfig {
  stickyColumns?: number; // Count of columns to stick from left
  columns: Array<{
    reorderDisabled?: boolean; // Recommended for sticky cols
  }>;
}
```

### Validation Logic
- **IF** `pages` array length != 2 **THEN** Invalid (Must be exactly 2).
- **IF** `appMainPage: true` count != 1 **THEN** Invalid (Must be exactly 1).
- **IF** `type: 'entityPage'` **THEN** `route.path` MUST match `/[segment]/:entityId`.
- **IF** `route.path` is `/:entityId` **THEN** Invalid (Conflict with root).
- **IF** `stickyColumns` is set **THEN** value must be > 0 AND <= total columns.

### Implementation Rules
- **MUST** generate exactly one `collectionPage` and one `entityPage`.
- **MUST** link pages bidirectionally:
    - `collectionPage` references `entityPageId` (in component).
    - `entityPage` references `parentPageId` (in page config).
- **MUST** use `entityId` as the dynamic parameter name.
- **MUST** use position-based stickiness (first N columns).
- **SHOULD** set `reorderDisabled: true` for sticky columns to prevent user breakage.

### Canonical Example
```typescript
[
  {
    id: 'product-list',
    type: 'collectionPage',
    appMainPage: true,
    collectionPage: {
      route: { path: '/' },
      components: [{
        type: 'collection',
        entityPageId: 'product-details', // Link to Entity Page
        layout: [{
          type: 'Table',
          table: {
            stickyColumns: 1,
            columns: [
              { id: 'name', name: 'Name', reorderDisabled: true }, // Sticky & Locked
              { id: 'price', name: 'Price' }
            ]
          }
        }]
      }]
    }
  },
  {
    id: 'product-details',
    type: 'entityPage',
    entityPage: {
      parentPageId: 'product-list', // Link to Collection Page
      route: {
        path: '/product/:entityId', // Correct format
        params: { id: 'entityId' }
      }
    }
  }
]
```

## Collection Page

### Type Definitions
```typescript
interface CollectionComponent {
  type: 'collection';
  entityPageId: string; // REQUIRED for navigation
  collection: {
    collectionId: string;
    entityTypeSource: 'cms' | 'custom';
    custom?: { id: string };
  };
  layout: LayoutItem[];
}

type LayoutItem = TableLayout | GridLayout;

interface TableLayout {
  type: 'Table';
  table: {
    columns: ColumnConfig[];
    customColumns?: { enabled: boolean };
    dataExtension?: { enabled: boolean };
    stickyColumns?: number;
    showTitleBar?: boolean;
  };
}

interface ColumnConfig {
  id: string; // Field ID
  name: string; // Display title
  width: string;
  tooltipContent?: string; // Info icon text
  sortable?: boolean;
  hideable?: boolean;
}

interface GridLayout {
  type: 'Grid';
  grid: {
    item: {
      titleFieldId: string; // REQUIRED Field ID
      subtitleFieldId?: string; // Field ID
      imageFieldId?: string; // Field ID
      cardContentMode?: 'full' | 'title' | 'empty';
    };
  };
}
```

### Terminology and Boundary

Use **layout switcher** for the automatic presentation control created when both `Table` and `Grid` layouts are configured. Use **Saved Views** for the separate named-filter and column-preference system in `views` configuration.

The layout switcher supports only `Table` and `Grid`. It is not the native CMS `Choose layout` picker: `List`, custom layout labels, a dropdown layout-picker presentation, and a configurable initial layout are not documented configuration capabilities.

### Validation Logic
- **IF** `components` array length != 1 **THEN** Invalid Config (Must be exactly 1).
- **IF** `layout` contains both 'Table' and 'Grid' **THEN** the built-in Table/Grid layout switcher is automatically enabled.
- **IF** `columns` count > 5 **THEN** `customColumns.enabled` = `true`.
- **IF** `columns` count <= 5 **THEN** `customColumns.enabled` = `false` (unless explicitly requested).
- **IF** `type` is 'Grid' **THEN** `titleFieldId` is **REQUIRED**.

### Implementation Rules
- **MUST** reference `entityPageId` to link rows/cards to the entity page.
- **MUST** select max 3 columns initially for the table.
- **MUST** use `tooltipContent` to explain complex column data.
- **SHOULD** include a primary action with `type: 'update'` in Grid view to allow easy editing.
- **SHOULD** choose the linked entity page for deep, multi-section, validation-heavy, deep-linkable, or long-running work. A SidePanel or Modal may support viewing or editing when its depth and context fit better.
- **NEVER** use `onRowClick` unless custom behavior (not entity page navigation) is explicitly required.

### Canonical Example
```typescript
{
  type: 'collectionPage',
  // ... page props
  components: [
    {
      type: 'collection',
      entityPageId: 'pet-details', // Links to entity page
      collection: {
        collectionId: 'pets',
        entityTypeSource: 'cms'
      },
      layout: [
        {
          type: 'Table',
          table: {
            columns: [
              { id: 'name', name: 'Name', width: '200px', tooltipContent: 'Pet Name' },
              { id: 'breed', name: 'Breed', width: '150px' },
              { id: 'age', name: 'Age', width: '100px' }
            ],
            customColumns: { enabled: false }
          }
        },
        {
          type: 'Grid',
          grid: {
            item: {
              titleFieldId: 'name',
              subtitleFieldId: 'breed',
              imageFieldId: 'photo'
            }
          }
        }
      ]
    }
  ]
}
```
