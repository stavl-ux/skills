#!/usr/bin/env node

/**
 * Auto Patterns Generator Script
 *
 * Generates patterns.json and the page component for @wix/auto-patterns dashboard pages.
 * Replicates the deterministic logic from AutoPatternsGenerator.ts.
 *
 * The page component is written as `<folder>.tsx` (the basename of --output) to
 * match — and overwrite — the stub the Wix CLI scaffolds and registers in
 * `<folder>.extension.ts`. This wires the wrapper up with no manual edit.
 *
 * Usage:
 *   node <SKILL_ROOT>/scripts/generate-auto-patterns.js --input <path-to-input.json> --output <target-directory>
 *   node <SKILL_ROOT>/scripts/generate-auto-patterns.js --validate-config <path-to-patterns.json>
 *   node <SKILL_ROOT>/scripts/generate-auto-patterns.js --help
 *
 * <SKILL_ROOT> is the absolute path to the wix-app skill bundle (the folder containing SKILL.md).
 * The script is not installed in the user's app repo — invoke it by absolute path from the project directory.
 *
 * Input JSON shape:
 * {
 *   "collection": {
 *     "idSuffix": "additional-fees",
 *     "fields": [{ "key": "feeTitle", "displayName": "Fee Title", "type": "TEXT" }, ...]
 *   },
 *   "schema": {
 *     "content": { "collectionRouteId": "...", ... (20 string fields) },
 *     "layout": { "main": [...], "sidebar": [...] },
 *     "columns": [{ "id": "feeTitle", "displayName": "Title" }],
 *     "gridItem": null | { "titleFieldId": "...", ... }
 *   },
 *   "relevantCollectionId": "my-namespace/additional-fees",
 *   "extensionName": "Additional Fees Manager",
 *   "dataFoundation": {
 *     "system": "app-owned",
 *     "mechanism": "data-collection-extension",
 *     "collectionId": "my-namespace/additional-fees",
 *     "schemaStatus": "verified",
 *     "freshness": "source-managed",
 *     "capabilities": { "read": true, "insert": true, "update": true, "remove": true }
 *   },
 *   "workflow": { "focus": {...}, "investigate": {...}, "actions": [...], "verify": {...} }
 * }
 *
 * Output:
 *   Writes patterns.json, dashboard-contract.json, and <folder>.tsx to the specified output directory.
 *
 * Exit codes:
 *   0 - Success
 *   1 - Invalid arguments or missing required fields
 *   2 - File system error
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { basename, join, resolve } from 'path';

// --- Argument parsing ---

const args = process.argv.slice(2);

function getArg(name) {
  const idx = args.indexOf(`--${name}`);
  if (idx === -1 || idx + 1 >= args.length) return null;
  return args[idx + 1];
}

if (args.includes('--help') || args.includes('-h')) {
  console.log(`Auto Patterns Generator

Usage:
  node <SKILL_ROOT>/scripts/generate-auto-patterns.js --input <path> --output <dir>
  node <SKILL_ROOT>/scripts/generate-auto-patterns.js --validate-config <path>

<SKILL_ROOT> is the absolute path to the wix-app skill bundle (the folder containing SKILL.md).

Options:
  --input   Path to input JSON file (required)
  --output  Target directory for generated files (required)
  --validate-config  Validate an existing patterns.json without generating files
  --help    Show this help message

Input JSON shape:
  {
    "collection": {
      "idSuffix": "string",
      "fields": [{ "key": "string", "displayName": "string", "type": "string" }]
    },
    "schema": {
      "content": { "collectionRouteId": "string", ... },
      "layout": { "main": [...], "sidebar": [...] },
      "columns": [{ "id": "string", "displayName": "string" }],
      "gridItem": null | { "titleFieldId": "string", ... }
    },
    "relevantCollectionId": "string",
    "extensionName": "string",
    "dataFoundation": {
      "system": "string",
      "mechanism": "native-cms | wix-app-collection | external-database-adaptor | data-collection-extension",
      "collectionId": "string",
      "schemaStatus": "verified",
      "freshness": "string",
      "capabilities": { "read": true, "insert": false, "update": false, "remove": false }
    },
    "workflow": {
      "focus": { "defaultWorkset": "string", "controls": [] },
      "investigate": { "required": true, "surface": "entity-page", "identityField": "string" },
      "actions": [{ "id": "string", "kind": "mutation | owning-app-navigation", "target": "string" }],
      "verify": { "postcondition": "string", "refresh": ["collection"] }
    }
  }

Output:
  Writes patterns.json, dashboard-contract.json, and <folder>.tsx to the output directory.`);
  process.exit(0);
}

const inputPath = getArg('input');
const outputDir = getArg('output');
const validateConfigPath = getArg('validate-config');

if (!validateConfigPath && !inputPath) {
  console.error('Error: --input is required. Use --help for usage.');
  process.exit(1);
}
if (!validateConfigPath && !outputDir) {
  console.error('Error: --output is required. Use --help for usage.');
  process.exit(1);
}

// --- Read and validate input ---

function readJsonFile(filePath, label) {
  try {
    return JSON.parse(readFileSync(resolve(filePath), 'utf-8'));
  } catch (err) {
    console.error(`Error: Failed to read ${label}: ${err.message}`);
    process.exit(1);
  }
}

function collectionComponents(config) {
  if (!Array.isArray(config?.pages)) return [];
  return config.pages.flatMap((page) =>
    page?.type === 'collectionPage' &&
    Array.isArray(page.collectionPage?.components)
      ? page.collectionPage.components.filter(
          (component) => component?.type === 'collection',
        )
      : [],
  );
}

function presetViews(viewsConfig) {
  const presets = viewsConfig?.presets;
  if (!presets) return [];
  if (presets.type === 'views') return presets.views || [];
  if (presets.type === 'categories') {
    return (presets.categories || []).flatMap((category) => category.views || []);
  }
  return [];
}

function validatePatternsConfig(config, collectionFields = []) {
  const errors = [];
  const schemaFieldIds = new Set(
    collectionFields.map((field) => field?.key).filter(Boolean),
  );

  if (!Array.isArray(config?.pages)) {
    return ['config.pages must be an array'];
  }

  for (const [componentIndex, component] of collectionComponents(
    config,
  ).entries()) {
    const filters = component.filters?.items || [];
    const filterIds = new Set();

    for (const filter of filters) {
      if (!filter?.id) {
        errors.push(`collection component ${componentIndex}: filter is missing id`);
        continue;
      }
      if (filterIds.has(filter.id)) {
        errors.push(
          `collection component ${componentIndex}: duplicate filter id "${filter.id}"`,
        );
      }
      filterIds.add(filter.id);

      if (!filter.fieldId) {
        errors.push(
          `collection component ${componentIndex}: filter "${filter.id}" is missing fieldId`,
        );
      } else if (
        schemaFieldIds.size > 0 &&
        !schemaFieldIds.has(filter.fieldId)
      ) {
        errors.push(
          `collection component ${componentIndex}: filter "${filter.id}" references unknown schema field "${filter.fieldId}"`,
        );
      }
    }

    for (const view of presetViews(component.views)) {
      for (const filterId of Object.keys(view?.filters || {})) {
        if (!filterIds.has(filterId)) {
          errors.push(
            `collection component ${componentIndex}: view "${view.id || view.label || 'unnamed'}" references undeclared filter "${filterId}"`,
          );
        }
      }
    }
  }

  return errors;
}

function exitOnConfigErrors(config, collectionFields) {
  const errors = validatePatternsConfig(config, collectionFields);
  if (!errors.length) return;

  console.error('Error: Invalid Auto Patterns configuration:');
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

if (validateConfigPath) {
  const config = readJsonFile(validateConfigPath, 'patterns.json');
  exitOnConfigErrors(config);
  console.log(
    JSON.stringify({
      success: true,
      validated: resolve(validateConfigPath),
    }),
  );
  process.exit(0);
}

let input;
input = readJsonFile(inputPath, 'input file');

const { collection, schema, relevantCollectionId, dataFoundation, workflow } = input;

if (!collection || !collection.idSuffix || !Array.isArray(collection.fields)) {
  console.error(
    'Error: Input must include "collection" with "idSuffix" and "fields" array.',
  );
  process.exit(1);
}
if (
  !schema ||
  !schema.content ||
  !schema.layout ||
  !Array.isArray(schema.columns)
) {
  console.error(
    'Error: Input must include "schema" with "content", "layout", and "columns".',
  );
  process.exit(1);
}

const allowedMechanisms = new Set([
  'native-cms',
  'wix-app-collection',
  'external-database-adaptor',
  'data-collection-extension',
]);
const capabilities = dataFoundation?.capabilities;
const invalidFoundation =
  !dataFoundation
  || typeof dataFoundation.system !== 'string'
  || !allowedMechanisms.has(dataFoundation.mechanism)
  || dataFoundation.collectionId !== relevantCollectionId
  || dataFoundation.schemaStatus !== 'verified'
  || typeof dataFoundation.freshness !== 'string'
  || !dataFoundation.freshness.trim()
  || !capabilities
  || capabilities.read !== true
  || ['insert', 'update', 'remove'].some((key) => typeof capabilities[key] !== 'boolean');
if (invalidFoundation) {
  console.error(
    'Error: Input must include a verified dataFoundation whose collectionId matches relevantCollectionId and whose read/insert/update/remove capabilities are explicit.',
  );
  process.exit(1);
}

const invalidWorkflow =
  !workflow
  || typeof workflow.focus?.defaultWorkset !== 'string'
  || workflow.investigate?.required !== true
  || typeof workflow.investigate?.surface !== 'string'
  || typeof workflow.investigate?.identityField !== 'string'
  || !Array.isArray(workflow.actions)
  || workflow.actions.length === 0
  || workflow.actions.some(
    (action) =>
      typeof action?.id !== 'string'
      || !['mutation', 'owning-app-navigation'].includes(action?.kind)
      || typeof action?.target !== 'string'
      || !action.target.trim(),
  )
  || typeof workflow.verify?.postcondition !== 'string'
  || !Array.isArray(workflow.verify?.refresh)
  || !workflow.verify.refresh.includes('collection');
if (invalidWorkflow) {
  console.error(
    'Error: Input must include Focus, required Investigation, at least one real mutation or owning-app navigation action, and Verify with a collection refresh.',
  );
  process.exit(1);
}

// --- Generator logic (mirrors AutoPatternsGenerator.ts) ---

function generatePatternsConfig(collection, schema) {
  const collectionRouteId = schema.content.collectionRouteId;
  const singularEntityName = schema.content.singularEntityName;
  const canInsert = capabilities.insert;
  const canUpdate = capabilities.update;
  const canRemove = capabilities.remove;

  // Build field map
  const fieldMap = new Map();
  for (const field of collection.fields) {
    if (field.key && field.displayName) {
      fieldMap.set(field.key, field);
    }
  }

  const sortableFieldTypes = ['TEXT', 'DATE', 'NUMBER', 'BOOLEAN', 'URL'];

  // Generate columns
  const columns = schema.columns
    .map((columnConfig) => {
      const field = fieldMap.get(columnConfig.id);
      if (!field || !field.key || !field.type) return null;

      let width = '200px';
      if (['BOOLEAN', 'IMAGE', 'NUMBER'].includes(field.type)) width = '100px';
      if (field.type === 'URL') width = '300px';

      return {
        id: field.key,
        name: columnConfig.displayName || field.displayName || 'Field',
        width,
        sortable: sortableFieldTypes.includes(field.type || ''),
      };
    })
    .filter(Boolean);

  // Generate filters
  const filterableFieldTypes = ['DATE', 'NUMBER', 'BOOLEAN'];
  const filters = columns
    .map((column) => {
      const field = fieldMap.get(column.id);
      if (
        !field ||
        !field.key ||
        !filterableFieldTypes.includes(field.type || '')
      )
        return null;

      const baseFilter = {
        id: `${field.key}-filter`,
        fieldId: field.key,
        displayName: field.displayName || '',
        tagLabel: field.displayName || '',
      };

      if (field.type === 'DATE') {
        return {
          ...baseFilter,
          dateConfig: {
            mode: 'COMBINE',
            presets: [
              'TODAY',
              'SEVEN_DAYS',
              'MONTH',
              'NEXT_SEVEN_DAYS',
              'NEXT_THIRTY_DAYS',
            ],
            includeTime: false,
          },
        };
      }
      if (field.type === 'NUMBER') {
        return {
          ...baseFilter,
          numberConfig: { allowedDecimals: true },
        };
      }
      if (field.type === 'BOOLEAN') {
        return baseFilter;
      }
      return null;
    })
    .filter(Boolean);

  // Generate layout (Table + optional Grid)
  const layout = [
    {
      type: 'Table',
      table: {
        columns,
        customColumns: { enabled: true },
      },
    },
  ];

  if (schema.gridItem) {
    layout.push({
      type: 'Grid',
      grid: {
        item: {
          titleFieldId: schema.gridItem.titleFieldId,
          ...(schema.gridItem.subtitleFieldId
            ? { subtitleFieldId: schema.gridItem.subtitleFieldId }
            : {}),
          ...(schema.gridItem.imageFieldId
            ? { imageFieldId: schema.gridItem.imageFieldId }
            : {}),
          cardContentMode: schema.gridItem.subtitleFieldId ? 'full' : 'title',
        },
      },
    });
  }

  // Generate entity page layout
  function generateEntityPageLayout(layoutData) {
    if (!layoutData) return { main: [] };

    const main = layoutData.main.map((section) => ({
      type: 'card',
      card: {
        title: { text: section.title },
        subtitle: { text: section.subtitle },
        children: section.fields.map((fieldKey) => ({
          type: 'field',
          field: { span: 12, fieldId: fieldKey },
        })),
      },
    }));

    const sidebar = layoutData.sidebar.map((section) => ({
      type: 'card',
      card: {
        title: { text: section.title },
        subtitle: { text: section.subtitle },
        children: section.fields.map((fieldKey) => ({
          type: 'field',
          field: { span: 12, fieldId: fieldKey },
        })),
      },
    }));

    return {
      main,
      ...(sidebar.length > 0 ? { sidebar } : {}),
    };
  }

  // Use relevantCollectionId for the collection reference in the config
  const collectionId = relevantCollectionId || collection.idSuffix;

  return {
    pages: [
      {
        id: `${collectionRouteId}-collection`,
        type: 'collectionPage',
        appMainPage: true,
        collectionPage: {
          route: { path: '/' },
          title: {
            text: schema.content.pageTitle || '',
            hideTotal: false,
          },
          subtitle: {
            text: schema.content.pageSubtitle || '',
          },
          ...(canInsert ? { actions: {
            primaryActions: {
              type: 'action',
              action: {
                item: {
                  id: `create-${collectionRouteId}`,
                  type: 'create',
                  label: schema.content.actionButtonLabel,
                  collection: {
                    collectionId,
                    entityTypeSource: 'cms',
                  },
                  create: {
                    mode: 'page',
                    page: { id: `${collectionRouteId}-entity` },
                  },
                },
              },
            },
          } } : {}),
          components: [
            {
              type: 'collection',
              layout,
              entityPageId: `${collectionRouteId}-entity`,
              collection: {
                collectionId,
                entityTypeSource: 'cms',
              },
              toolbarTitle: {
                title: schema.content.toolbarTitle || '',
                subtitle: {
                  text: schema.content.toolbarSubtitle || '',
                },
                showTotal: true,
              },
              filters: { items: filters },
              emptyState: {
                title: schema.content.emptyStateTitle,
                subtitle: schema.content.emptyStateSubtitle,
                ...(canInsert ? { addNewCta: {
                  id: `create-${collectionRouteId}`,
                  text: schema.content.emptyStateButtonText,
                } } : {}),
              },
              ...((canUpdate || canRemove) ? { actionCell: {
                ...(canUpdate ? {
                primaryAction: {
                  item: {
                    id: `edit-${collectionRouteId}`,
                    type: 'update',
                    update: {
                      mode: 'page',
                      page: { id: `${collectionRouteId}-entity` },
                    },
                  },
                } } : {}),
                ...(canRemove ? {
                secondaryActions: {
                  items: [
                    {
                      id: `delete-${collectionRouteId}`,
                      type: 'delete',
                      label: 'Delete',
                      delete: {
                        mode: 'modal',
                        modal: {
                          title: {
                            text: schema.content.deleteModalTitle || '',
                          },
                          description: {
                            text: schema.content.deleteModalDescription || '',
                          },
                          feedback: {
                            successToast: {
                              text: schema.content.deleteSuccessToast || '',
                            },
                            errorToast: {
                              text: schema.content.deleteErrorToast || '',
                            },
                          },
                        },
                      },
                    },
                  ],
                } } : {}),
              } } : {}),
              ...(canRemove ? { bulkActionToolbar: {
                primaryActions: [
                  {
                    type: 'action',
                    action: {
                      item: {
                        id: `bulk-delete-${collectionRouteId}`,
                        type: 'bulkDelete',
                        bulkDelete: {
                          mode: 'modal',
                          modal: {
                            title: {
                              text: schema.content.bulkDeleteModalTitle || '',
                            },
                            description: {
                              text:
                                schema.content.bulkDeleteModalDescription || '',
                            },
                            feedback: {
                              successToast: {
                                text:
                                  schema.content.bulkDeleteSuccessToast || '',
                              },
                              errorToast: {
                                text: schema.content.bulkDeleteErrorToast || '',
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                ],
              } } : {}),
            },
          ],
        },
      },
      {
        id: `${collectionRouteId}-entity`,
        type: 'entityPage',
        entityPage: {
          route: {
            path: `/${singularEntityName}/:entityId`,
            params: { id: 'entityId' },
          },
          title: { text: schema.content.entityPageTitle || '' },
          subtitle: { text: schema.content.entityPageSubtitle },
          parentPageId: `${collectionRouteId}-collection`,
          mode: canUpdate ? 'edit' : 'view',
          layout: generateEntityPageLayout(schema.layout),
          collectionId,
          entityTypeSource: 'cms',
        },
      },
    ],
  };
}

function generatePageTsx() {
  return `import React from 'react';
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
`;
}

// --- Generate and write output ---

const resolvedOutput = resolve(outputDir);

try {
  if (!existsSync(resolvedOutput)) {
    mkdirSync(resolvedOutput, { recursive: true });
  }
} catch (err) {
  console.error(`Error: Failed to create output directory: ${err.message}`);
  process.exit(2);
}

const patternsConfig = generatePatternsConfig(collection, schema);
exitOnConfigErrors(patternsConfig, collection.fields);
const pageTsx = generatePageTsx();
const dashboardContract = { dataFoundation, workflow };

// The Wix CLI scaffolds the page component as `<folder>.tsx` and registers THAT
// file in the generated `<folder>.extension.ts`. Write the auto-patterns wrapper
// to the same filename so it overwrites the CLI stub and is wired up with no
// manual edit to the builder file. (Writing `page.tsx` would leave the wrapper
// unregistered next to the empty stub the CLI registered.)
const componentFileName = `${basename(resolvedOutput)}.tsx`;

try {
  writeFileSync(
    join(resolvedOutput, 'patterns.json'),
    JSON.stringify(patternsConfig, null, 2),
  );
  writeFileSync(
    join(resolvedOutput, 'dashboard-contract.json'),
    JSON.stringify(dashboardContract, null, 2),
  );
  writeFileSync(join(resolvedOutput, componentFileName), pageTsx);
} catch (err) {
  console.error(`Error: Failed to write output files: ${err.message}`);
  process.exit(2);
}

// Print structured result to stdout
console.log(
  JSON.stringify({
    success: true,
    files: ['patterns.json', 'dashboard-contract.json', componentFileName],
    outputDir: resolvedOutput,
  }),
);
