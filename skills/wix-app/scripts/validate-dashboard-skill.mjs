#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
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

for (const reference of consolidatedReferences) {
  const filePath = path.join(referencesRoot, reference.file);
  if (!fs.existsSync(filePath)) {
    fail(`missing consolidated reference: ${reference.file}`);
    continue;
  }

  const count = lineCount(filePath);
  const content = fs.readFileSync(filePath, 'utf8');
  if (count < 350) fail(`${reference.file} is too small to justify a separate context read (${count} lines)`);
  if (count > 550) fail(`${reference.file} exceeds the focused-reference limit (${count} lines)`);
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

for (const reference of consolidatedReferences.slice(0, 2)) {
  if (!skillContent.includes(`references/${reference.file}`)) {
    fail(`SKILL.md does not directly advertise ${reference.file}`);
  }
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
if (!skillContent.includes('new manager backed by one physical CMS collection')) {
  fail('SKILL.md is missing the direct one-collection Auto Patterns fast path');
}
if (!skillContent.includes('Standard generated Auto Patterns pages do not require this custom-route audit')) {
  fail('SKILL.md does not scope the custom dashboard audit away from standard Auto Patterns pages');
}

const simpleAutoPatternsHotPath = [
  skillPath,
  autoPatternsPath,
  path.join(referencesRoot, 'DATA_COLLECTION.md'),
];
const hotPathWords = simpleAutoPatternsHotPath.reduce((sum, filePath) => sum + wordCount(filePath), 0);
if (hotPathWords > 8000) {
  fail(`simple Auto Patterns hot path exceeds 8000 words (${hotPathWords})`);
}

const routingContent = fs.readFileSync(path.join(referencesRoot, 'DASHBOARD_ROUTING.md'), 'utf8');
if (!routingContent.includes('scaffold the Dashboard Page first')) {
  fail('DASHBOARD_ROUTING.md must create the route record after CLI scaffolding');
}

const ruleOwners = new Map();
for (const reference of consolidatedReferences.slice(0, 2)) {
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

if (failures.length) {
  console.error('Dashboard skill validation failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(
  `Dashboard skill validation passed: ${consolidatedReferences.length} consolidated references, ${ruleOwners.size} owned rules, links resolved.`,
);
