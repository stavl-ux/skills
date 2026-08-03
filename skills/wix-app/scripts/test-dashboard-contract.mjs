#!/usr/bin/env node

import assert from 'node:assert/strict';
import {
  authoritativeEditableFields,
  validateWorkflowContract,
  workflowHasOperation,
} from './lib/dashboard-contract.mjs';

function reviewWorkflow() {
  return {
    journey: {
      outcome: {
        actorRole: 'content reviewer',
        desiredOutcome: 'approve safe submissions or request changes',
      },
      understand: {
        questions: ['What needs review first?'],
        signals: ['status', 'risk', 'overdue'],
      },
      focus: {
        defaultWorkset: 'Pending submissions',
        controls: ['risk filter', 'search'],
      },
      investigate: {
        questions: ['Is this submission publication-ready?'],
        evidenceFields: ['body', 'riskReasons', 'author'],
        contextPriority: 'high',
      },
      act: {
        actions: [{
          id: 'request-changes',
          kind: 'mutation',
          operation: 'transition',
          target: 'submissions collection',
          surfaces: ['row', 'detail'],
          decisionInputFields: ['reviewerNotes', 'changesRequested'],
          transitionFields: ['status'],
          authoritativeEditableFields: [],
        }],
      },
      verify: {
        visibleResult: 'The submission leaves the pending queue',
        postconditions: ['status is persisted'],
        refresh: ['collection', 'views', 'counts', 'detail', 'selection'],
      },
    },
    implementation: {
      investigationSurface: 'side-panel',
      surfaceReason: 'Preserve queue context while reading and deciding',
      preserveCollectionContext: true,
      evidenceMode: 'read-only',
      identityField: '_id',
    },
  };
}

const capabilities = { read: true, insert: true, update: true, remove: true };
const workflow = reviewWorkflow();

assert.deepEqual(
  validateWorkflowContract(workflow, { capabilities, requireCollectionRefresh: true }),
  [],
);
assert.deepEqual(authoritativeEditableFields(workflow), []);
assert.equal(workflowHasOperation(workflow, 'create'), false);

const overlappingFields = reviewWorkflow();
overlappingFields.journey.act.actions[0].authoritativeEditableFields = ['reviewerNotes'];
assert.match(
  validateWorkflowContract(overlappingFields, { capabilities }).join('\n'),
  /must keep decision, transition, and authoritative fields disjoint/,
);

const undeclaredPermission = reviewWorkflow();
undeclaredPermission.journey.act.actions[0].operation = 'create';
assert.match(
  validateWorkflowContract(undeclaredPermission, {
    capabilities: { ...capabilities, insert: false },
  }).join('\n'),
  /requires insert capability/,
);

assert.match(
  validateWorkflowContract({
    intent: { actorRole: 'reviewer', primaryJob: 'review content' },
  }).join('\n'),
  /five WHATs/,
);

console.log('Dashboard contract tests passed: journey, field responsibility, operations, and capability gates.');
