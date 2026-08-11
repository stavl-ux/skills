#!/usr/bin/env node

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const skillRoot = path.resolve(scriptDirectory, '..');
const referencesRoot = path.join(skillRoot, 'references');

const consolidatedReferences = [
  {
    file: 'DASHBOARD_ROUTING.md',
    required: ['## Contents', '## Route Selection', '## Runtime Validation'],
  },
  {
    file: 'AUTO_PATTERNS_DASHBOARD.md',
    required: [
      '## Contents',
      '## Route And Workflow Contract',
      '## Change Workflow',
      '## Generation And Configuration',
    ],
  },
  {
    file: 'auto-patterns-dashboard/configuration.md',
    required: ['## Contents', '## AppConfig Structure', '## Collection Page'],
  },
  {
    file: 'auto-patterns-dashboard/collection-workflows.md',
    required: ['## Contents', '## Views', '## Bulk Actions'],
  },
  {
    file: 'auto-patterns-dashboard/entity-workflows.md',
    required: ['## Contents', '## Entity Page', '## Custom Entity Headers'],
  },
  {
    file: 'auto-patterns-dashboard/extensions.md',
    required: ['## Contents', '## Custom Actions', '## AppContext'],
  },
];

const compactReferences = [
  {
    file: 'DOMAIN_DISCOVERY.md',
    required: ['## Contents', '## Two-Pass Discovery', '## Discovery Contract', '## Capability Verification', '**DD-01:**', '**DD-08:**'],
  },
  {
    file: 'DATA_FOUNDATION.md',
    required: ['## Contents', '## Resolution Order', '## Foundation Contract', '**DF-01:**'],
  },
  {
    file: 'DASHBOARD_WORKFLOW.md',
    required: ['## Contents', '## Five-WHAT Gate', '## Workflow Contract', '## Investigate', '## Verify', '**WF-01:**', '**WF-08:**'],
  },
];

const retiredReferences = [
  'AUTO_PATTERNS.md',
  'CHANGE_ROUTING.md',
  'CUSTOM_DASHBOARD.md',
  'DASHBOARD_ANALYTICS_PLAYBOOK.md',
  'DASHBOARD_AUTO_PATTERNS_CHANGE_PLAYBOOK.md',
  'DASHBOARD_AUTO_PATTERNS_PLAYBOOK.md',
  'DASHBOARD_COMPONENTS.md',
  'DASHBOARD_CUSTOM_TABLE_PANEL_PLAYBOOK.md',
  'DASHBOARD_CUSTOM_TABLE_PLAYBOOK.md',
  'DASHBOARD_LAYOUT.md',
  'DASHBOARD_MODAL_PLAYBOOK.md',
  'DASHBOARD_WDS_COMPONENT_GATE.md',
  'DATA_MODEL_AND_OPERATIONS.md',
  'OVERLAYS.md',
  'RUNTIME_VALIDATION.md',
  'VISUALIZATIONS.md',
  'WDS_MODAL_GUIDELINES.md',
  'WDS_TABLE_GUIDELINES.md',
  'auto-patterns-dashboard/action-cell.md',
  'auto-patterns-dashboard/app-config-structure.md',
  'auto-patterns-dashboard/app-context.md',
  'auto-patterns-dashboard/bulk-actions.md',
  'auto-patterns-dashboard/collection-page-actions.md',
  'auto-patterns-dashboard/collection-page.md',
  'auto-patterns-dashboard/custom-actions-override.md',
  'auto-patterns-dashboard/custom-columns-override.md',
  'auto-patterns-dashboard/custom-components-override.md',
  'auto-patterns-dashboard/custom-header-override.md',
  'auto-patterns-dashboard/custom-sections-override.md',
  'auto-patterns-dashboard/custom-slots-override.md',
  'auto-patterns-dashboard/entity-page-actions.md',
  'auto-patterns-dashboard/entity-page-view-actions.md',
  'auto-patterns-dashboard/entity-page.md',
  'auto-patterns-dashboard/pages-configuration.md',
  'auto-patterns-dashboard/resolved-action.md',
  'auto-patterns-dashboard/sdk-utilities.md',
  'auto-patterns-dashboard/views.md',
];

const failures = [];

function fail(message) {
  failures.push(message);
}

function markdownFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return markdownFiles(entryPath);
    return entry.isFile() && entry.name.endsWith('.md') ? [entryPath] : [];
  });
}

function lineCount(filePath) {
  return fs.readFileSync(filePath, 'utf8').split(/\r?\n/).length;
}

function wordCount(filePath) {
  return fs.readFileSync(filePath, 'utf8').trim().split(/\s+/).filter(Boolean).length;
}

function localMarkdownTargets(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  return [...content.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)]
    .map((match) => match[1].split('#')[0])
    .filter((target) => target && !/^(?:https?:|mailto:)/.test(target))
    .map((target) => path.resolve(path.dirname(filePath), target))
    .filter(
      (target) =>
        target.endsWith('.md') &&
        target.startsWith(`${skillRoot}${path.sep}`) &&
        fs.existsSync(target),
    );
}

function reachableMarkdown(entryPath) {
  const reachable = new Set();
  const pending = [entryPath];

  while (pending.length) {
    const filePath = pending.pop();
    if (reachable.has(filePath)) continue;
    reachable.add(filePath);
    pending.push(...localMarkdownTargets(filePath));
  }

  return reachable;
}

for (const reference of consolidatedReferences) {
  const filePath = path.join(referencesRoot, reference.file);
  if (!fs.existsSync(filePath)) {
    fail(`missing consolidated reference: ${reference.file}`);
    continue;
  }

  const count = lineCount(filePath);
  const content = fs.readFileSync(filePath, 'utf8');
  if (count < 350) fail(`${reference.file} is too small to justify a separate context read (${count} lines)`);
  if (count > 575) fail(`${reference.file} exceeds the focused-reference limit (${count} lines)`);
  for (const heading of reference.required) {
    if (!content.includes(heading)) fail(`${reference.file} is missing ${heading}`);
  }
}

for (const reference of compactReferences) {
  const filePath = path.join(referencesRoot, reference.file);
  if (!fs.existsSync(filePath)) {
    fail(`missing compact reference: ${reference.file}`);
    continue;
  }
  const count = lineCount(filePath);
  const content = fs.readFileSync(filePath, 'utf8');
  if (count < 60) fail(`${reference.file} is too small to define its focused contract (${count} lines)`);
  if (count > 180) fail(`${reference.file} exceeds the compact-reference limit (${count} lines)`);
  for (const heading of reference.required) {
    if (!content.includes(heading)) fail(`${reference.file} is missing ${heading}`);
  }
}

for (const retired of retiredReferences) {
  if (fs.existsSync(path.join(referencesRoot, retired))) {
    fail(`retired granular reference still exists: ${retired}`);
  }
}

const skillPath = path.join(skillRoot, 'SKILL.md');
if (lineCount(skillPath) > 120) fail('SKILL.md exceeds 120 lines');

const skillContent = fs.readFileSync(skillPath, 'utf8');
const frontmatter = skillContent.match(/^---\r?\n([\s\S]*?)\r?\n---/);
if (!frontmatter) {
  fail('SKILL.md is missing YAML frontmatter');
} else {
  const keys = [...frontmatter[1].matchAll(/^([a-zA-Z0-9_-]+):/gm)].map((match) => match[1]);
  if (!keys.includes('name')) fail('SKILL.md frontmatter is missing name');
  if (!keys.includes('description')) fail('SKILL.md frontmatter is missing description');
  const unsupported = keys.filter((key) => !['name', 'description', 'compatibility'].includes(key));
  if (unsupported.length) fail(`SKILL.md has unsupported frontmatter keys: ${unsupported.join(', ')}`);
}

for (const reference of [...consolidatedReferences, ...compactReferences]) {
  if (!skillContent.includes(`references/${reference.file}`)) {
    fail(`SKILL.md does not directly advertise ${reference.file}`);
  }
}

const discoveryLinkIndex = skillContent.indexOf('references/DOMAIN_DISCOVERY.md');
const workflowLinkIndex = skillContent.indexOf('references/DASHBOARD_WORKFLOW.md');
const foundationLinkIndex = skillContent.indexOf('references/DATA_FOUNDATION.md');
if (discoveryLinkIndex < 0
    || workflowLinkIndex < 0
    || foundationLinkIndex < 0
    || discoveryLinkIndex > workflowLinkIndex
    || workflowLinkIndex > foundationLinkIndex) {
  fail('SKILL.md must place domain discovery before the five-WHAT, data-foundation, and route gates');
}

const autoPatternsPath = path.join(referencesRoot, 'AUTO_PATTERNS_DASHBOARD.md');
const autoPatternsContent = fs.readFileSync(autoPatternsPath, 'utf8');
for (const reference of consolidatedReferences.slice(2)) {
  if (!autoPatternsContent.includes(reference.file)) {
    fail(`AUTO_PATTERNS_DASHBOARD.md does not advertise ${reference.file}`);
  }
}

if (skillContent.includes('For every dashboard request, read [DASHBOARD_ROUTING.md]')) {
  fail('SKILL.md forces every dashboard through DASHBOARD_ROUTING.md instead of using progressive disclosure');
}
if (!skillContent.includes('Auto Patterns is the default for every dashboard record workspace')) {
  fail('SKILL.md is missing the source-independent Auto Patterns default');
}
if (!skillContent.includes('Multiple source systems, a true join, an API response, mock data')) {
  fail('SKILL.md does not prevent source origin or mock data from bypassing Auto Patterns');
}
if (!skillContent.includes('DASHBOARD_PRESENTATION.md')) {
  fail('SKILL.md is missing the presentation-success decision layer');
}
if (!skillContent.includes('including standard Auto Patterns pages')) {
  fail('SKILL.md does not require the lightweight code audit for standard Auto Patterns pages');
}

const existingCollectionHotPath = [
  skillPath,
  autoPatternsPath,
  path.join(referencesRoot, 'DOMAIN_DISCOVERY.md'),
  path.join(referencesRoot, 'DATA_FOUNDATION.md'),
  path.join(referencesRoot, 'DASHBOARD_WORKFLOW.md'),
  path.join(referencesRoot, 'DASHBOARD_PRESENTATION.md'),
];
const existingCollectionWords = existingCollectionHotPath.reduce(
  (sum, filePath) => sum + wordCount(filePath),
  0,
);
if (existingCollectionWords > 11000) {
  fail(`existing-collection Auto Patterns hot path exceeds 11000 words (${existingCollectionWords})`);
}
const appOwnedCollectionWords = existingCollectionWords
  + wordCount(path.join(referencesRoot, 'DATA_COLLECTION.md'));
if (appOwnedCollectionWords > 13600) {
  fail(`app-owned Auto Patterns hot path exceeds 13600 words (${appOwnedCollectionWords})`);
}

const routingContent = fs.readFileSync(path.join(referencesRoot, 'DASHBOARD_ROUTING.md'), 'utf8');
if (!routingContent.includes('scaffold the Dashboard Page first')) {
  fail('DASHBOARD_ROUTING.md must create the route record after CLI scaffolding');
}

const generatorContent = fs.readFileSync(path.join(scriptDirectory, 'generate-auto-patterns.js'), 'utf8');
for (const requiredGeneratorContract of [
  'discovery',
  'dataFoundation',
  'workflow',
  'presentation',
  'dashboard-contract.json',
  'validatePresentationContract',
  'validateDiscoveryContract',
  'validateWorkflowContract',
  'authoritativeEditableFields',
  "workflowHasOperation(workflow, 'create')",
  "mode: offersGeneralEditing ? 'edit' : 'view'",
]) {
  if (!generatorContent.includes(requiredGeneratorContract)) {
    fail(`Auto Patterns generator is missing ${requiredGeneratorContract}`);
  }
}

const contractValidatorPath = path.join(scriptDirectory, 'lib', 'dashboard-contract.mjs');
if (!fs.existsSync(contractValidatorPath)) {
  fail('missing shared five-WHAT dashboard contract validator');
}
try {
  execFileSync(process.execPath, [path.join(scriptDirectory, 'test-dashboard-contract.mjs')], {
    stdio: 'pipe',
  });
} catch (error) {
  fail(`five-WHAT dashboard contract tests failed: ${error.stderr?.toString().trim() || error.message}`);
}
try {
  execFileSync(process.execPath, [path.join(scriptDirectory, 'test-audit-dashboard-code.mjs')], {
    stdio: 'pipe',
  });
} catch (error) {
  fail(`dashboard audit regression tests failed: ${error.stderr?.toString().trim() || error.message}`);
}

const extensionsContent = fs.readFileSync(
  path.join(referencesRoot, 'auto-patterns-dashboard', 'extensions.md'),
  'utf8',
);
if (/type CustomActionResolver\s*=/.test(extensionsContent)) {
  fail('extensions.md defines a universal custom-action resolver instead of delegating to the owning workflow reference');
}
for (const reference of consolidatedReferences.slice(2)) {
  const focusedContent = fs.readFileSync(path.join(referencesRoot, reference.file), 'utf8');
  if (/\b(?:use|rules?:) `errorHandler`\b/.test(focusedContent)) {
    fail(`${reference.file} references an AutoPatternsSDK errorHandler that does not exist`);
  }
}

try {
  execFileSync(
    process.execPath,
    [
      path.join(scriptDirectory, 'generate-auto-patterns.js'),
      '--validate-config',
      path.join(referencesRoot, 'auto-patterns-dashboard/example-patterns.json'),
    ],
    { stdio: 'pipe' },
  );
} catch (error) {
  fail(
    `example-patterns.json fails Auto Patterns semantic validation: ${
      error.stderr?.toString().trim() || error.message
    }`,
  );
}

const generatorFixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'wix-auto-patterns-generator-'));
try {
  const generatorInputPath = path.join(generatorFixtureRoot, 'input.json');
  const generatorOutputPath = path.join(generatorFixtureRoot, 'catalog-health');
  fs.writeFileSync(generatorInputPath, JSON.stringify({
    collection: {
      idSuffix: 'products',
      fields: [{ key: 'name', displayName: 'Name', type: 'TEXT' }],
    },
    schema: {
      content: {
        collectionRouteId: 'products',
        singularEntityName: 'product',
        pageTitle: 'Products',
        pageSubtitle: 'Catalog products',
        actionButtonLabel: 'Add product',
        toolbarTitle: 'Products',
        toolbarSubtitle: 'Catalog',
        emptyStateTitle: 'No products',
        emptyStateSubtitle: 'No products are available.',
        emptyStateButtonText: 'Add product',
        deleteModalTitle: 'Delete product?',
        deleteModalDescription: 'This cannot be undone.',
        deleteSuccessToast: 'Product deleted.',
        deleteErrorToast: 'Product could not be deleted.',
        bulkDeleteModalTitle: 'Delete products?',
        bulkDeleteModalDescription: 'This cannot be undone.',
        bulkDeleteSuccessToast: 'Products deleted.',
        bulkDeleteErrorToast: 'Products could not be deleted.',
        entityPageTitle: 'Product',
        entityPageSubtitle: 'Product details',
      },
      layout: { main: [{ title: 'Details', subtitle: '', fields: ['name'] }], sidebar: [] },
      columns: [{ id: 'name', displayName: 'Name' }],
      gridItem: null,
    },
    relevantCollectionId: 'Stores/Products',
    extensionName: 'Catalog Health',
    discovery: {
      context: {
        businessDomain: 'catalog operations',
        actorContext: ['catalog operator'],
        terminology: { record: 'Product', completedState: 'Managed' },
      },
      entities: [{
        id: 'product',
        name: 'Product',
        system: 'Wix Stores',
        identityField: '_id',
        identitySource: 'verified Stores collection metadata',
        source: 'installed Wix Stores app',
      }],
      existingSurfaces: [{
        id: 'stores-product-manager',
        name: 'Product Manager',
        owner: 'Wix Stores',
        purpose: 'authoritative product management',
      }],
      capabilities: [{
        id: 'manage-product',
        entityId: 'product',
        effect: 'open the selected product in the owning manager',
        support: 'verified',
        source: 'verified dashboard navigation contract',
        executionOwner: 'Wix Stores',
        executionHost: 'owning-app',
        permission: {
          status: 'not-required',
          requiredScopes: [],
          evidence: 'documented dashboard navigation',
        },
        dependencies: [],
      }],
      constraints: ['Product content remains owned by Wix Stores'],
      unresolved: [],
    },
    dataFoundation: {
      discoveryEntityId: 'product',
      system: 'wix-stores',
      mechanism: 'wix-app-collection',
      collectionId: 'Stores/Products',
      schemaStatus: 'verified',
      freshness: 'source-managed',
      capabilities: { read: true, insert: true, update: true, remove: true },
    },
    workflow: {
      journey: {
        outcome: {
          actorRole: 'catalog operator',
          desiredOutcome: 'inspect product issues and open the owning product manager',
        },
        understand: {
          questions: ['Which products need attention?'],
          signals: ['name'],
        },
        focus: { defaultWorkset: 'Products needing attention', controls: ['issue filter'] },
        investigate: {
          questions: ['What is wrong with this product?'],
          evidenceFields: ['name'],
          contextPriority: 'low',
        },
        act: { actions: [{
          id: 'manage-product',
          capabilityId: 'manage-product',
          kind: 'owning-app-navigation',
          operation: 'navigate',
          target: 'verified product manager',
          surfaces: ['row', 'detail'],
          decisionInputFields: [],
          transitionFields: [],
          authoritativeEditableFields: [],
        }] },
        verify: {
          visibleResult: 'The selected product opens in its owning manager',
          postconditions: ['destination identity matches the selected product'],
          refresh: ['collection'],
        },
      },
      implementation: {
        investigationSurface: 'entity-page',
        surfaceReason: 'The owning manager provides deep product detail',
        preserveCollectionContext: false,
        evidenceMode: 'read-only',
        identityField: '_id',
      },
    },
    presentation: {
      primaryRepresentation: {
        type: 'table',
        reason: 'Products must be compared by identity and issue state',
      },
      supportingRepresentations: [],
      drillIn: {
        interface: 'entity-page',
        reason: 'The owning manager provides the relevant linkable detail',
        preservesContext: false,
      },
      stageEmphasis: {
        understand: ['products needing attention'],
        focus: ['issue-filtered workset'],
        investigate: ['product identity and issue evidence'],
        act: ['manage product'],
        verify: ['correct owning product opens'],
      },
      actionPresentation: {
        actionIds: ['manage-product'],
        prominence: 'immediate',
        relationshipToEvidence: 'adjacent',
      },
      consistency: ['filters', 'selected record', 'owning destination'],
    },
  }));
  execFileSync(
    process.execPath,
    [
      path.join(scriptDirectory, 'generate-auto-patterns.js'),
      '--input',
      generatorInputPath,
      '--output',
      generatorOutputPath,
    ],
    { stdio: 'pipe' },
  );
  const generatedPatterns = JSON.parse(
    fs.readFileSync(path.join(generatorOutputPath, 'patterns.json'), 'utf8'),
  );
  const generatedContract = JSON.parse(
    fs.readFileSync(path.join(generatorOutputPath, 'dashboard-contract.json'), 'utf8'),
  );
  const generatedText = JSON.stringify(generatedPatterns);
  if (generatedText.includes('bulkDelete') || generatedText.includes('type":"delete"') || generatedText.includes('type":"create"')) {
    fail('read-only journey exposes create/delete actions that capability alone cannot justify');
  }
  const generatedEntityPage = generatedPatterns.pages.find((page) => page.type === 'entityPage');
  if (generatedEntityPage?.entityPage?.mode !== 'view') {
    fail('read-only Wix App Collection generator fixture does not produce a view entity page');
  }
  if (generatedContract.dataFoundation?.mechanism !== 'wix-app-collection') {
    fail('Auto Patterns generator did not preserve the data-foundation contract');
  }
  if (generatedContract.discovery?.capabilities?.[0]?.id !== 'manage-product') {
    fail('Auto Patterns generator did not preserve the discovery contract');
  }
  if (generatedContract.presentation?.primaryRepresentation?.type !== 'table') {
    fail('Auto Patterns generator did not preserve the presentation contract');
  }
} catch (error) {
  fail(`Auto Patterns generator contract fixture failed: ${error.stderr?.toString().trim() || error.message}`);
} finally {
  fs.rmSync(generatorFixtureRoot, { recursive: true, force: true });
}

const ruleOwners = new Map();
for (const reference of [...consolidatedReferences.slice(0, 2), ...compactReferences]) {
  const filePath = path.join(referencesRoot, reference.file);
  if (!fs.existsSync(filePath)) continue;
  const content = fs.readFileSync(filePath, 'utf8');
  for (const match of content.matchAll(/\*\*([A-Z]+-\d+):\*\*/g)) {
    const existing = ruleOwners.get(match[1]);
    if (existing) fail(`duplicate rule ${match[1]} in ${existing} and ${reference.file}`);
    ruleOwners.set(match[1], reference.file);
  }
}

for (const filePath of [skillPath, ...markdownFiles(referencesRoot)]) {
  const content = fs.readFileSync(filePath, 'utf8');
  for (const match of content.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
    const target = match[1].split('#')[0];
    if (!target || /^(?:https?:|mailto:)/.test(target)) continue;
    const resolved = path.resolve(path.dirname(filePath), target);
    if (!fs.existsSync(resolved)) {
      fail(`broken link in ${path.relative(skillRoot, filePath)}: ${match[1]}`);
    }
  }
}

const reachableReferences = reachableMarkdown(skillPath);
for (const filePath of markdownFiles(referencesRoot)) {
  if (!reachableReferences.has(filePath)) {
    fail(`reference is unreachable from SKILL.md: ${path.relative(skillRoot, filePath)}`);
  }
}

if (failures.length) {
  console.error('Dashboard skill validation failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(
  `Dashboard skill validation passed: ${consolidatedReferences.length} consolidated references, ${compactReferences.length} compact contracts, ${ruleOwners.size} owned rules, links resolved.`,
);
