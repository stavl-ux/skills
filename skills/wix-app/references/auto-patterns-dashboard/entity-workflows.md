# Auto Patterns Entity Workflows

Use for entity-page layout, view and edit actions, custom form components, and entity header composition.

## Contents

- [Registering Entity Overrides](#registering-entity-overrides)
- [Entity Page](#entity-page)
- [Entity Edit Actions](#entity-edit-actions)
- [Entity View Actions](#entity-view-actions)
- [Custom Form Components](#custom-form-components)
- [Custom Entity Headers](#custom-entity-headers)

## Registering Entity Overrides

Keep entity overrides in their documented component folders and export one `use*` hook from each folder's index. Import and call the required hooks in `page.tsx`, then add their returned objects to the existing overrides provider without removing other overrides.

| Override | Folder | Hook | Provider key |
| --- | --- | --- | --- |
| Form component | `components/customComponents/` | `useComponents` | `components` |
| Subtitle | `components/entityPageHeaderSubtitle/` | `useEntityPageHeaderSubtitle` | `entityPageHeaderSubtitle` |
| Badges | `components/entityPageHeaderBadges/` | `useEntityPageHeaderBadges` | `entityPageHeaderBadges` |

## Entity Page

### Type Definitions
```typescript
interface EntityPageConfig {
  type: 'entityPage';
  entityPage: {
    mode?: 'edit' | 'view'; // Default 'edit'
    route: { path: string; params: { id: string } };
    parentPageId: string; // REQUIRED
    collectionId: string;
    entityTypeSource: 'cms' | 'custom';
    title?: {
      text: string;
      badges?: { id: string }; // Dynamic badges override ID
    };
    subtitle?: {
      text: string;
      id?: string; // Dynamic subtitle override ID
    };
    layout?: {
      main: CardLayout[];
      sidebar?: CardLayout[];
    };
    actions?: EntityPageActions; // See Action Rules
  };
}

interface CardLayout {
  type: 'card';
  card: {
    title?: { text: string };
    children: LayoutContent[];
  };
}

type LayoutContent = | { type: 'field'; field: { fieldId: string; span?: number } } | { type: 'container'; container: { children: LayoutContent[]; span?: number } } | { type: 'component'; component: { componentId: string; span?: number } };

// Override Types
type EntityPageHeaderSubtitle = (entity: any) => { text: string };
type EntityPageHeaderBadges = (entity: any) => {
  text: string;
  skin?: 'success' | 'warning' | 'destructive' | 'neutral' | 'premium';
  prefixIcon?: ReactElement;
  suffixIcon?: ReactElement;
}[];
```

### Validation Logic
- **IF** `mode` is undefined **THEN** defaults to `'edit'`.
- **IF** `mode: 'edit'` **THEN** only `moreActions` supported.
- **IF** `mode: 'view'` **THEN** `primaryActions`, `secondaryActions`, `moreActions` supported.
- **IF** `badges.id` defined **THEN** implementation MUST return array of badge objects.
- **IF** `subtitle.id` defined **THEN** implementation MUST return `{ text: string }`.

### Implementation Rules
- **MUST** use route format `/[segment]/:entityId` (NEVER `/:entityId`).
- **MUST** map dynamic parameter in `route.params` (e.g. `{ id: 'entityId' }`).
- **MUST** register overrides for `badges` and `subtitle` if IDs are used.
- **MUST** use 12-column grid system for `span` (wraps if > 12).
- **SHOULD** put primary info in `main` layout, metadata in `sidebar`.
- **NEVER** return JSX from badge/subtitle functions (return data objects).

### Canonical Example
```typescript
// Config
{
  type: 'entityPage',
  entityPage: {
    mode: 'view',
    route: { path: '/pet/:entityId', params: { id: 'entityId' } },
    parentPageId: 'pets-list',
    collectionId: 'pets',
    entityTypeSource: 'cms',
    title: {
      text: 'Pet Details',
      badges: { id: 'petBadges' }
    },
    layout: {
      main: [{
        type: 'card',
        card: {
          title: { text: 'Info' },
          children: [
            { type: 'field', field: { fieldId: 'name', span: 6 } },
            { type: 'field', field: { fieldId: 'age', span: 6 } }
          ]
        }
      }]
    }
  }
}

// Override Implementation
export const petBadges = (entity) => ([
  { text: entity.status, skin: entity.status === 'Active' ? 'success' : 'neutral' }
]);
```

## Entity Edit Actions

### Type Definitions
```typescript
interface EntityPageConfig {
  entityPage: {
    actions: {
      moreActions: (CustomActionItem | DividerItem)[];
    };
  };
}

interface CustomActionItem {
  id: string; // Matches resolver name
  type: 'custom';
  label: string;
  biName: string; // MANDATORY
}

interface DividerItem {
  type: 'divider';
}

// Resolver Type
type CustomEntityPageActionResolver = (params: {
  actionParams: {
    entity: any; // Current entity data
    form: UseFormReturn; // react-hook-form instance
  };
  sdk: AutoPatternsSDK;
}) => ResolvedAction;
```

### Validation Logic
- **IF** mode is `'edit'` **THEN** ONLY `moreActions` is supported (`primaryActions` forbidden).
- **IF** `type: 'custom'` **THEN** `id` MUST match exported resolver name.
- **IF** `type: 'divider'` **THEN** NO other properties allowed.
- **ONLY** `'custom'` and `'divider'` are valid action types in moreActions. There is NO built-in `'duplicate'`, `'copy'`, `'clone'`, `'archive'`, `'export'`, or similar action type.
- **IF** you need any operation beyond navigation (duplicate, archive, export, share, etc.) **THEN** use `type: 'custom'` with a resolver implementation.

### Implementation Rules
- **MUST** place all custom actions in `moreActions` array for Edit Mode.
- **MUST** include `biName` for every action.
- **MUST** return a valid `ResolvedAction` object (see resolved_action.md).
- **MUST** use `errorHandler` for Wix API calls.
- **NEVER** use `primaryActions` or `secondaryActions` in Edit Mode.

### Canonical Example
```typescript
// Config
{
  moreActions: [
    { id: 'sendEmail', type: 'custom', label: 'Send Email', biName: 'send-email-action' },
    { type: 'divider' },
    { id: 'archive', type: 'custom', label: 'Archive', biName: 'archive-action' }
  ]
}

// components/actions/sendEmail.tsx (use .tsx because it contains JSX icon)
export const sendEmail: CustomEntityPageActionResolver = ({ actionParams, sdk }) => {
  return {
    label: 'Send Email',
    icon: <EmailIcon />,
    biName: 'send-email-action',
    onClick: () => {
      // Logic here
    }
  };
};
```

## Entity View Actions

### Type Definitions
```typescript
interface EntityPageViewActions {
  primaryActions?: ActionGroup;
  secondaryActions?: ActionGroup;
  moreActions?: (CustomActionItem | DividerItem)[];
}

type ActionGroup = | { type: 'action'; action: { item: ActionItem } } | { type: 'menu'; menu: { label: string; items: (ActionItem | DividerItem)[] } };

interface DividerItem {
  type: 'divider';
}

interface ActionItem {
  id: string; // Must match resolver if custom
  label: string;
  type: 'create' | 'custom';
  biName: string; // MANDATORY
  create?: {
    mode: 'page';
    page: { id: string };
  };
}

type CustomEntityPageActionResolver = (params: {
  actionParams: { entity: any };
  sdk: AutoPatternsSDK;
}) => ResolvedAction;
```

### Validation Logic
- **IF** mode is `'view'` **THEN** supports `primaryActions`, `secondaryActions`, AND `moreActions`.
- **IF** action type is `'create'` **THEN** `create` config is **REQUIRED**.
- **IF** action type is `'custom'` **THEN** resolver implementation is **REQUIRED**.

### Implementation Rules
- **MUST** use `primaryActions` for main workflow (e.g. Create).
- **MUST** use `secondaryActions` for supporting workflows.
- **MUST** use `moreActions` for less common/admin tasks.
- **MUST** check error handling rules: `errorHandler` for Wix APIs, none for external/SDK.
- **NEVER** manually add "Edit" action; it's automatic if an Edit Mode page exists.

### Canonical Example
```typescript
{
  primaryActions: {
    type: 'action',
    action: {
      item: {
        id: 'createEntity',
        label: 'Create New',
        type: 'create',
        biName: 'create-entity-action',
        create: {
          mode: 'page',
          page: { id: 'entity-edit-page' }
        }
      }
    }
  },
  moreActions: [
    {
      id: 'duplicateEntity',
      type: 'custom',
      label: 'Duplicate',
      biName: 'duplicate-entity-action'
    }
  ]
}
```

## Custom Form Components

### Type Definitions
```typescript
interface CustomComponentProps {
  form: UseFormReturn; // react-hook-form instance
  entity: Record<string, any>; // Initial entity state (static)
}

// Override Component Signature
type CustomComponent = React.FC<CustomComponentProps>;
```

### Configuration Schema
```json
{
  "layout": [
    {
      "type": "Form",
      "form": {
        "groups": [
          {
            "fields": [
              {
                "id": "myCustomField",
                "type": "custom",
                "componentId": "myCustomComponent" // Matches override key
              }
            ]
          }
        ]
      }
    }
  ]
}
```

### Validation Logic
- **IF** overriding an input field **THEN** MUST use `useController` from `@wix/patterns/form` to bind to form state.
- **IF** needing reactivity **THEN** MUST use `form.watch()`, NEVER rely on `entity` prop for updates (it is initial state only).
- **IF** implementing a standalone widget (not input) **THEN** can use `entity` for display-only static data.
- **NEVER** import `useController` from `react-hook-form` directly; use `@wix/patterns/form`.

### Implementation Rules
- **MUST** be placed in `components/customComponents/` folder.
- **MUST** export a `useComponents` hook from `components/customComponents/index.tsx`.
- **MUST** handle form state (invalid, error message, onChange) properly via controller.

### Canonical Example
```tsx
// components/customComponents/CustomInput.tsx
import { useController } from '@wix/patterns/form';
import type { CustomComponentProps } from '@wix/auto-patterns';
import { Input, FormField } from '@wix/design-system';

export const CustomInput: React.FC<CustomComponentProps> = ({ form, entity }) => {
  const { field, fieldState } = useController({
    name: 'title', // Matches schema field ID
    control: form.control,
    defaultValue: entity?.title
  });

  return (
    <FormField label="Title" status={fieldState.error ? 'error' : undefined}>
      <Input {...field} />
    </FormField>
  );
};

// components/customComponents/index.tsx
import { CustomInput } from './CustomInput';
export const useComponents = () => ({ CustomInput });
```

## Custom Entity Headers

### Type Definitions
```typescript
// Subtitle Override
type SubtitleResolver = (entity: Record<string, any>) => { text: string };

// Badge Override
interface BadgeObject {
  text: string;                     // Required: Text to display
  skin?: BadgeSkin;                 // Optional: Visual styling
  prefixIcon?: React.ReactElement;  // Optional: Icon before text (from @wix/wix-ui-icons-common)
  suffixIcon?: React.ReactElement;  // Optional: Icon after text (from @wix/wix-ui-icons-common)
}

type BadgeSkin = 'success' | 'warning' | 'destructive' | 'neutral' | 'premium';

type BadgesResolver = (entity: Record<string, any>) => BadgeObject[];
```

### Configuration Schema
```json
{
  "entityPage": {
    "title": {
      "text": "Entity Details",
      "badges": {
        "id": "entityPageHeaderBadges"  // Must match override key
      }
    },
    "subtitle": {
      "text": "Default subtitle text",
      "id": "entityPageHeaderSubtitle"  // Must match override key
    }
  }
}
```

### Validation Logic
- **IF** overriding subtitle **THEN** function MUST return `{ text: string }` object.
- **IF** overriding badges **THEN** function MUST return array of `BadgeObject` (NOT JSX components).
- **IF** `badges.id` or `subtitle.id` defined in config **THEN** matching override MUST exist.
- **IF** logic depends on entity data **THEN** check for field existence (entity might be partial).
- **IF** `id` in config does not match override key **THEN** override will not render.

### Implementation Rules
- **MUST** be placed in `components/entityPageHeaderSubtitle/` or `components/entityPageHeaderBadges/`.
- **MUST** export `useEntityPageHeaderSubtitle` / `useEntityPageHeaderBadges` hooks from respective index files.
- **MUST** be pure functions (no hooks inside the resolver functions).
- **MUST** ensure `id` in config matches the key in override object exactly.
- **NEVER** return JSX from badge/subtitle functions (return data objects only).

### Canonical Example

#### 1. Subtitle Override
```typescript
// components/entityPageHeaderSubtitle/entityPageHeaderSubtitle.ts
export const entityPageHeaderSubtitle = (entity: Record<string, any>) => {
  return { text: `Created by ${entity.owner || 'Unknown'} on ${entity.date || 'N/A'}` };
};

// components/entityPageHeaderSubtitle/index.ts
import { entityPageHeaderSubtitle } from './entityPageHeaderSubtitle';
export const useEntityPageHeaderSubtitle = () => ({ entityPageHeaderSubtitle });
```

#### 2. Badges Override
```typescript
// components/entityPageHeaderBadges/entityPageHeaderBadges.ts
export const entityPageHeaderBadges = (entity: Record<string, any>) => {
  const badges = [];

  // Add status badge
  if (entity.isActive) {
    badges.push({ text: 'Active', skin: 'success' });
  } else {
    badges.push({ text: 'Inactive', skin: 'neutral' });
  }

  // Add premium badge if applicable
  if (entity.isPremium) {
    badges.push({ text: 'Premium', skin: 'premium' });
  }

  // Add warning badge if needed
  if (entity.needsAttention) {
    badges.push({ text: 'Needs Attention', skin: 'warning' });
  }

  return badges;
};

// components/entityPageHeaderBadges/index.ts
import { entityPageHeaderBadges } from './entityPageHeaderBadges';
export const useEntityPageHeaderBadges = () => ({ entityPageHeaderBadges });
```
