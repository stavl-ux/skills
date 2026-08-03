#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import {
  authoritativeEditableFields,
  validateWorkflowContract,
  workflowActions,
} from './lib/dashboard-contract.mjs';

const args = process.argv.slice(2);
const routeOnly = args.includes('--route-only');
const inputs = args.filter((argument) => argument !== '--route-only');
if (!inputs.length) {
  console.error('Usage: node audit-dashboard-code.mjs [--route-only] <generated-file-or-directory> [...]');
  process.exit(2);
}

const supportedExtensions = new Set(['.js', '.jsx', '.ts', '.tsx']);
const routeRecordName = '.dashboard-route.json';

function sourceFiles(inputPath) {
  const absolute = path.resolve(inputPath);
  if (!fs.existsSync(absolute)) throw new Error(`Path does not exist: ${inputPath}`);
  const stat = fs.statSync(absolute);
  if (stat.isFile()) return supportedExtensions.has(path.extname(absolute)) ? [absolute] : [];
  return fs.readdirSync(absolute, { withFileTypes: true }).flatMap((entry) =>
    sourceFiles(path.join(absolute, entry.name)),
  );
}

function namedFiles(inputPath, fileName) {
  const absolute = path.resolve(inputPath);
  if (!fs.existsSync(absolute)) throw new Error(`Path does not exist: ${inputPath}`);
  const stat = fs.statSync(absolute);
  if (stat.isFile()) return path.basename(absolute) === fileName ? [absolute] : [];
  return fs.readdirSync(absolute, { withFileTypes: true }).flatMap((entry) =>
    namedFiles(path.join(absolute, entry.name), fileName),
  );
}

function projectSourceRoots(inputPath) {
  const absolute = path.resolve(inputPath);
  if (!fs.existsSync(absolute)) return [];
  let current = fs.statSync(absolute).isDirectory() ? absolute : path.dirname(absolute);
  const roots = [];

  while (true) {
    if (path.basename(current) === 'src') roots.push(current);
    const nestedSource = path.join(current, 'src');
    if (fs.existsSync(path.join(nestedSource, 'extensions'))) roots.push(nestedSource);
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }

  return roots;
}

function lineAt(content, index) {
  return content.slice(0, index).split(/\r?\n/).length;
}

const findings = [];

function addFinding(filePath, content, index, rule, message) {
  findings.push({ filePath, line: lineAt(content, Math.max(index, 0)), rule, message });
}

function report(filePath, content, rule, pattern, message) {
  const match = pattern.exec(content);
  if (!match) return;
  findings.push({ filePath, line: lineAt(content, match.index), rule, message });
}

let files;
let routeRecordPaths;
let patternsPaths;
let dashboardContractPaths;
let dataCollectionFiles;
let dashboardModalFiles;
try {
  files = routeOnly ? [] : [...new Set(inputs.flatMap(sourceFiles))];
  routeRecordPaths = [...new Set(inputs.flatMap((input) => namedFiles(input, routeRecordName)))];
  patternsPaths = routeOnly
    ? []
    : [...new Set(inputs.flatMap((input) => namedFiles(input, 'patterns.json')))];
  dashboardContractPaths = routeOnly
    ? []
    : [...new Set(inputs.flatMap((input) => namedFiles(input, 'dashboard-contract.json')))];
  dataCollectionFiles = routeOnly
    ? []
    : [...new Set(
      inputs
        .flatMap(projectSourceRoots)
        .map((sourceRoot) => path.join(sourceRoot, 'extensions', 'backend', 'data-collections'))
        .filter(fs.existsSync)
        .flatMap(sourceFiles),
    )];
  dashboardModalFiles = routeOnly
    ? []
    : [...new Set(
      inputs
        .flatMap(projectSourceRoots)
        .map((sourceRoot) => path.join(sourceRoot, 'extensions', 'dashboard', 'modals'))
        .filter(fs.existsSync)
        .flatMap(sourceFiles),
    )];
  files = [...new Set([...files, ...dashboardModalFiles])];
} catch (error) {
  console.error(error.message);
  process.exit(2);
}

const contents = new Map(files.map((filePath) => [filePath, fs.readFileSync(filePath, 'utf8')]));
const projectSource = [...contents.values()].join('\n');
const dashboardPageSource = files
  .filter((filePath) => !dashboardModalFiles.includes(filePath))
  .map((filePath) => contents.get(filePath))
  .join('\n');
const projectHasSidePanel = [...contents.values()].some((content) => /<SidePanel\b/.test(content));
const routeRecords = [];
const patternDocuments = [];
const dashboardContracts = [];

function walkJson(value, visit) {
  visit(value);
  if (Array.isArray(value)) {
    value.forEach((entry) => walkJson(entry, visit));
    return;
  }
  if (value && typeof value === 'object') {
    Object.values(value).forEach((entry) => walkJson(entry, visit));
  }
}

for (const patternsPath of patternsPaths) {
  try {
    patternDocuments.push({
      path: patternsPath,
      value: JSON.parse(fs.readFileSync(patternsPath, 'utf8')),
    });
  } catch (error) {
    findings.push({
      filePath: patternsPath,
      line: 1,
      rule: 'AP-06',
      message: `patterns.json is not valid JSON: ${error.message}`,
    });
  }
}

for (const contractPath of dashboardContractPaths) {
  try {
    dashboardContracts.push({
      path: contractPath,
      value: JSON.parse(fs.readFileSync(contractPath, 'utf8')),
    });
  } catch (error) {
    findings.push({
      filePath: contractPath,
      line: 1,
      rule: 'AP-19',
      message: `dashboard-contract.json is not valid JSON: ${error.message}`,
    });
  }
}

const collectionRuntimeResolvers = new Map();
const entityRuntimeResolvers = new Map();
const entityPages = new Map();
const collectionEntityLinks = [];
const restrictedRemoveCollections = new Map();
const managedCollectionSuffixes = new Set();
const collectionFieldsBySuffix = new Map();
const collectionActionChecks = [];
const savedViewFieldIds = new Set();
const savedViewFilterIdsByField = new Map();
let hasEntityPagePattern = false;

for (const filePath of dataCollectionFiles) {
  const content = fs.readFileSync(filePath, 'utf8');
  const constants = new Map(
    [...content.matchAll(/\bconst\s+([A-Za-z_$][\w$]*)\s*=\s*['"]([^'"]+)['"]/g)]
      .map((match) => [match[1], match[2]]),
  );
  const suffixMatch = /\bidSuffix\s*:\s*(?:['"]([^'"]+)['"]|([A-Za-z_$][\w$]*))/.exec(content);
  const suffix = suffixMatch?.[1] ?? constants.get(suffixMatch?.[2]);
  const fieldIds = new Set(
    [...content.matchAll(/\bkey\s*:\s*['"]([^'"]+)['"]/g)]
      .map((match) => match[1]),
  );
  if (suffix && fieldIds.size) collectionFieldsBySuffix.set(suffix, fieldIds);
  if (suffix && /\bitemUpdate\s*:\s*['"]CMS_EDITOR['"]/.test(content)) {
    if (
      !/\bitemRemove\s*:\s*['"]CMS_EDITOR['"]/.test(content)
      && !/dashboard-item-remove:\s*restricted\s*-\s*\S/i.test(content)
    ) {
      restrictedRemoveCollections.set(suffix, filePath);
    }
  }
}

function registerCollectionRuntimeResolver(id, kind) {
  if (typeof id !== 'string' || !id.trim()) return;
  const normalizedId = id.trim();
  const kinds = collectionRuntimeResolvers.get(normalizedId) ?? new Set();
  kinds.add(kind);
  collectionRuntimeResolvers.set(normalizedId, kinds);
}

function registerEntityRuntimeResolver(id, kind) {
  if (typeof id !== 'string' || !id.trim()) return;
  const normalizedId = id.trim();
  const kinds = entityRuntimeResolvers.get(normalizedId) ?? new Set();
  kinds.add(kind);
  entityRuntimeResolvers.set(normalizedId, kinds);
}

function containsMutatingAction(value) {
  let found = false;
  walkJson(value, (candidate) => {
    if (found || !candidate || typeof candidate !== 'object' || Array.isArray(candidate)) return;
    if (['delete', 'bulkDelete'].includes(candidate.type)) {
      found = true;
      return;
    }
    if (candidate.type !== 'custom') return;
    const actionText = [candidate.id, candidate.label, candidate.biName]
      .filter((part) => typeof part === 'string')
      .join(' ');
    found = /\b(?:mark|review|approve|reject|resolve|dismiss|archive|restore|update|edit|assign|contact|activate|deactivate|cancel|refund|reorder|restock)\b/i.test(
      actionText.replace(/([a-z])([A-Z])/g, '$1 $2'),
    );
  });
  return found;
}

function customActions(value) {
  const actions = [];
  walkJson(value, (candidate) => {
    if (
      candidate
      && typeof candidate === 'object'
      && !Array.isArray(candidate)
      && candidate.type === 'custom'
      && typeof candidate.id === 'string'
      && candidate.id.trim()
    ) {
      actions.push(candidate);
    }
  });
  return actions;
}

function normalizedActionOutcome(action) {
  return String(action?.label ?? action?.id ?? '')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\bbulk\b/gi, '')
    .replace(/[^a-z0-9]+/gi, ' ')
    .trim()
    .toLowerCase();
}

for (const document of patternDocuments) {
  for (const page of document.value?.pages ?? []) {
    if (page?.type === 'entityPage' && page.entityPage) {
      hasEntityPagePattern = true;
      if (typeof page.id === 'string' && page.id.trim()) {
        entityPages.set(page.id.trim(), {
          path: document.path,
          id: page.id.trim(),
          mode: page.entityPage.mode ?? 'edit',
          collectionId: page.entityPage.collectionId,
          parentPageId: page.entityPage.parentPageId,
          hasActions: Boolean(page.entityPage.actions && Object.keys(page.entityPage.actions).length),
        });
      }
      registerEntityRuntimeResolver(page.entityPage.title?.badges?.id, 'badge override');
      registerEntityRuntimeResolver(page.entityPage.subtitle?.id, 'subtitle override');
      walkJson(page.entityPage.actions, (value) => {
        if (
          value
          && typeof value === 'object'
          && !Array.isArray(value)
          && value.type === 'custom'
        ) {
          registerEntityRuntimeResolver(value.id, 'entity action');
        }
      });
      continue;
    }

    if (page?.type !== 'collectionPage' || !page.collectionPage) continue;
    walkJson(page.collectionPage.components, (value) => {
      if (!value || typeof value !== 'object' || Array.isArray(value)) return;
      if (value.type !== 'collection' && !value.collection?.collectionId) return;

      const collectionId = value.collection?.collectionId;
      if (typeof collectionId === 'string') {
        managedCollectionSuffixes.add(collectionId.split('/').filter(Boolean).at(-1));
      }

      const collectionSuffix = typeof collectionId === 'string'
        ? collectionId.split('/').filter(Boolean).at(-1)
        : undefined;
      const filterItems = value.filters?.items ?? [];
      const filterFieldsById = new Map(
        filterItems
          .filter((filter) => typeof filter?.id === 'string' && typeof filter?.fieldId === 'string')
          .map((filter) => [filter.id, filter.fieldId]),
      );
      const filtersById = new Map(
        filterItems
          .filter((filter) => typeof filter?.id === 'string')
          .map((filter) => [filter.id, filter]),
      );
      const collectionFields = collectionFieldsBySuffix.get(collectionSuffix);
      if (collectionFields) {
        for (const filter of filterItems) {
          if (
            typeof filter?.id !== 'string'
            || typeof filter?.fieldId !== 'string'
            || collectionFields.has(filter.fieldId)
          ) {
            continue;
          }
          const content = fs.readFileSync(document.path, 'utf8');
          addFinding(
            document.path,
            content,
            content.indexOf(`"${filter.fieldId}"`),
            'AP-18',
            `Filter "${filter.id}" references unknown collection field "${filter.fieldId}". Define the field in the app-owned collection or correct the filter before using it in a Saved View.`,
          );
        }
      }
      walkJson(value.views?.presets, (preset) => {
        if (!preset?.filters || typeof preset.filters !== 'object' || Array.isArray(preset.filters)) {
          return;
        }
        for (const [filterId, presetFilter] of Object.entries(preset.filters)) {
          const fieldId = filterFieldsById.get(filterId);
          if (fieldId) {
            savedViewFieldIds.add(fieldId);
            const filterIds = savedViewFilterIdsByField.get(fieldId) ?? new Set();
            filterIds.add(filterId);
            savedViewFilterIdsByField.set(fieldId, filterIds);
            if (presetFilter?.filterType === 'enum') {
              const declaredOptions = filtersById.get(filterId)?.enumConfig?.options;
              const selectedIds = Array.isArray(presetFilter.value)
                ? presetFilter.value.map((option) => option?.id).filter(Boolean)
                : [];
              const declaredValues = new Set(
                Array.isArray(declaredOptions)
                  ? declaredOptions.map((option) => option?.value).filter(Boolean)
                  : [],
              );
              if (
                !declaredValues.size
                || selectedIds.some((selectedId) => !declaredValues.has(selectedId))
              ) {
                const content = fs.readFileSync(document.path, 'utf8');
                addFinding(
                  document.path,
                  content,
                  content.indexOf(`"${filterId}"`),
                  'AP-18',
                  `Saved View enum filter "${filterId}" is missing a matching filters.items enumConfig, or its selected values are not declared options. Configure the enum before relying on this View as an operational workset.`,
                );
              }
            }
            continue;
          }
          const content = fs.readFileSync(document.path, 'utf8');
          addFinding(
            document.path,
            content,
            content.indexOf(`"${filterId}"`),
            'AP-18',
            `Saved View filter "${filterId}" has no matching declaration in filters.items. Declare the filter and its fieldId before using it in a View.`,
          );
        }
      });

      const rowPrimaryActions = customActions(value.actionCell?.primaryAction);
      const bulkPrimaryActions = [
        ...customActions(value.bulkActionToolbar?.primaryActions),
        ...customActions(value.table?.bulkActionToolbar?.primaryActions),
        ...customActions(value.grid?.bulkActionToolbar?.primaryActions),
      ];
      collectionActionChecks.push({
        path: document.path,
        rowPrimaryActions,
        bulkPrimaryActions,
      });

      for (const action of customActions(value.actionCell)) {
        registerCollectionRuntimeResolver(action.id, 'row action');
      }
      for (const action of customActions({
        bulkActionToolbar: value.bulkActionToolbar,
        tableBulkActionToolbar: value.table?.bulkActionToolbar,
        gridBulkActionToolbar: value.grid?.bulkActionToolbar,
      })) {
        registerCollectionRuntimeResolver(action.id, 'bulk action');
      }

      const actionConfig = JSON.stringify({
        actionCell: value.actionCell,
        bulkActionToolbar: value.bulkActionToolbar,
        tableBulkActionToolbar: value.table?.bulkActionToolbar,
        gridBulkActionToolbar: value.grid?.bulkActionToolbar,
      });
      if (typeof value.entityPageId === 'string' && value.entityPageId.trim()) {
        collectionEntityLinks.push({
          path: document.path,
          entityPageId: value.entityPageId.trim(),
          hasMutatingActions: containsMutatingAction(JSON.parse(actionConfig)),
        });
      }
    });
  }

  walkJson(document.value, (value) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return;
    if (value.type === 'entityPage') hasEntityPagePattern = true;
    if (
      value.onRowClick?.type === 'custom'
      && typeof value.onRowClick.id === 'string'
      && value.onRowClick.id.trim()
    ) {
      registerCollectionRuntimeResolver(value.onRowClick.id, 'onRowClick');
    }
  });
}

for (const suffix of managedCollectionSuffixes) {
  const collectionFile = restrictedRemoveCollections.get(suffix);
  if (!collectionFile) continue;
  findings.push({
    filePath: collectionFile,
    line: 1,
    rule: 'AP-15',
    message: `App-owned editor collection "${suffix}" restricts itemRemove without a recorded product reason. Default it to CMS_EDITOR and expose confirmed Delete, or add "dashboard-item-remove: restricted - <reason>" beside the permission.`,
  });
}

for (const check of collectionActionChecks) {
  for (const bulkAction of check.bulkPrimaryActions) {
    const bulkOutcome = normalizedActionOutcome(bulkAction);
    const hasMatchingRowAction = check.rowPrimaryActions.some(
      (rowAction) => normalizedActionOutcome(rowAction) === bulkOutcome,
    );
    if (hasMatchingRowAction) continue;
    findings.push({
      filePath: check.path,
      line: 1,
      rule: 'AP-16',
      message: `Primary bulk action "${bulkAction.label ?? bulkAction.id}" is not mirrored by a primary row action with the same outcome. Keep the dashboard's defining transition primary in both contexts.`,
    });
  }
}

for (const link of collectionEntityLinks) {
  const entityPage = entityPages.get(link.entityPageId);
  if (
    !entityPage
    || entityPage.mode !== 'view'
    || entityPage.hasActions
    || !link.hasMutatingActions
  ) continue;

  const hasPairedEditPage = [...entityPages.values()].some((candidate) =>
    candidate.mode === 'edit'
    && candidate.id !== entityPage.id
    && candidate.collectionId === entityPage.collectionId
    && candidate.parentPageId === entityPage.parentPageId
  );
  if (!hasPairedEditPage) {
    findings.push({
      filePath: link.path,
      line: 1,
      rule: 'AP-10',
      message: `Collection links mutating row or bulk actions to view-only entity page "${link.entityPageId}" with no entity actions or paired edit page. Preserve the relevant single-record workflow or remove unrelated collection mutations.`,
    });
  }
}

for (const contract of dashboardContracts) {
  const workflow = contract.value?.workflow;
  const implementation = workflow?.implementation;
  const actions = workflowActions(workflow);
  const editableFields = authoritativeEditableFields(workflow);
  const workflowErrors = validateWorkflowContract(workflow, {
    capabilities: contract.value?.dataFoundation?.capabilities,
    requireCollectionRefresh: true,
  });

  if (workflowErrors.length) {
    findings.push({
      filePath: contract.path,
      line: 1,
      rule: 'AP-19',
      message: `Dashboard contract does not complete the five-WHAT journey: ${workflowErrors.join('; ')}.`,
    });
    continue;
  }

  const editEntityPages = [...entityPages.values()].filter((page) => page.mode === 'edit');
  const viewEntityPages = [...entityPages.values()].filter((page) => page.mode === 'view');
  const hasDeclaredEditSurface =
    editEntityPages.length > 0
    || (implementation.investigationSurface === 'side-panel' && projectHasSidePanel)
    || (implementation.investigationSurface === 'modal' && dashboardModalFiles.length > 0);

  if (editableFields.length > 0 && !hasDeclaredEditSurface) {
    findings.push({
      filePath: contract.path,
      line: 1,
      rule: 'AP-12',
      message: 'The workflow declares authoritative field editing, but no matching edit entity page, SidePanel, or Modal implementation exists.',
    });
  }

  if (
    editableFields.length === 0
    && implementation.evidenceMode === 'read-only'
    && implementation.investigationSurface === 'entity-page'
    && editEntityPages.length > 0
    && viewEntityPages.length === 0
  ) {
    findings.push({
      filePath: contract.path,
      line: 1,
      rule: 'AP-19',
      message: 'The workflow declares read-only evidence and no authoritative editing, but investigation resolves only to a generic edit entity page. Use a view surface with the workflow actions, or explicitly declare why editing belongs to the job.',
    });
  }

  if (implementation.investigationSurface === 'side-panel' && !projectHasSidePanel) {
    findings.push({
      filePath: contract.path,
      line: 1,
      rule: 'AP-19',
      message: 'The workflow selects a SidePanel to preserve collection context, but no SidePanel implementation exists in the audited dashboard.',
    });
  }

  for (const action of actions) {
    for (const surface of action.surfaces ?? []) {
      if (!['row', 'bulk', 'detail'].includes(surface)) continue;
      const resolverId = implementation.actionBindings?.[action.id]?.[surface] ?? action.id;
      const collectionKinds = collectionRuntimeResolvers.get(resolverId) ?? new Set();
      const isRegistered = surface === 'detail'
        ? entityRuntimeResolvers.has(resolverId)
        : collectionKinds.has(`${surface} action`);
      if (isRegistered) continue;
      findings.push({
        filePath: contract.path,
        line: 1,
        rule: 'AP-19',
        message: `Workflow action "${action.id}" declares a ${surface} surface bound to resolver "${resolverId}", but that resolver is not registered on the ${surface} surface. Use one logical action with explicit workflow.implementation.actionBindings when runtime resolver IDs differ.`,
      });
    }
  }
}

const requiresRouteRecord = routeOnly || (files.length && !patternsPaths.length);
if (requiresRouteRecord && routeRecordPaths.length !== 1) {
  findings.push({
    filePath: files[0] ?? path.resolve(inputs[0]),
    line: 1,
    rule: 'RT-01',
    message: routeRecordPaths.length
      ? `Dashboard source must contain exactly one ${routeRecordName}; found ${routeRecordPaths.length}.`
      : `Dashboard source is missing the required ${routeRecordName}.`,
  });
} else if (!routeOnly && routeRecordPaths.length > 1) {
  findings.push({
    filePath: routeRecordPaths[0],
    line: 1,
    rule: 'RT-01',
    message: `Dashboard source may contain at most one ${routeRecordName}; found ${routeRecordPaths.length}.`,
  });
}

for (const recordPath of routeRecordPaths) {
  let record;
  try {
    record = JSON.parse(fs.readFileSync(recordPath, 'utf8'));
    routeRecords.push({ path: recordPath, record });
  } catch (error) {
    findings.push({
      filePath: recordPath,
      line: 1,
      rule: 'RT-01',
      message: `Route record is not valid JSON: ${error.message}`,
    });
    continue;
  }

  const routes = new Set([
    'auto-patterns',
    'auto-patterns-change',
    'custom-table',
    'custom-table-panel',
    'analytics',
    'modal',
  ]);
  if (!routes.has(record.route)) {
    findings.push({
      filePath: recordPath,
      line: 1,
      rule: 'RT-01',
      message: `Route record has unsupported route "${record.route ?? ''}".`,
    });
  }

  if (!Number.isInteger(record.sourceCount) || record.sourceCount < 0) {
    findings.push({
      filePath: recordPath,
      line: 1,
      rule: 'RT-02',
      message: 'sourceCount must be a non-negative integer counting resolved collection interfaces or non-record analytical systems.',
    });
  }
  if (!Array.isArray(record.sources) || record.sources.length !== record.sourceCount) {
    findings.push({
      filePath: recordPath,
      line: 1,
      rule: 'RT-02',
      message: 'sources must list each physical source exactly once and match sourceCount.',
    });
  }

  const collectionOwner = record.regionOwners?.collection
    ?? (['custom-table', 'custom-table-panel'].includes(record.route)
      ? 'custom-wds-table'
      : null);
  const hasCustomRecordSurface =
    collectionOwner === 'custom-wds-table'
    && (routeOnly || /<Table\b/.test(projectSource));

  if (hasCustomRecordSurface && record.sourceCount === 1) {
    findings.push({
      filePath: recordPath,
      line: 1,
      rule: 'DF-01',
      message: 'A one-source record table must resolve the source to one CMS collection interface and use Auto Patterns. API origin, computed flags, filters, and neighboring analytics do not justify a custom WDS table.',
    });
  }

  if (hasCustomRecordSurface) {
    const resolvedCollections = record.resolvedCollections;
    const invalidResolvedCollection = !Array.isArray(resolvedCollections)
      || resolvedCollections.length !== record.sourceCount
      || resolvedCollections.some((collection) =>
        !collection
        || typeof collection.system !== 'string'
        || !['native-cms', 'wix-app-collection', 'external-database-adaptor', 'data-collection-extension'].includes(collection.mechanism)
        || typeof collection.collectionId !== 'string'
        || !collection.collectionId.trim()
        || collection.schemaStatus !== 'verified'
        || collection.read !== true
        || typeof collection.write !== 'boolean'
        || typeof collection.freshness !== 'string'
        || !collection.freshness.trim(),
      );
    if (invalidResolvedCollection) {
      findings.push({
        filePath: recordPath,
        line: 1,
        rule: 'DF-02',
        message: 'Custom record tables must list every resolved CMS collection with verified mechanism, collection ID, schema, read/write capability, and freshness. If no supported collection interface exists, mark the data foundation blocked.',
      });
    }

    const workflowErrors = validateWorkflowContract(record.workflow);
    if (workflowErrors.length) {
      findings.push({
        filePath: recordPath,
        line: 1,
        rule: 'WF-01',
        message: `Custom record dashboard does not complete the five-WHAT journey: ${workflowErrors.join('; ')}.`,
      });
    }
  }

  const isAutoPatterns = ['auto-patterns', 'auto-patterns-change'].includes(record.route);
  if (isAutoPatterns) {
    findings.push({
      filePath: recordPath,
      line: 1,
      rule: 'RT-07',
      message: `Standard Auto Patterns pages use patterns.json and full audit; remove ${routeRecordName} and do not run route-only preflight.`,
    });
  }
  if (isAutoPatterns && !routeOnly) {
    if (!patternsPaths.length || !/@wix\/auto-patterns/.test(dashboardPageSource)) {
      findings.push({
        filePath: recordPath,
        line: 1,
        rule: 'RT-03',
        message: 'Auto Patterns route must produce patterns.json and source that uses @wix/auto-patterns.',
      });
    }
  }

  const isCustomCollectionSurface = ['custom-table', 'custom-table-panel'].includes(record.route);
  if (isCustomCollectionSurface && record.sourceCount === 1) {
    findings.push({
      filePath: recordPath,
      line: 1,
      rule: 'RT-04',
      message: 'A one-source custom table is no longer a supported fallback. Resolve the source to a CMS collection interface and use Auto Patterns, or mark the data foundation blocked.',
    });

    const fallbackText = [
      record.firstUnsupportedCapability,
      record.whyDataAdaptationCannotSolve,
    ].filter(Boolean).join(' ');
    if (/\b(?:filter(?:ing)?|predicate|or logic|date comparison|derived (?:field|state|status)|elapsed time|bulk(?: action| transition| multi-select| selection)?|multi-select|saved (?:view|subset)|row (?:action|detail)|contextual detail|side\s*panel|sidepanel|dashboard modal|entity page|table\/grid)\b/i.test(fallbackText)) {
      findings.push({
        filePath: recordPath,
        line: 1,
        rule: 'RT-05',
        message: 'Data shaping, collection actions, and supplemental detail surfaces do not justify replacing a one-collection Auto Patterns table. Stop custom implementation and return collection ownership to Auto Patterns.',
      });
    }
  }

  if (record.fallbackCategory === 'multi-source' && record.sourceCount < 2) {
    findings.push({
      filePath: recordPath,
      line: 1,
      rule: 'RT-02',
      message: 'multi-source requires at least two physical collections or systems.',
    });
  }

  const hostApiCheck = record.hostApiCheck;
  const requiresHostApiCheck = record.fallbackCategory === 'external-data' || hostApiCheck != null;
  if (requiresHostApiCheck) {
    const requiredHostFields = [
      'executionHost',
      'requiredCapability',
      'selectedApi',
      'hostEvidence',
      'requiredScopes',
      'permissionStatus',
      'capabilityStatus',
      'canonicalUrlSource',
    ];
    const missingHostFields = !hostApiCheck || requiredHostFields.filter((key) => {
      const value = hostApiCheck[key];
      if (key === 'requiredScopes') return !Array.isArray(value);
      return typeof value !== 'string' || !value.trim();
    });
    const permissionVerified = hostApiCheck?.permissionStatus === 'verified';
    const capabilityVerified = hostApiCheck?.capabilityStatus === 'verified';
    const permissionEvidence = hostApiCheck?.permissionEvidence;
    const permissionEvidenceIsObject =
      permissionEvidence != null
      && typeof permissionEvidence === 'object'
      && !Array.isArray(permissionEvidence);
    const permissionEvidenceFields = [
      'requestStatus',
      'installationStatus',
      'verificationMethod',
      'verificationResult',
      'details',
    ];
    const missingPermissionEvidenceFields = permissionEvidenceIsObject
      ? permissionEvidenceFields.filter(
        (key) => typeof permissionEvidence[key] !== 'string' || !permissionEvidence[key].trim(),
      )
      : permissionEvidenceFields;
    const scopesRequired =
      Array.isArray(hostApiCheck?.requiredScopes)
      && hostApiCheck.requiredScopes.length > 0;
    const permissionDetails = String(permissionEvidence?.details ?? '');
    const runtimeRequestVerified =
      permissionEvidence?.verificationMethod === 'runtime-request'
      && /\b2\d\d\b/.test(permissionDetails)
      && /\brequest(?:\s+id)?\b/i.test(permissionDetails);
    const configurationAndInstallationVerified =
      permissionEvidence?.verificationMethod === 'app-configuration-and-installation'
      && /\b(?:app\s+)?configuration\b[\s\S]{0,160}\b(?:granted|contains|enabled|approved)\b/i.test(
        permissionDetails,
      )
      && /\b(?:update|reinstall|re-install)\b[\s\S]{0,120}\b(?:completed|succeeded|successful)\b/i.test(
        permissionDetails,
      );
    const claimsPermissionReceiptAsGrant =
      /\brequired-permissions\b|\bpermission(?:s)?\s+tool\b|\b(?:recorded|declared)\b/i.test(
        permissionDetails,
      );
    const scopedGrantVerified =
      permissionEvidenceIsObject
      && permissionEvidence.requestStatus === 'applied'
      && permissionEvidence.installationStatus === 'current'
      && permissionEvidence.verificationResult === 'succeeded'
      && typeof permissionEvidence.details === 'string'
      && permissionEvidence.details.trim()
      && (runtimeRequestVerified || configurationAndInstallationVerified)
      && !claimsPermissionReceiptAsGrant;
    const noScopeVerified =
      permissionEvidenceIsObject
      && permissionEvidence.requestStatus === 'not-required'
      && permissionEvidence.installationStatus === 'not-required'
      && permissionEvidence.verificationMethod === 'not-required'
      && permissionEvidence.verificationResult === 'not-required'
      && typeof permissionEvidence.details === 'string'
      && permissionEvidence.details.trim();
    const hasVerifiedPermissionEvidence = scopesRequired
      ? scopedGrantVerified
      : noScopeVerified;

    if (
      !hostApiCheck
      || missingHostFields.length
      || missingPermissionEvidenceFields.length
      || !permissionVerified
      || !capabilityVerified
    ) {
      findings.push({
        filePath: recordPath,
        line: 1,
        rule: 'HC-04',
        message: !hostApiCheck
          ? 'External-data dashboard is missing hostApiCheck. Record host support, exact scopes, granted-permission evidence, and capability status before implementation.'
          : `Host/API contract is not verified. Missing fields: ${[
            ...missingHostFields,
            ...missingPermissionEvidenceFields.map((key) => `permissionEvidence.${key}`),
          ].join(', ') || 'none'}; permissionStatus and capabilityStatus must both be "verified" before implementation.`,
      });
    }

    if (permissionVerified && !hasVerifiedPermissionEvidence) {
      findings.push({
        filePath: recordPath,
        line: 1,
        rule: 'HC-06',
        message: 'permissionStatus is "verified" without structured evidence that every scope was applied, the active installation is current, and verification succeeded through a 2xx request with request ID or inspected granted configuration plus a completed update/reinstall. A required-permissions receipt, recorded/declared request, documentation, installed packages, and auth.elevate() are not grant evidence.',
      });
    }

    const hostText = JSON.stringify(hostApiCheck);
    if (
      /listPublishedSiteUrls/i.test(hostText)
      && !hostApiCheck?.requiredScopes?.includes('SCOPE.DC-SITES.READ-URLS')
    ) {
      findings.push({
        filePath: recordPath,
        line: 1,
        rule: 'HC-04',
        message: 'listPublishedSiteUrls requires SCOPE.DC-SITES.READ-URLS in hostApiCheck.requiredScopes and verified grant evidence. auth.elevate() does not supply it.',
      });
    }

    if (
      /site[- ]?page|page inventory|list (?:all )?pages/i.test(String(hostApiCheck?.requiredCapability ?? ''))
      && /sitemap(?:\.xml)?|slug inference|scrap/i.test(String(hostApiCheck?.selectedApi ?? ''))
    ) {
      findings.push({
        filePath: recordPath,
        line: 1,
        rule: 'HC-05',
        message: 'Regular Wix site-page inventory is routed through an unverified sitemap/scraping fallback. Use a documented page-list API or mark the capability blocked; do not declare the dashboard ready.',
      });
    }

    if (
      /site[- ]?page|page inventory|list (?:all )?pages/i.test(String(hostApiCheck?.requiredCapability ?? ''))
      && /@wix\/site-site[\s\S]*getSiteStructure|getSiteStructure[\s\S]*@wix\/site-site/i.test(hostText)
    ) {
      findings.push({
        filePath: recordPath,
        line: 1,
        rule: 'HC-05',
        message: 'Regular Wix site-page inventory is routed through @wix/site-site getSiteStructure. Do not treat a Dashboard or backend route as support for a Site-only method; mark the capability blocked unless exact host support is verified.',
      });
    }
  }

  if (record.route === 'analytics' && record.sourceCount === 1) {
    const collectionOwner = record.regionOwners?.collection;
    const requiredTableEvidence = [
      'tableUnsupportedCapability',
      'tableCheckedReference',
      'whyAutoPatternsTableCannotBeUsed',
    ];
    const missingTableEvidence = requiredTableEvidence.filter(
      (key) => typeof record[key] !== 'string' || !record[key].trim(),
    );
    const regionalOnlyTableEvidence = /\b(?:analytics?|chart|graph|kpi|metric|summary|time[- ]series|visuali[sz]ation)\b/i.test(
      String(record.tableUnsupportedCapability ?? ''),
    );

    if (
      routeOnly
      && collectionOwner === 'custom-wds-table'
      && (missingTableEvidence.length || regionalOnlyTableEvidence)
    ) {
      findings.push({
        filePath: recordPath,
        line: 1,
        rule: 'RT-06',
        message: regionalOnlyTableEvidence
          ? 'Chart, KPI, metric, summary, and other analytics-region limitations cannot justify replacing a supported one-collection Auto Patterns table.'
          : `A one-source analytics route cannot assign collection ownership to a custom WDS table without table-specific evidence: ${requiredTableEvidence.join(', ')}.`,
      });
    }

    if (!routeOnly) {
      const usesAutoPatternsCollection =
        patternsPaths.length > 0 && /@wix\/auto-patterns/.test(projectSource);
      const usesCustomWdsTable = /<Table\b/.test(projectSource) && !usesAutoPatternsCollection;

      if (collectionOwner === 'auto-patterns' && !usesAutoPatternsCollection) {
        findings.push({
          filePath: recordPath,
          line: 1,
          rule: 'RT-06',
          message: 'regionOwners assigns the collection region to Auto Patterns, but patterns.json or @wix/auto-patterns source is missing.',
        });
      }

      if (usesCustomWdsTable) {
        findings.push({
          filePath: recordPath,
          line: 1,
          rule: 'RT-06',
          message: 'A one-source analytics page may not replace its collection region with a custom WDS table. Resolve one collection and use Auto Patterns; keep custom analytics in supplemental regions.',
        });
      }
    }
  }

  if (record.route === 'analytics' && record.regionOwners?.metrics) {
    const requiredMetricEvidence = [
      'metricSurface',
      'metricCheckedExample',
      'metricContainmentOwner',
      'metricLayoutOwner',
    ];
    const missingMetricEvidence = requiredMetricEvidence.filter(
      (key) => typeof record[key] !== 'string' || !record[key].trim(),
    );
    const allowedMetricSurfaces = new Set(['AnalyticsSummary', 'StatisticsWidget']);

    if (missingMetricEvidence.length || !allowedMetricSurfaces.has(record.metricSurface)) {
      findings.push({
        filePath: recordPath,
        line: 1,
        rule: 'RT-08',
        message: missingMetricEvidence.length
          ? `An analytics metric region must record its installed composition before implementation: ${requiredMetricEvidence.join(', ')}.`
          : `metricSurface must name the installed WDS composition used by the page: ${[...allowedMetricSurfaces].join(' or ')}.`,
      });
    }
  }
}

if (routeOnly) {
  if (findings.length) {
    console.error('Dashboard route preflight failed:');
    for (const finding of findings) {
      console.error(`- ${finding.rule} ${finding.filePath}:${finding.line} ${finding.message}`);
    }
    process.exit(1);
  }
  console.log(`Dashboard route preflight passed: ${routeRecordPaths.length} route record checked.`);
  process.exit(0);
}

const customRecordRoute = routeRecords.find(({ record }) => {
  const owner = record.regionOwners?.collection
    ?? (['custom-table', 'custom-table-panel'].includes(record.route) ? 'custom-wds-table' : null);
  return owner === 'custom-wds-table';
});
if (customRecordRoute && /<Table\b/.test(projectSource)) {
  const surface = customRecordRoute.record.workflow?.implementation?.investigationSurface
    ?? customRecordRoute.record.detailSurface;
  const validSurface = ['side-panel', 'modal', 'entity-page'].includes(surface);
  const surfaceExists =
    (surface === 'side-panel' && projectHasSidePanel)
    || (surface === 'modal' && /\bopenModal\s*\(/.test(projectSource))
    || (surface === 'entity-page' && (hasEntityPagePattern || /\b(?:navigate|window\.open)\s*\(/.test(projectSource)));
  if (!validSurface || !surfaceExists) {
    findings.push({
      filePath: customRecordRoute.path,
      line: 1,
      rule: 'WF-01',
      message: 'Every populated custom record table must declare and implement a SidePanel, Modal, entity page, or verified owning-record navigation for investigation.',
    });
  }
}

if (
  /catch\s*(?:\([^)]*\))?\s*\{[\s\S]{0,1000}?(?:STORES_NOT_INSTALLED|APP_NOT_INSTALLED)[\s\S]{0,300}?\}/i.test(projectSource)
) {
  findings.push({
    filePath: files[0],
    line: 1,
    rule: 'DF-03',
    message: 'A catch-all maps every runtime failure to an app-not-installed state. Preserve and classify permission, schema, transport, and installation failures separately.',
  });
}

if (
  /load sample data|use sample data|seed sample/i.test(projectSource)
  && /\b(?:bulkInsert|insert|save)\s*\(/.test(projectSource)
) {
  findings.push({
    filePath: files[0],
    line: 1,
    rule: 'DF-04',
    message: 'Live dashboard code offers to insert sample records into an operational collection. Keep fixtures in an explicit development-only path and preserve honest unavailable-data states.',
  });
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function findResolver(id) {
  const declarationPattern = new RegExp(
    `(?:const|let|var|function)\\s+${escapeRegExp(id)}\\b`,
  );
  for (const [filePath, content] of contents) {
    const match = declarationPattern.exec(content);
    if (match) return { filePath, content, index: match.index };
  }
  return null;
}

function checkSavedViewRefresh(resolver, resolverSlice, resolverId, kindLabel) {
  if (!savedViewFieldIds.size) return;
  if (!/\b(?:updateOne|updateMany|updateAll|updateDataItem|update)\s*\(/.test(resolverSlice)) {
    return;
  }

  const mutatedField = [...savedViewFieldIds].find((fieldId) =>
    new RegExp(`\\b${escapeRegExp(fieldId)}\\s*:`).test(resolverSlice)
  );
  if (!mutatedField) return;

  const fieldMatch = new RegExp(`\\b${escapeRegExp(mutatedField)}\\s*:`).exec(resolverSlice);
  const findingIndex = resolver.index + (fieldMatch?.index ?? 0);
  const usesOptimisticActions = /\b(?:getOptimisticActions|optimisticActions\s*\.\s*(?:updateOne|updateMany|updateAll))\b/.test(
    resolverSlice,
  );
  const hasRefresh = /\b(?:sdk\s*\.\s*)?refreshCollection\s*\(/.test(resolverSlice);
  const hasDeferredRefresh = /\bsetTimeout\s*\(\s*\(\s*\)\s*=>\s*(?:\{[\s\S]{0,160})?(?:sdk\s*\.\s*)?refreshCollection\s*\(/.test(
    resolverSlice,
  );
  const hasOptimisticPredicateOverride = /\boptimisticActions\b[\s\S]{0,2400}\bpredicate\s*:/.test(
    projectSource,
  );
  const mismatchedFilterIds = [...(savedViewFilterIdsByField.get(mutatedField) ?? [])]
    .filter((filterId) => filterId !== mutatedField);

  if (!hasRefresh) {
    addFinding(
      resolver.filePath,
      resolver.content,
      findingIndex,
      'AP-17',
      `Custom ${kindLabel} "${resolverId}" mutates Saved View field "${mutatedField}" without refreshing canonical collection data after persistence. Refresh the collection so View membership, counts, metrics, and selection are reconciled.`,
    );
  } else if (usesOptimisticActions && !hasDeferredRefresh) {
    addFinding(
      resolver.filePath,
      resolver.content,
      findingIndex,
      'AP-17',
      `Custom ${kindLabel} "${resolverId}" refreshes Saved View field "${mutatedField}" synchronously inside an optimistic action. Defer refreshCollection() to the next task after the write succeeds so the optimistic patch settles before canonical View reconciliation.`,
    );
  }

  if (usesOptimisticActions && mismatchedFilterIds.length && !hasOptimisticPredicateOverride) {
    addFinding(
      resolver.filePath,
      resolver.content,
      findingIndex,
      'AP-17',
      `Custom ${kindLabel} "${resolverId}" optimistically mutates "${mutatedField}", but Saved View filter ${mismatchedFilterIds.map((id) => `"${id}"`).join(', ')} does not match that record field and no optimistic predicate override is present. Align filter.id with fieldId or map the filter explicitly so the item leaves the active View immediately.`,
    );
  }
}

function checkMutationLifecycle(resolver, resolverSlice, resolverId, kindLabel) {
  const directlyMutatesCollection = /\bitems\s*\.\s*(?:update|save|bulkUpdate)\s*\(/.test(
    resolverSlice,
  );
  if (!directlyMutatesCollection) return;

  const usesOptimisticActions = /\b(?:getOptimisticActions|optimisticActions\s*\.\s*(?:updateOne|updateMany|updateAll))\b/.test(
    resolverSlice,
  );
  if (!usesOptimisticActions) {
    addFinding(
      resolver.filePath,
      resolver.content,
      resolver.index,
      'AP-20',
      `Custom ${kindLabel} "${resolverId}" writes collection data outside the documented optimistic-action lifecycle. Use one optimistic transition that owns pending state, success, failure, and canonical refresh on this surface.`,
    );
    return;
  }

  if (/\bsubmit\s*:\s*async\s*\(\s*\)\s*=>/.test(resolverSlice)) {
    addFinding(
      resolver.filePath,
      resolver.content,
      resolver.index,
      'AP-20',
      `Custom ${kindLabel} "${resolverId}" ignores the optimistic record submitted by updateOne. Persist and return the submitted full record instead of rebuilding a partial replacement from a closure.`,
    );
  }
  if (!/\bsuccessToast\s*:/.test(resolverSlice) || !/\berrorToast\s*:/.test(resolverSlice)) {
    addFinding(
      resolver.filePath,
      resolver.content,
      resolver.index,
      'AP-20',
      `Custom ${kindLabel} "${resolverId}" does not expose both confirmed success and retryable failure feedback through the optimistic action.`,
    );
  }
}

for (const [resolverId, kinds] of entityRuntimeResolvers) {
  const resolver = findResolver(resolverId);
  const kindLabel = [...kinds].join('/');
  if (!resolver) {
    findings.push({
      filePath: patternDocuments[0]?.path ?? routeRecordPaths[0] ?? files[0],
      line: 1,
      rule: 'AP-09',
      message: `Entity ${kindLabel} "${resolverId}" has no matching resolver implementation.`,
    });
    continue;
  }

  const resolverSlice = resolver.content.slice(resolver.index, resolver.index + 3600);
  checkSavedViewRefresh(resolver, resolverSlice, resolverId, kindLabel);
  checkMutationLifecycle(resolver, resolverSlice, resolverId, kindLabel);
  const isEntityAction = [...kinds].some((kind) => kind.includes('action'));
  if (isEntityAction && !resolverUsesHostActionParams(resolverSlice)) {
    findings.push({
      filePath: resolver.filePath,
      line: lineAt(resolver.content, resolver.index),
      rule: 'AP-09',
      message: `Entity ${kindLabel} "${resolverId}" does not use the entity resolver { actionParams, sdk } contract. Read the record from actionParams.entity; do not treat the wrapper as the entity.`,
    });
  }
  if (kinds.has('badge override')) {
    const invalidBadgeSkin = /\bskin\s*:\s*['"]destructive['"]/.exec(resolverSlice);
    if (invalidBadgeSkin) {
      addFinding(
        resolver.filePath,
        resolver.content,
        resolver.index + invalidBadgeSkin.index,
        'AP-11',
        `Entity badge override "${resolverId}" uses action skin "destructive". Import the installed WDS BadgeSkin type and use its danger value instead.`,
      );
    }
  }

  const directEntityAccess = /\bentity\s*(?:\.|\[)/.exec(resolverSlice);
  if (!directEntityAccess) continue;

  const beforeAccess = resolverSlice.slice(0, directEntityAccess.index);
  const guardsMissingEntity =
    /\bif\s*\(\s*!entity\b/.test(beforeAccess)
    || /\bif\s*\(\s*entity\s*(?:==|===)\s*(?:null|undefined)\b/.test(beforeAccess)
    || /\bif\s*\(\s*entity\s*\)/.test(beforeAccess)
    || /\bentity\s*=\s*\{\s*\}/.test(beforeAccess)
    || /\b\w+\s*=\s*entity\s*\?\?\s*\{\s*\}/.test(beforeAccess);

  if (!guardsMissingEntity) {
    addFinding(
      resolver.filePath,
      resolver.content,
      resolver.index + directEntityAccess.index,
      'AP-09',
      `Entity ${kindLabel} "${resolverId}" dereferences entity before a loading guard. Entity callbacks must tolerate an absent or partial entity and return a stable fallback instead of crashing the page.`,
    );
  }
}

function resolverHasNoOpHandler(content) {
  return (
    /onClick\s*:\s*\(\s*\)\s*=>\s*\{\s*(?:(?:void\s+[^;]+|return\s+undefined)\s*;?\s*)*\}/.test(
      content,
    )
    || /onClick\s*:\s*\(\s*\)\s*=>\s*(?:undefined|null)\b/.test(content)
  );
}

function resolverUsesHostActionParams(content) {
  const declaration = content.slice(0, 900);
  return /\bactionParams\b/.test(declaration)
    && !/\bparams\s*\.\s*dataItem\b/.test(declaration);
}

for (const [actionId, kinds] of collectionRuntimeResolvers) {
  const resolver = findResolver(actionId);
  const kindLabel = [...kinds].join('/');
  if (!resolver) {
    findings.push({
      filePath: patternDocuments[0]?.path ?? routeRecordPaths[0],
      line: 1,
      rule: 'AP-07',
      message: `Custom ${kindLabel} "${actionId}" has no matching resolver implementation. The patterns.json id must exactly match its resolver export key.`,
    });
    continue;
  }

  const resolverSlice = resolver.content.slice(resolver.index, resolver.index + 3600);
  checkSavedViewRefresh(resolver, resolverSlice, actionId, kindLabel);
  checkMutationLifecycle(resolver, resolverSlice, actionId, kindLabel);
  if (!resolverUsesHostActionParams(resolverSlice)) {
    findings.push({
      filePath: resolver.filePath,
      line: lineAt(resolver.content, resolver.index),
      rule: 'AP-07',
      message: `Custom ${kindLabel} "${actionId}" does not use the collection resolver { actionParams, sdk } contract. Read item from actionParams.item or selected IDs from actionParams.selectedValues; do not treat the wrapper as the record.`,
    });
  }
  if (resolverHasNoOpHandler(resolverSlice)) {
    findings.push({
      filePath: resolver.filePath,
      line: lineAt(resolver.content, resolver.index),
      rule: 'AP-07',
      message: `Custom ${kindLabel} "${actionId}" resolves to a no-op; it must open the declared detail surface or perform its stated action.`,
    });
  }
}


for (const [filePath, content] of contents) {
  for (const match of content.matchAll(/\bitems\s*\.\s*update\s*\(\s*[^,\n]*\._id\s*,/g)) {
    addFinding(
      filePath,
      content,
      match.index,
      'AP-07',
      'items.update receives collectionId first and one item object containing _id second. Do not pass the record ID as the first argument.',
    );
  }

  for (const match of content.matchAll(
    /\bitems\s*\.\s*update\s*\(\s*[^,\n]+,\s*(\{[\s\S]{0,1400}?\})\s*(?:,|\))/g,
  )) {
    const replacement = match[1];
    const hasIdentity = /\b_id\b/.test(replacement);
    const spreadsCanonicalRecord = /\.\.\.\s*(?:actionParams\s*\.\s*(?:item|entity)|item|entity|record|current|existing|canonical|submitted(?:Item)?|items\s*\[\s*0\s*\])/i.test(
      replacement,
    );
    if (!hasIdentity || spreadsCanonicalRecord) continue;
    addFinding(
      filePath,
      content,
      match.index,
      'AP-20',
      'items.update replaces the complete CMS item, but this call constructs a partial object literal. Read or retain the canonical record, merge the transition fields into it, and persist the full replacement so unrelated fields are not erased.',
    );
  }
}

for (const { path: recordPath, record } of routeRecords) {
  const detailIntent = /\b(?:detail|view|inspect|edit|resolve)\b/i.test(String(record.secondary ?? ''));
  const implementation = record.workflow?.implementation;
  const declaredSurface = implementation?.investigationSurface ?? record.detailSurface;
  if (!detailIntent && declaredSurface == null) continue;

  const allowedSurfaces = new Set(['side-panel', 'modal', 'entity-page']);
  const surface = declaredSurface;
  const reason = implementation?.surfaceReason ?? record.detailSurfaceReason;
  if (!allowedSurfaces.has(surface) || typeof reason !== 'string' || !reason.trim()) {
    findings.push({
      filePath: recordPath,
      line: 1,
      rule: 'AP-08',
      message: 'Record detail requires workflow.implementation investigationSurface and a non-empty surfaceReason.',
    });
    continue;
  }

  const surfaceExists =
    (surface === 'side-panel' && /<SidePanel\b/.test(projectSource))
    || (surface === 'modal' && /(?:<Modal\b|\bopenModal\s*\()/.test(projectSource))
    || (surface === 'entity-page' && hasEntityPagePattern);
  if (!surfaceExists) {
    findings.push({
      filePath: recordPath,
      line: 1,
      rule: 'AP-08',
      message: `Workflow declares investigation surface "${surface}", but the generated project does not contain that surface.`,
    });
  }
}

const stringConstants = new Map();
for (const content of contents.values()) {
  for (const match of content.matchAll(
    /\bconst\s+([A-Za-z_$][\w$]*)\s*=\s*['"]([^'"]+)['"]/g,
  )) {
    stringConstants.set(match[1], match[2]);
  }
}

const registeredModalIds = new Set();
for (const content of contents.values()) {
  for (const match of content.matchAll(
    /\bdashboardModal\s*\(\s*\{[\s\S]{0,800}?\bid\s*:\s*['"]([^'"]+)['"]/g,
  )) {
    registeredModalIds.add(match[1]);
  }
}

for (const [filePath, content] of contents) {
  for (const match of content.matchAll(
    /\bopenModal\s*\(\s*\{[\s\S]{0,700}?\bmodalId\s*:\s*(?:['"]([^'"]+)['"]|([A-Za-z_$][\w$]*))/g,
  )) {
    const modalId = match[1] ?? stringConstants.get(match[2]);
    if (!modalId || !registeredModalIds.size || registeredModalIds.has(modalId)) continue;
    addFinding(
      filePath,
      content,
      match.index,
      'MD-02',
      `openModal targets "${modalId}", but no generated Dashboard Modal registration with that id was found.`,
    );
  }
}

for (const filePath of dashboardModalFiles) {
  const content = contents.get(filePath);
  if (!/<CustomModalLayout\b/.test(content)) continue;

  if (!/\bdashboard\.closeModal\s*\(/.test(content)) {
    addFinding(
      filePath,
      content,
      content.indexOf('<CustomModalLayout'),
      'MD-03',
      'Dashboard Modal has no dashboard.closeModal action, so its documented cancel/close path is incomplete.',
    );
  }

  for (const match of content.matchAll(
    /\bobserveState\s*\(\s*\(\s*([A-Za-z_$][\w$]*)[^)]*\)\s*=>\s*\{([\s\S]{0,1800}?)\}\s*\)/g,
  )) {
    const [, stateName, body] = match;
    const directAccess = new RegExp(`\\b${escapeRegExp(stateName)}\\s*\\.`).exec(body);
    if (!directAccess) continue;
    const beforeAccess = body.slice(0, directAccess.index);
    const earlyReturnGuard = new RegExp(
      `\\bif\\s*\\(\\s*!\\s*${escapeRegExp(stateName)}(?:\\?\\.[A-Za-z_$][\\w$]*)?\\s*\\)\\s*\\{?\\s*return\\b`,
    ).test(beforeAccess);
    const guardsState =
      earlyReturnGuard
      || new RegExp(`\\b${escapeRegExp(stateName)}\\s*&&`).test(beforeAccess)
      || new RegExp(`\\b${escapeRegExp(stateName)}\\s*=\\s*${escapeRegExp(stateName)}\\s*\\?\\?\\s*\\{`).test(beforeAccess);
    if (guardsState) continue;

    addFinding(
      filePath,
      content,
      match.index + directAccess.index,
      'MD-01',
      'Dashboard Modal dereferences observeState params before guarding the initial missing or partial state. Render a stable loading surface and guard again before using record identity.',
    );
  }
}

function componentNames(filePath, content) {
  const names = new Set();
  const baseName = path.basename(filePath, path.extname(filePath));
  if (/^[A-Z][A-Za-z0-9]*$/.test(baseName)) names.add(baseName);

  for (const match of content.matchAll(
    /(?:export\s+default\s+)?(?:function|class|const)\s+([A-Z][A-Za-z0-9]*)\b/g,
  )) {
    names.add(match[1]);
  }
  for (const match of content.matchAll(/export\s+default\s+([A-Z][A-Za-z0-9]*)\s*;?/g)) {
    names.add(match[1]);
  }
  return names;
}

const declaredComponents = new Map(
  [...contents].map(([filePath, content]) => [filePath, componentNames(filePath, content)]),
);
const sidePanelComponents = new Set(['SidePanel']);
const sidePanelHostName = 'DashboardSidePanelHost';

// Follow local component wrappers so a page mounting <SessionDetail /> is audited
// even when the actual <SidePanel> lives in a different file.
let discoveredWrapper = true;
while (discoveredWrapper) {
  discoveredWrapper = false;
  for (const [filePath, content] of contents) {
    const mountsKnownPanel = [...sidePanelComponents].some((name) =>
      new RegExp(`<${name}\\b`).test(content),
    );
    if (!mountsKnownPanel) continue;
    for (const name of declaredComponents.get(filePath)) {
      if (!sidePanelComponents.has(name)) {
        sidePanelComponents.add(name);
        discoveredWrapper = true;
      }
    }
  }
}

function mountsSidePanel(content) {
  return [...sidePanelComponents].some((name) => new RegExp(`<${name}\\b`).test(content));
}

function selectionCallbackUsesSelectedRows(content) {
  const callbackNames = [
    ...content.matchAll(/\bonSelectionChanged\s*=\s*\{\s*([A-Za-z_$][\w$]*)\s*\}/g),
  ].map((match) => match[1]);

  return callbackNames.some((name) => {
    const declaration = new RegExp(
      `(?:function\\s+${name}\\s*\\([^)]*\\)|(?:const|let|var)\\s+${name}\\s*=\\s*(?:\\([^)]*\\)|[A-Za-z_$][\\w$]*)\\s*=>)[\\s\\S]{0,1200}?selectedRows`,
    );
    return declaration.test(content);
  }) || /\bonSelectionChanged\s*=\s*\{\s*(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>[\s\S]{0,1200}?selectedRows/.test(content);
}

const projectRequiresScopedHostApi = routeRecords.some(
  ({ record }) =>
    Array.isArray(record.hostApiCheck?.requiredScopes)
    && record.hostApiCheck.requiredScopes.length > 0,
);

for (const filePath of files) {
  const content = contents.get(filePath);
  const hasSidePanel = /<SidePanel\b/.test(content);

  if (
    /from\s+['"]@wix\/site-site['"]/.test(content)
    && /\bgetSiteStructure\s*\(/.test(content)
  ) {
    report(
      filePath,
      content,
      'HC-01',
      /\bgetSiteStructure\s*\(/,
      'Dashboard or backend code calls @wix/site-site getSiteStructure without verified host support. A backend route does not make a Site-only method supported; apply the Host And API Compatibility gate and use only an API whose exact method documentation supports the selected execution host.',
    );
  }

  const isBackendApiRoute =
    /\bAPIRoute\b/.test(content)
    && /\bexport\s+const\s+(?:GET|POST|PUT|PATCH|DELETE)\b/.test(content);
  const isBackendWebModule =
    /(?:^|[/\\])src[/\\]modules[/\\]/.test(filePath)
    && /\bexport\s+(?:async\s+function|const\s+\w+\s*=\s*async\b)/.test(content);
  const isDashboardConsumer =
    /(?:^|[/\\])extensions[/\\]dashboard[/\\]/.test(filePath)
    && /(?:^|[/\\])modules[/\\]/.test(content);
  const callsWixSdk = /from\s+['"]@wix\//.test(content);
  const catchesAsGenericServerFailure =
    /catch\s*\([^)]*\)\s*\{[\s\S]{0,2400}?(?:\bFETCH_ERROR\b|status\s*:\s*500)/.test(content);
  const mapsPermissionFailure =
    /\bMISSING_PERMISSION\b/.test(content)
    && /\b(?:401|403)\b/.test(content)
    && /\brequiredScopes\b/.test(content);
  if (
    (isBackendApiRoute || isBackendWebModule)
    && callsWixSdk
    && projectRequiresScopedHostApi
    && !mapsPermissionFailure
  ) {
    addFinding(
      filePath,
      content,
      content.search(/catch\s*\(/),
      'HC-07',
      catchesAsGenericServerFailure
        ? 'Backend boundary collapses a Wix SDK failure into a generic error without mapping 401/403 to MISSING_PERMISSION and listing requiredScopes. Preserve the original error in logs and reserve retryable failures for transient states.'
        : 'Backend boundary calls a scoped Wix SDK without mapping 401/403 to MISSING_PERMISSION and listing requiredScopes. Preserve the original error in logs and return or throw the stable permission state.',
    );
  }

  if (
    isDashboardConsumer
    && projectRequiresScopedHostApi
    && /catch\s*(?:\([^)]*\))?\s*\{/.test(content)
    && /\bRetry\b/.test(content)
    && !/\bMISSING_PERMISSION\b/.test(content)
  ) {
    addFinding(
      filePath,
      content,
      content.search(/catch\s*(?:\([^)]*\))?\s*\{/),
      'HC-09',
      'Dashboard consumer reduces scoped API failures to one retryable error state. Handle MISSING_PERMISSION separately with the required setup action; Retry is only for transient failures.',
    );
  }

  if (
    /from\s+['"]@wix\/analytics-semantic-model['"]/.test(content)
    && /\bquerySemanticModelData\s*\(/.test(content)
    && (
      !/\blistSemanticModels\s*\(/.test(content)
      || !/\bgetSemanticModel\s*\(/.test(content)
    )
  ) {
    addFinding(
      filePath,
      content,
      content.search(/\bquerySemanticModelData\s*\(/),
      'HC-08',
      'Analytics Semantic Model query skips runtime model/schema discovery. Call listSemanticModels, select the intended model, call getSemanticModel, and query only IDs and field names returned for the current site; do not hard-code model UUIDs or traffic.* fields.',
    );
  }

  report(
    filePath,
    content,
    'HC-02',
    /window\.location\.origin[\s\S]{0,240}?replace\s*\([\s\S]{0,160}?wixsite/i,
    'Published site URL is fabricated from the Dashboard origin. Resolve the canonical published URL from an official metadata API verified for the selected execution host.',
  );

  for (const match of content.matchAll(
    /catch\s*\(\s*([A-Za-z_$][\w$]*)\s*\)\s*\{([\s\S]{0,1200}?)\}/g,
  )) {
    const errorName = match[1];
    const block = match[2];
    const genericLoadError = /\bsetError\s*\(\s*['"`](?:Failed|Unable|Could not|Couldn['’]t|We could not|We couldn['’]t)/i.test(block);
    const preservesOriginal =
      new RegExp(`console\\s*\\.\\s*error\\s*\\([^)]*\\b${escapeRegExp(errorName)}\\b`).test(block)
      || new RegExp(`\\bthrow\\s+${escapeRegExp(errorName)}\\b`).test(block);

    if (genericLoadError && !preservesOriginal) {
      addFinding(
        filePath,
        content,
        match.index,
        'HC-03',
        'Dashboard load failure is replaced with a generic message without preserving the original exception. Log or rethrow the original error before rendering the user-facing state.',
      );
    }
  }

  if (hasSidePanel) {
    report(filePath, content, 'TP-09', /(?:100vh|100dvh)/, 'SidePanel code uses browser viewport height inside a Dashboard Page.');
    report(filePath, content, 'TP-09', /<SidePanel\b[^>]*(?:width|height)=\{?['"]?\d+/, 'SidePanel has hard-coded geometry instead of documented defaults/host sizing.');
    report(filePath, content, 'TP-09', /position:\s*['"]relative['"][\s\S]{0,180}overflow:\s*['"]hidden['"][\s\S]{0,500}<SidePanel/, 'SidePanel is mounted under a relative overflow-hidden page wrapper.');

    for (const match of content.matchAll(/<SidePanel\.Header\b([^>]*)>([\s\S]*?)<\/SidePanel\.Header>/g)) {
      if (!/\btitle=/.test(match[1]) && /<(?:Box|div|Text)\b/.test(match[2])) {
        addFinding(
          filePath,
          content,
          match.index,
          'TP-10',
          'Standard record Header omits the documented title API and rebuilds identity with custom children.',
        );
      }
      if (/\btitle=/.test(match[1]) && /<Badge\b/.test(match[2])) {
        addFinding(
          filePath,
          content,
          match.index,
          'TP-10',
          'Standard record Header mixes the title API with a custom status badge; put status first in SidePanel.Content or follow the exact custom-header example.',
        );
      }
    }

    const contentRegions = (content.match(/<SidePanel\.Content\b/g) || []).length;
    if (contentRegions > 1 && /<SidePanel\.Divider\b/.test(content)) {
      addFinding(
        filePath,
        content,
        content.indexOf('<SidePanel.Divider'),
        'TP-11',
        'Routine record details are split into multiple SidePanel.Content regions with thick SidePanel.Divider bands; use one Content region and standard thin WDS Divider only where needed.',
      );
    }

    if (!/<SidePanel\.Footer\b/.test(content)) {
      findings.push({
        filePath,
        line: lineAt(content, content.indexOf('<SidePanel')),
        rule: 'TP-11',
        message: 'Contextual SidePanel has no SidePanel.Footer; include a right-aligned Close button even when the detail is read-only.',
      });
    }

    for (const match of content.matchAll(
      /<SidePanel\.Footer\b[^>]*>([\s\S]*?)<\/SidePanel\.Footer>/g,
    )) {
      if (/<button\b/.test(match[1])) {
        addFinding(
          filePath,
          content,
          match.index,
          'TP-14',
          'SidePanel.Footer uses a native HTML button; use the documented WDS Button component for Close and other footer actions.',
        );
      }
    }
  }

  report(filePath, content, 'CT-02', /titleBarVisible=\{false\}/, 'Management table explicitly hides its labeled header row.');
  report(
    filePath,
    content,
    'CT-06',
    /<TableToolbar\.Label[^>]*>[\s\S]{0,180}\{[^}]+\}[^{<\n]+\{[^}]+\}[\s\S]{0,60}<\/TableToolbar\.Label>/,
    'Toolbar count is composed from separately spaced JSX fragments; precompute one string.',
  );

  if (/<Table\b/.test(content)) {
    const hasSelection = /\bshowSelection(?:=|\b)/.test(content);
    const selectedIdsFeedBulkAction = /\b(?:bulk|assign|resolve|delete|remove|export|send|archive|update)[A-Za-z0-9_$]*\s*\(\s*(?:selected[A-Za-z0-9_$]*|[A-Za-z_$][\w$]*Ids)\b/.test(content);
    if (hasSelection && !selectedIdsFeedBulkAction) {
      addFinding(
        filePath,
        content,
        content.search(/\bshowSelection/),
        'WF-03',
        'Table selection is enabled without a real bulk operation that consumes the selected stable IDs.',
      );
    }

    if (/<TableActionCell\b[\s\S]{0,800}?\bonClick\s*:\s*\(?(?:[^)=]*)\)?\s*=>\s*\{\s*\}/.test(content)) {
      addFinding(
        filePath,
        content,
        content.indexOf('<TableActionCell'),
        'WF-02',
        'TableActionCell exposes an empty callback. Implement the labeled operation or remove the action.',
      );
    }

    const hasToastAction = /\bshowToast\s*\(/.test(content) && /<TableActionCell\b/.test(content);
    const hasRealActionEffect = /\b(?:window\.open|openModal|navigate|setSelected[A-Za-z0-9_$]*|await\s+(?:[A-Za-z_$][\w$]*\.)*(?:bulk)?(?:update|insert|remove|delete|assign|resolve)[A-Za-z0-9_$]*\s*\()/.test(content);
    if (hasToastAction && !hasRealActionEffect) {
      addFinding(
        filePath,
        content,
        content.search(/\bshowToast\s*\(/),
        'WF-02',
        'Visible table action only displays a toast. Toasts may report a real outcome but cannot be the outcome.',
      );
    }

    if (
      hasToastAction
      && /\b[A-Za-z_$][\w$]*(?:Url|URL|Href|Route)\s*:\s*['"]\s*['"]/.test(content)
    ) {
      addFinding(
        filePath,
        content,
        content.search(/\b[A-Za-z_$][\w$]*(?:Url|URL|Href|Route)\s*:\s*['"]\s*['"]/),
        'WF-02',
        'Investigation or navigation target is explicitly blank and falls back to feedback. Resolve a stable record destination or remove the action.',
      );
    }

    const hasAwaitedMutation = /\bawait\s+(?:[A-Za-z_$][\w$]*\.)*(?:bulk)?(?:update|insert|remove|delete|assign|resolve)[A-Za-z0-9_$]*\s*\(/.test(content);
    const refreshesCanonicalState = /\b(?:refreshCollection|reload[A-Za-z0-9_$]*|refetch[A-Za-z0-9_$]*|load(?:Rows|Data|Items)|invalidate[A-Za-z0-9_$]*)\s*\(/.test(content);
    if (hasAwaitedMutation && !refreshesCanonicalState) {
      addFinding(
        filePath,
        content,
        content.search(/\bawait\s+/),
        'WF-04',
        'Table mutation is awaited but canonical collection, workset, detail, counts, or selection state is not refreshed afterward.',
      );
    }

    const successToastIndex = content.search(/\bshowToast\s*\(\s*\{[\s\S]{0,180}?type\s*:\s*['"]success['"]/);
    const awaitedMutationIndex = content.search(/\bawait\s+(?:[A-Za-z_$][\w$]*\.)*(?:bulk)?(?:update|insert|remove|delete|assign|resolve)/);
    if (successToastIndex >= 0 && awaitedMutationIndex >= 0 && successToastIndex < awaitedMutationIndex) {
      addFinding(
        filePath,
        content,
        successToastIndex,
        'WF-04',
        'Success feedback is emitted before the mutation completes. Await persistence, refresh canonical state, then show success.',
      );
    }

    if (
      /\bonRowClick\s*=\s*\{\s*(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>\s*\{\s*\}\s*\}/.test(
        content,
      )
    ) {
      addFinding(
        filePath,
        content,
        content.indexOf('onRowClick'),
        'CT-12',
        'Interactive table declares an empty onRowClick handler; open the selected surface or remove the interaction.',
      );
    }

    if (/\bshowSelection(?:=|\b)/.test(content) && /\bonSelectionChanged=/.test(content) && selectionCallbackUsesSelectedRows(content)) {
      addFinding(
        filePath,
        content,
        content.indexOf('onSelectionChanged'),
        'CT-08',
        'Controlled WDS Table selection receives an ID array in onSelectionChanged; do not read selectedRows from that callback.',
      );
    }

    if (/<Table\.EmptyState\b/.test(content) && !/<Table\.Content\b/.test(content)) {
      addFinding(
        filePath,
        content,
        content.indexOf('<Table.EmptyState'),
        'CT-11',
        'Table defines empty-state handling but has no Table.Content branch for populated rows.',
      );
    }

    if (/\bonRowClick=/.test(content) && !/<TableActionCell\b/.test(content)) {
      addFinding(
        filePath,
        content,
        content.indexOf('onRowClick='),
        'CT-10',
        'Interactive table rows rely on row click without a visible final-column TableActionCell.',
      );
    }

    const percentageWidths = [...content.matchAll(/\bwidth:\s*['"](\d+(?:\.\d+)?)%['"]/g)];
    const totalWidth = percentageWidths.reduce((sum, match) => sum + Number(match[1]), 0);
    if (percentageWidths.length > 1 && totalWidth > 100.5) {
      addFinding(
        filePath,
        content,
        percentageWidths[0].index,
        'CT-03',
        `Table percentage column widths total ${totalWidth}%; reserve a non-overlapping final action column within 100%.`,
      );
    }

    if (/<TableActionCell\b/.test(content) && /\bwidth:\s*['"]0(?:%|px)?['"]/.test(content)) {
      addFinding(
        filePath,
        content,
        content.indexOf('<TableActionCell'),
        'CT-05',
        'A labeled TableActionCell is assigned a zero-width column; reserve non-zero space for its visible action label.',
      );
    }

    if (projectHasSidePanel && /\bonRowClick=/.test(content) && !/\bisRowActive=/.test(content)) {
      addFinding(
        filePath,
        content,
        content.indexOf('onRowClick='),
        'TP-01',
        'A row opens contextual detail but Table has no isRowActive predicate for the selected record.',
      );
    }

    if (projectHasSidePanel && /\bisRowActive=/.test(content) && !/\bonRowClick=/.test(content)) {
      addFinding(
        filePath,
        content,
        content.indexOf('isRowActive='),
        'TP-01',
        'A selected row opens contextual detail but Table has no onRowClick handler matching its final action.',
      );
    }

    if (projectHasSidePanel && /<TableActionCell\b[\s\S]{0,420}visibility:\s*['"]always['"]/.test(content)) {
      addFinding(
        filePath,
        content,
        content.indexOf('<TableActionCell'),
        'TP-03',
        'A contextual row action is permanently visible; use documented hover/focus visibility unless the workflow explicitly requires an always-visible control.',
      );
    }

    if (/<EmptyState\b/.test(content) && !/<Button\b/.test(content)) {
      addFinding(
        filePath,
        content,
        content.indexOf('<EmptyState'),
        'CT-09',
        'Table EmptyState has no visible recovery action such as create, clear filters, retry, or request access.',
      );
    }
  }

  for (const match of content.matchAll(
    /\{([^{}]{0,360}\b[A-Za-z_$][\w$]*\.length\s*===\s*0[^{}]{0,360})&&\s*\(\s*(<EmptyState\b[\s\S]{0,1600}?<\/EmptyState>)\s*\)\s*\}/g,
  )) {
    const [, condition, emptyState] = match;
    const sourceEmpty = !/\.length\s*>\s*0/.test(condition);
    if (!sourceEmpty) continue;
    if (/clear\s+(?:all\s+)?filters/i.test(emptyState) || !/<Button\b/.test(emptyState)) {
      addFinding(
        filePath,
        content,
        match.index,
        'TP-05',
        'Source-empty state must contain its own primary setup/create CTA, not a Clear filters recovery action.',
      );
    }
  }

  const statisticsCount = (content.match(/<StatisticsWidget\b/g) || []).length;

  if (
    statisticsCount > 1
    && /<(?:Box|Flex)\b/.test(content)
    && !(/<Layout\b/.test(content) && /<Cell\b/.test(content))
  ) {
    addFinding(
      filePath,
      content,
      content.indexOf('<StatisticsWidget'),
      'AN-13',
      'Multiple StatisticsWidget instances are manually arranged with generic layout primitives; use the documented widget composition and WDS Layout/Cell placement.',
    );
  }

  const usesChartJs = /from\s+['"]react-chartjs-2['"]/.test(content) || /<(?:Bar|Line|Pie|Doughnut|Radar)\b/.test(content);
  if (usesChartJs && /maintainAspectRatio\s*:\s*true/.test(content) && /<Box\b[^>]*\bheight=/.test(content)) {
    addFinding(
      filePath,
      content,
      content.indexOf('maintainAspectRatio'),
      'AN-11',
      'Chart.js uses maintainAspectRatio: true inside a fixed-height dashboard chart region; it can overflow into the next surface.',
    );
  }
}

for (const { path: recordPath, record } of routeRecords) {
  if (record.route !== 'analytics' || !record.regionOwners?.metrics) continue;
  if (record.metricSurface === 'AnalyticsSummary' && !/<AnalyticsSummary\b/.test(dashboardPageSource)) {
    findings.push({
      filePath: recordPath,
      line: 1,
      rule: 'AN-13',
      message: 'Route record selects AnalyticsSummary, but the generated analytics source does not render it.',
    });
  }
  if (record.metricSurface === 'StatisticsWidget' && !/<StatisticsWidget\b/.test(dashboardPageSource)) {
    findings.push({
      filePath: recordPath,
      line: 1,
      rule: 'AN-13',
      message: 'Route record selects StatisticsWidget, but the generated analytics source does not render it.',
    });
  }

  const containmentOwner = String(record.metricContainmentOwner ?? '').toLowerCase();
  if (
    containmentOwner === 'card'
    && record.metricSurface === 'StatisticsWidget'
    && !/<Card\b[^>]*>[\s\S]{0,3000}?<StatisticsWidget\b[\s\S]{0,3000}?<\/Card>/.test(dashboardPageSource)
  ) {
    findings.push({
      filePath: recordPath,
      line: 1,
      rule: 'AN-13',
      message: 'Route record assigns metric containment to Card, but StatisticsWidget is not rendered in that documented Card composition.',
    });
  }
}

if (projectHasSidePanel) {
  const hostPattern = new RegExp(
    `(?:function|const)\\s+${sidePanelHostName}\\b[\\s\\S]{0,1800}position:\\s*['"]fixed['"][\\s\\S]{0,360}top:\\s*0[\\s\\S]{0,360}right:\\s*0[\\s\\S]{0,360}bottom:\\s*0[\\s\\S]{0,360}display:\\s*['"]flex['"][\\s\\S]{0,360}alignItems:\\s*['"]stretch['"][\\s\\S]{0,520}>\\s*\\{children\\}\\s*<\\/div>`,
  );
  const hasApprovedHost = hostPattern.test(projectSource);

  for (const [filePath, content] of contents) {
    const mountsPanel = mountsSidePanel(content);
    if (!mountsPanel) continue;

    const mountsWrapper = [...sidePanelComponents]
      .filter((name) => name !== 'SidePanel')
      .some((name) => new RegExp(`<${name}\\b`).test(content));
    if (mountsWrapper && !new RegExp(`<${sidePanelHostName}\\b`).test(content)) {
      addFinding(
        filePath,
        content,
        content.search(/<(?:[A-Z][A-Za-z0-9]*Panel)\\b/),
        'TP-08',
        'Floating SidePanel wrapper is mounted without DashboardSidePanelHost, so it can enter normal page flow instead of the dashboard overlay layer.',
      );
    }

    const relativeIndex = content.search(/position:\s*['"]relative['"]/);
    const overflowIndex = content.search(/overflow:\s*['"]hidden['"]/);
    const fullHeightIndex = content.search(/height:\s*['"]100%['"]/);
    if (relativeIndex >= 0 && overflowIndex >= 0 && fullHeightIndex >= 0) {
      addFinding(
        filePath,
        content,
        Math.min(relativeIndex, overflowIndex, fullHeightIndex),
        'TP-09',
        'Panel mount uses a relative, overflow-hidden, 100%-height page wrapper; this ties panel bounds to page content.',
      );
    }

    const absoluteIndex = content.search(/position:\s*['"]absolute['"]/);
    if (absoluteIndex >= 0 && fullHeightIndex >= 0) {
      addFinding(
        filePath,
        content,
        Math.min(absoluteIndex, fullHeightIndex),
        'TP-09',
        'Panel mount uses absolute positioning with height 100%; use the documented stable dashboard host instead.',
      );
    }

    report(
      filePath,
      content,
      'TP-09',
      /(?:100vh|100dvh)/,
      'Panel mount uses browser viewport height inside an embedded Dashboard Page.',
    );

    const fixedSiblingIndex = content.search(/(?:width:\s*['"]\d+(?:px)?['"]|flexShrink:\s*0)/);
    if (fixedSiblingIndex >= 0 && /display:\s*['"]flex['"]/.test(content)) {
      addFinding(
        filePath,
        content,
        fixedSiblingIndex,
        'TP-07',
        'Floating SidePanel is mounted as a fixed-width flex sibling/push column instead of the documented dashboard-level overlay.',
      );
    }

    const wrapperShadowIndex = content.search(/boxShadow\s*:/);
    if (wrapperShadowIndex >= 0) {
      addFinding(
        filePath,
        content,
        wrapperShadowIndex,
        'TP-12',
        'A wrapper adds its own SidePanel shadow; let skin="floating" own panel geometry and shadow.',
      );
    }

    const wrapperOverflowIndex = content.search(/overflow:\s*['"](?:auto|hidden)['"]/);
    const wrapperGeometryIndex = content.search(/(?:width:\s*['"]\d+(?:px)?['"]|height:\s*['"]100%['"])/);
    if (wrapperOverflowIndex >= 0 && wrapperGeometryIndex >= 0) {
      addFinding(
        filePath,
        content,
        Math.min(wrapperOverflowIndex, wrapperGeometryIndex),
        'TP-12',
        'A SidePanel wrapper owns overflow and fixed/full geometry, which can clip the floating skin and its shadow.',
      );
    }
  }

  if (!hasApprovedHost) {
    const firstPanelFile = files.find((filePath) => mountsSidePanel(contents.get(filePath)));
    addFinding(
      firstPanelFile,
      contents.get(firstPanelFile),
      contents.get(firstPanelFile).indexOf('<SidePanel'),
      'TP-08',
      'Project uses a floating SidePanel but does not define the required stretching fixed DashboardSidePanelHost with a direct SidePanel child.',
    );
  }
}

if (findings.length) {
  console.error('Dashboard code audit failed:');
  for (const finding of findings) {
    console.error(`- ${finding.rule} ${finding.filePath}:${finding.line} ${finding.message}`);
  }
  process.exit(1);
}

console.log(`Dashboard code audit passed: ${files.length} source file(s) checked.`);
