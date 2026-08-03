const ACTION_KINDS = new Set(['mutation', 'owning-app-navigation']);
const ACTION_OPERATIONS = new Set(['create', 'update', 'transition', 'delete', 'navigate', 'execute']);
const ACTION_SURFACES = new Set(['collection', 'row', 'bulk', 'detail', 'edit']);
const INVESTIGATION_SURFACES = new Set(['side-panel', 'modal', 'entity-page', 'owning-app-navigation']);
const EVIDENCE_MODES = new Set(['read-only', 'editable', 'mixed']);
const CONTEXT_PRIORITIES = new Set(['high', 'medium', 'low']);
const PRESENTATION_REPRESENTATIONS = new Set([
  'table',
  'gallery',
  'list',
  'kanban',
  'timeline',
  'calendar',
  'chart',
  'summary-metrics',
]);
const PRESENTATION_DRILL_INS = new Set([
  'inline',
  'side-panel',
  'modal',
  'entity-page',
  'owning-app-navigation',
]);
const WORKFLOW_STAGES = ['understand', 'focus', 'investigate', 'act', 'verify'];
const ACTION_PROMINENCE = new Set(['immediate', 'contextual', 'progressive']);
const ACTION_EVIDENCE_RELATIONSHIPS = new Set(['adjacent', 'same-surface', 'separate-step']);
const DATA_SCOPES = new Set(['active-workset', 'entire-collection']);

function isText(value) {
  return typeof value === 'string' && Boolean(value.trim());
}

function isTextArray(value, { allowEmpty = true } = {}) {
  return Array.isArray(value)
    && (allowEmpty || value.length > 0)
    && value.every(isText);
}

function authoritativeFieldOverlap(action) {
  const boundedActionFields = new Set([
    ...(action.decisionInputFields ?? []),
    ...(action.transitionFields ?? []),
  ]);
  return (action.authoritativeEditableFields ?? []).filter(
    (field) => boundedActionFields.has(field),
  );
}

function validateActionBindings(actions, implementation, errors) {
  if (implementation?.actionBindings == null) return;
  if (!implementation.actionBindings || typeof implementation.actionBindings !== 'object' || Array.isArray(implementation.actionBindings)) {
    errors.push('workflow.implementation.actionBindings must map logical action IDs to surface resolver IDs');
    return;
  }

  const actionsById = new Map(actions.map((action) => [action.id, action]));
  for (const [actionId, bindings] of Object.entries(implementation.actionBindings)) {
    const action = actionsById.get(actionId);
    if (!action || !bindings || typeof bindings !== 'object' || Array.isArray(bindings)) {
      errors.push('workflow.implementation.actionBindings contains an unknown action or invalid bindings');
      continue;
    }
    const declaredSurfaces = new Set(action.surfaces ?? []);
    for (const [surface, resolverId] of Object.entries(bindings)) {
      if (!ACTION_SURFACES.has(surface) || !declaredSurfaces.has(surface) || !isText(resolverId)) {
        errors.push(`workflow.implementation.actionBindings.${actionId} contains an undeclared surface or invalid resolver ID`);
      }
    }
    for (const surface of declaredSurfaces) {
      if (!isText(bindings[surface])) {
        errors.push(`workflow.implementation.actionBindings.${actionId} must bind every declared surface`);
      }
    }
  }
}

export function workflowActions(workflow) {
  return Array.isArray(workflow?.journey?.act?.actions)
    ? workflow.journey.act.actions
    : [];
}

export function authoritativeEditableFields(workflow) {
  return [...new Set(workflowActions(workflow).flatMap(
    (action) => action.authoritativeEditableFields ?? [],
  ))];
}

export function workflowHasOperation(workflow, operation) {
  return workflowActions(workflow).some((action) => action.operation === operation);
}

function validateRepresentation(representation, prefix, errors) {
  if (!representation
      || typeof representation !== 'object'
      || !PRESENTATION_REPRESENTATIONS.has(representation.type)
      || !isText(representation.reason)) {
    errors.push(`${prefix} must declare a supported type and a task-based reason`);
    return;
  }
  if (
    ['chart', 'summary-metrics'].includes(representation.type)
    && !DATA_SCOPES.has(representation.dataScope)
  ) {
    errors.push(`${prefix}.dataScope must declare active-workset or entire-collection`);
  }
}

export function validatePresentationContract(presentation, { workflow } = {}) {
  const errors = [];
  if (!presentation || typeof presentation !== 'object' || Array.isArray(presentation)) {
    return ['presentation must define how the completed journey and verified data are expressed'];
  }

  validateRepresentation(
    presentation.primaryRepresentation,
    'presentation.primaryRepresentation',
    errors,
  );

  if (!Array.isArray(presentation.supportingRepresentations)) {
    errors.push('presentation.supportingRepresentations must be an array');
  } else {
    presentation.supportingRepresentations.forEach((representation, index) => {
      validateRepresentation(
        representation,
        `presentation.supportingRepresentations[${index}]`,
        errors,
      );
    });
  }

  const drillIn = presentation.drillIn;
  if (!drillIn
      || typeof drillIn !== 'object'
      || !PRESENTATION_DRILL_INS.has(drillIn.interface)
      || !isText(drillIn.reason)
      || typeof drillIn.preservesContext !== 'boolean') {
    errors.push('presentation.drillIn must declare a supported interface, task-based reason, and context-preservation decision');
  }

  for (const stage of WORKFLOW_STAGES) {
    if (!isTextArray(presentation.stageEmphasis?.[stage], { allowEmpty: false })) {
      errors.push(`presentation.stageEmphasis.${stage} must describe how that workflow need remains legible`);
    }
  }

  if (!isTextArray(presentation.consistency, { allowEmpty: false })) {
    errors.push('presentation.consistency must name the states and representations that should remain coherent');
  }

  const actionPresentation = presentation.actionPresentation;
  if (!actionPresentation
      || typeof actionPresentation !== 'object'
      || !isTextArray(actionPresentation.actionIds, { allowEmpty: false })
      || !ACTION_PROMINENCE.has(actionPresentation.prominence)
      || !ACTION_EVIDENCE_RELATIONSHIPS.has(actionPresentation.relationshipToEvidence)) {
    errors.push('presentation.actionPresentation must declare actionIds, prominence, and relationshipToEvidence');
  } else if (workflow) {
    const workflowActionIds = new Set(workflowActions(workflow).map((action) => action.id));
    const presentedActionIds = new Set(actionPresentation.actionIds);
    const missingActionIds = actionPresentation.actionIds.filter(
      (actionId) => !workflowActionIds.has(actionId),
    );
    const omittedActionIds = [...workflowActionIds].filter(
      (actionId) => !presentedActionIds.has(actionId),
    );
    if (missingActionIds.length) {
      errors.push(`presentation.actionPresentation references actions missing from the workflow: ${missingActionIds.join(', ')}`);
    }
    if (omittedActionIds.length) {
      errors.push(`presentation.actionPresentation omits workflow actions: ${omittedActionIds.join(', ')}`);
    }
  }

  const implementation = workflow?.implementation;
  const adaptationReason = drillIn?.adaptationReason;
  if (implementation && drillIn) {
    const interfaceChanged = drillIn.interface !== implementation.investigationSurface;
    const contextChanged = drillIn.preservesContext !== implementation.preserveCollectionContext;
    if ((interfaceChanged || contextChanged) && !isText(adaptationReason)) {
      errors.push('presentation.drillIn and workflow.implementation must align or declare a capability-driven adaptationReason');
    }
  }

  return [...new Set(errors)];
}

export function validateWorkflowContract(
  workflow,
  { capabilities, requireCollectionRefresh = false } = {},
) {
  const errors = [];
  const journey = workflow?.journey;
  const implementation = workflow?.implementation;
  const actions = workflowActions(workflow);

  if (!journey || typeof journey !== 'object') {
    return ['workflow.journey must answer the five WHATs before implementation choices'];
  }

  if (!isText(journey.outcome?.actorRole) || !isText(journey.outcome?.desiredOutcome)) {
    errors.push('journey.outcome must declare actorRole and desiredOutcome');
  }
  if (!isTextArray(journey.understand?.questions, { allowEmpty: false })
      || !isTextArray(journey.understand?.signals, { allowEmpty: false })) {
    errors.push('journey.understand must declare non-empty questions and signals');
  }
  if (!isText(journey.focus?.defaultWorkset)
      || !isTextArray(journey.focus?.controls)) {
    errors.push('journey.focus must declare defaultWorkset and controls');
  }
  if (!isTextArray(journey.investigate?.questions, { allowEmpty: false })
      || !isTextArray(journey.investigate?.evidenceFields, { allowEmpty: false })
      || !CONTEXT_PRIORITIES.has(journey.investigate?.contextPriority)) {
    errors.push('journey.investigate must declare questions, evidenceFields, and contextPriority');
  }
  if (!actions.length) {
    errors.push('journey.act.actions must contain at least one real action');
  }

  for (const [index, action] of actions.entries()) {
    const prefix = `journey.act.actions[${index}]`;
    if (!isText(action?.id)
        || !ACTION_KINDS.has(action?.kind)
        || !ACTION_OPERATIONS.has(action?.operation)
        || !isText(action?.target)) {
      errors.push(`${prefix} must declare id, kind, operation, and target`);
    }
    if (!Array.isArray(action?.surfaces)
        || !action.surfaces.length
        || action.surfaces.some((surface) => !ACTION_SURFACES.has(surface))) {
      errors.push(`${prefix}.surfaces contains an unsupported or empty placement`);
    }
    for (const fieldGroup of [
      'decisionInputFields',
      'transitionFields',
      'authoritativeEditableFields',
    ]) {
      if (!isTextArray(action?.[fieldGroup])) {
        errors.push(`${prefix}.${fieldGroup} must be an array of field IDs`);
      }
    }
    if (authoritativeFieldOverlap(action).length) {
      errors.push(`${prefix} must keep authoritative editing separate from bounded action inputs and mutated fields`);
    }
    if (action?.surfaces?.includes('row') && !action.surfaces.includes('detail')) {
      errors.push(`${prefix} appears on a row but is missing from detail`);
    }
    if (action?.surfaces?.includes('edit') && !action.authoritativeEditableFields?.length) {
      errors.push(`${prefix} declares an edit surface without authoritative editable fields`);
    }
    if (action?.kind === 'owning-app-navigation'
        && (action.operation !== 'navigate'
          || action.decisionInputFields?.length
          || action.transitionFields?.length
          || action.authoritativeEditableFields?.length)) {
      errors.push(`${prefix} owning-app navigation cannot declare local mutation fields`);
    }
    if (capabilities && action?.kind === 'mutation') {
      if (action.operation === 'create' && capabilities.insert !== true) {
        errors.push(`${prefix} requires insert capability`);
      }
      if (action.operation === 'delete' && capabilities.remove !== true) {
        errors.push(`${prefix} requires remove capability`);
      }
      if (['update', 'transition'].includes(action.operation) && capabilities.update !== true) {
        errors.push(`${prefix} requires update capability`);
      }
      if (
        action.operation !== 'create'
        && (action.decisionInputFields?.length
          || action.transitionFields?.length
          || action.authoritativeEditableFields?.length)
        && capabilities.update !== true
      ) {
        errors.push(`${prefix} declares persisted fields without update capability`);
      }
    }
  }

  if (actions.length && !actions.some((action) => action.surfaces?.includes('detail'))) {
    errors.push('at least one real action must remain available after investigation');
  }
  if (actions[0]?.operation !== 'create' && !actions[0]?.surfaces?.includes('detail')) {
    errors.push('the workflow-defining action must remain available on detail');
  }

  if (!isText(journey.verify?.visibleResult)
      || !isTextArray(journey.verify?.postconditions, { allowEmpty: false })
      || !isTextArray(journey.verify?.refresh, { allowEmpty: false })) {
    errors.push('journey.verify must declare visibleResult, postconditions, and refresh');
  } else if (requireCollectionRefresh && !journey.verify.refresh.includes('collection')) {
    errors.push('journey.verify.refresh must include collection');
  }

  const mutatesOnDetail = actions.some(
    (action) => action.kind === 'mutation' && action.surfaces?.includes('detail'),
  );
  if (mutatesOnDetail && !journey.verify?.refresh?.includes('detail')) {
    errors.push('journey.verify.refresh must include detail when a mutation is available on detail');
  }

  if (!implementation || typeof implementation !== 'object'
      || !INVESTIGATION_SURFACES.has(implementation.investigationSurface)
      || !isText(implementation.surfaceReason)
      || typeof implementation.preserveCollectionContext !== 'boolean'
      || !EVIDENCE_MODES.has(implementation.evidenceMode)
      || !isText(implementation.identityField)) {
    errors.push('workflow.implementation must declare the investigation surface, rationale, context preservation, evidence mode, and identity field');
  }
  validateActionBindings(actions, implementation, errors);

  if (implementation?.evidenceMode === 'editable'
      && authoritativeEditableFields(workflow).length === 0) {
    errors.push('editable evidence mode requires authoritative editable fields');
  }

  return [...new Set(errors)];
}
