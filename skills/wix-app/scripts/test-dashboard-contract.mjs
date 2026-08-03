#!/usr/bin/env node

import assert from 'node:assert/strict';
import {
  authoritativeEditableFields,
  validatePresentationContract,
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
      actionBindings: {
        'request-changes': {
          row: 'requestChanges',
          detail: 'requestChangesEntity',
        },
      },
    },
  };
}

function reviewPresentation() {
  return {
    primaryRepresentation: {
      type: 'table',
      reason: 'Submissions must be compared across status, risk, and age',
    },
    supportingRepresentations: [{
      type: 'summary-metrics',
      reason: 'Pending and high-risk counts explain queue health',
    }],
    drillIn: {
      interface: 'side-panel',
      reason: 'Reviewers are likely to inspect several submissions from one queue',
      preservesContext: true,
    },
    stageEmphasis: {
      understand: ['pending and high-risk counts'],
      focus: ['pending review workset'],
      investigate: ['submission body and risk reasons'],
      act: ['approve or request changes'],
      verify: ['updated queue membership and counts'],
    },
    actionPresentation: {
      actionIds: ['request-changes'],
      prominence: 'immediate',
      relationshipToEvidence: 'adjacent',
    },
    consistency: ['filters', 'views', 'counts', 'selected record', 'detail'],
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
assert.deepEqual(validatePresentationContract(reviewPresentation(), { workflow }), []);

const overlappingFields = reviewWorkflow();
overlappingFields.journey.act.actions[0].authoritativeEditableFields = ['reviewerNotes'];
assert.match(
  validateWorkflowContract(overlappingFields, { capabilities }).join('\n'),
  /must keep authoritative editing separate from bounded action inputs and mutated fields/,
);

const boundedPersistedInput = reviewWorkflow();
boundedPersistedInput.journey.act.actions[0].decisionInputFields = ['owner'];
boundedPersistedInput.journey.act.actions[0].transitionFields = ['owner'];
assert.deepEqual(
  validateWorkflowContract(boundedPersistedInput, { capabilities }),
  [],
);

const undeclaredPermission = reviewWorkflow();
undeclaredPermission.journey.act.actions[0].operation = 'create';
assert.match(
  validateWorkflowContract(undeclaredPermission, {
    capabilities: { ...capabilities, insert: false },
  }).join('\n'),
  /requires insert capability/,
);

const missingDetailRefresh = reviewWorkflow();
missingDetailRefresh.journey.verify.refresh = ['collection', 'views'];
assert.match(
  validateWorkflowContract(missingDetailRefresh, { capabilities }).join('\n'),
  /must include detail when a mutation is available on detail/,
);

const incompleteBindings = reviewWorkflow();
delete incompleteBindings.implementation.actionBindings['request-changes'].detail;
assert.match(
  validateWorkflowContract(incompleteBindings, { capabilities }).join('\n'),
  /actionBindings\.request-changes must bind every declared surface/,
);

assert.match(
  validateWorkflowContract({
    intent: { actorRole: 'reviewer', primaryJob: 'review content' },
  }).join('\n'),
  /five WHATs/,
);

const unsupportedRepresentation = reviewPresentation();
unsupportedRepresentation.primaryRepresentation.type = 'dashboard';
assert.match(
  validatePresentationContract(unsupportedRepresentation, { workflow }).join('\n'),
  /supported type and a task-based reason/,
);

const unexplainedSurfaceChange = reviewPresentation();
unexplainedSurfaceChange.drillIn.interface = 'entity-page';
unexplainedSurfaceChange.drillIn.preservesContext = false;
assert.match(
  validatePresentationContract(unexplainedSurfaceChange, { workflow }).join('\n'),
  /must align or declare a capability-driven adaptationReason/,
);

unexplainedSurfaceChange.drillIn.adaptationReason = 'Installed route supports a linkable entity view but not contextual detail';
assert.deepEqual(
  validatePresentationContract(unexplainedSurfaceChange, { workflow }),
  [],
);

const renewalWorkflow = reviewWorkflow();
renewalWorkflow.journey.act.actions = [
  {
    id: 'assign-owner',
    kind: 'mutation',
    operation: 'update',
    target: 'renewal accounts collection',
    surfaces: ['row', 'detail'],
    decisionInputFields: ['owner'],
    transitionFields: ['owner'],
    authoritativeEditableFields: [],
  },
  {
    id: 'update-next-step',
    kind: 'mutation',
    operation: 'update',
    target: 'renewal accounts collection',
    surfaces: ['row', 'detail'],
    decisionInputFields: ['nextStep'],
    transitionFields: ['nextStep'],
    authoritativeEditableFields: [],
  },
  {
    id: 'complete-follow-up',
    kind: 'mutation',
    operation: 'transition',
    target: 'renewal accounts collection',
    surfaces: ['row', 'detail'],
    decisionInputFields: [],
    transitionFields: ['followUpCompleted'],
    authoritativeEditableFields: [],
  },
];
renewalWorkflow.implementation.actionBindings = {
  'assign-owner': { row: 'assignOwner', detail: 'assignOwnerDetail' },
  'update-next-step': { row: 'updateNextStep', detail: 'updateNextStepDetail' },
  'complete-follow-up': { row: 'completeFollowUp', detail: 'completeFollowUpDetail' },
};
const renewalPresentation = reviewPresentation();
renewalPresentation.actionPresentation.actionIds = [
  'assign-owner',
  'update-next-step',
  'complete-follow-up',
];
assert.deepEqual(validateWorkflowContract(renewalWorkflow, { capabilities }), []);
assert.deepEqual(
  validatePresentationContract(renewalPresentation, { workflow: renewalWorkflow }),
  [],
);

const reducedRenewalWorkflow = structuredClone(renewalWorkflow);
reducedRenewalWorkflow.journey.act.actions = [
  reducedRenewalWorkflow.journey.act.actions[2],
];
assert.match(
  validatePresentationContract(
    renewalPresentation,
    { workflow: reducedRenewalWorkflow },
  ).join('\n'),
  /actions missing from the workflow: assign-owner, update-next-step/,
);

console.log('Dashboard contract tests passed: journey, presentation, field responsibility, operations, and capability gates.');
