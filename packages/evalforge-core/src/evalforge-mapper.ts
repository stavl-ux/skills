import {
  isApiCall, isBuildPassed, isCost, isLlmJudge, isSkillWasCalled, isTimeLimit, isTokenCount,
  ScenarioSchema,
  type ApiCallAssertion, type Assertion, type BuildPassedAssertion, type CostAssertion,
  type LlmJudgeAssertion, type Scenario, type SiteBootstrapStep, type SiteSetup,
  type SkillWasCalledAssertion, type TimeLimitAssertion, type ToolCallAssertion, type TokenCountAssertion,
} from './schema';

// EvalForge v1 TestScenario uses assertionLinks (system-assertion references with primitive params)
// rather than inline assertions. params must be Record<string, string | number | boolean | null>.
// See packages/eval-types/src/assertion/assertion.ts in wix-private/evalforge.

const SYSTEM_TOOL_CALL = 'system:tool_called_with_param';
const SYSTEM_LLM_JUDGE = 'system:llm_judge';
const SYSTEM_API_CALL = 'system:api_call';
const SYSTEM_COST = 'system:cost';
const SYSTEM_TIME_LIMIT = 'system:time_limit';
const SYSTEM_SKILL_WAS_CALLED = 'system:skill_was_called';
const SYSTEM_BUILD_PASSED = 'system:build_passed';
const SYSTEM_TOKEN_COUNT = 'system:token_count';

type LinkParams = Record<string, string | number | boolean | null>;

export type ScenarioAssertionLink = {
  assertionId: string;
  params?: LinkParams;
};

// V1 SiteBootstrapHttpMethod enum names are uppercase.
export type EvalForgeBootstrapStep = {
  label?: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  url: string;
  body?: Record<string, unknown>;
};

// V1 SiteSetupConfig is a discriminator enum (`mode`) + an aligned oneof. For
// `TEMPLATE`, the template id goes under the `templateOptions` branch — not flat.
// `NONE` (mode only, no options) means "provision no site" and is the explicit
// clearing representation on update — the backend always applies site_setup when
// it is present in the body, so a scenario that drops its setup must send NONE.
export type EvalForgeSiteSetup =
  | { mode: 'TEMPLATE'; templateOptions: { templateId: string }; bootstrap?: { steps: EvalForgeBootstrapStep[] } }
  | { mode: 'NONE' };

export type EvalForgeBody = {
  name: string;
  description: string;
  triggerPrompt: string;
  assertionLinks: ScenarioAssertionLink[];
  // `toEvalForgeBody` always populates this: TEMPLATE when the scenario provisions
  // a site, NONE otherwise. Sending NONE explicitly clears any previously-set site
  // setup on update. Optional only so hand-built test fixtures stay ergonomic.
  siteSetup?: EvalForgeSiteSetup;
};

export function toEvalForgeBody(s: Scenario): EvalForgeBody {
  return {
    name: s.name,
    description: s.description,
    triggerPrompt: s.triggerPrompt,
    assertionLinks: s.assertions.map(mapAssertion),
    siteSetup: s.siteSetup ? mapSiteSetup(s.siteSetup) : { mode: 'NONE' },
  };
}

function mapSiteSetup(s: SiteSetup): EvalForgeSiteSetup {
  // Omit bootstrap when it has no steps.
  const bootstrap = s.bootstrap && s.bootstrap.steps.length > 0
    ? { steps: s.bootstrap.steps.map(mapBootstrapStep) }
    : undefined;
  return {
    mode: 'TEMPLATE',
    templateOptions: { templateId: s.templateId },
    ...(bootstrap ? { bootstrap } : {}),
  };
}

function mapBootstrapStep(step: SiteBootstrapStep): EvalForgeBootstrapStep {
  // Schema methods are lowercase; V1's SiteBootstrapHttpMethod enum is uppercase.
  const out: EvalForgeBootstrapStep = {
    method: step.method.toUpperCase() as EvalForgeBootstrapStep['method'],
    url: step.url,
  };
  if (step.label !== undefined) out.label = step.label;
  if (step.body !== undefined) out.body = step.body;
  return out;
}

function mapAssertion(a: Assertion): ScenarioAssertionLink {
  if (isLlmJudge(a)) return mapLlmJudge(a);
  if (isApiCall(a)) return mapApiCall(a);
  if (isCost(a)) return mapCost(a);
  if (isTimeLimit(a)) return mapTimeLimit(a);
  if (isSkillWasCalled(a)) return mapSkillWasCalled(a);
  if (isBuildPassed(a)) return mapBuildPassed(a);
  if (isTokenCount(a)) return mapTokenCount(a);
  return mapToolCall(a);
}

function mapToolCall(a: { tool: string; params?: Record<string, unknown>; negate?: boolean }): ScenarioAssertionLink {
  const params: LinkParams = {
    toolName: a.tool,
    expectedParams: JSON.stringify(a.params ?? {}),
  };
  if (a.negate !== undefined) params.negate = a.negate;
  return { assertionId: SYSTEM_TOOL_CALL, params };
}

function mapLlmJudge(a: LlmJudgeAssertion): ScenarioAssertionLink {
  const params: LinkParams = { prompt: a.prompt };
  if (a.minScore !== undefined) params.minScore = a.minScore;
  if (a.model !== undefined) params.model = a.model;
  if (a.maxTokens !== undefined) params.maxTokens = a.maxTokens;
  if (a.temperature !== undefined) params.temperature = a.temperature;
  if (a.scoringMode !== undefined) params.scoringMode = a.scoringMode;
  if (a.browserTools !== undefined) params.browserTools = a.browserTools;
  if (a.parameters !== undefined) params.parameters = JSON.stringify(a.parameters);
  if (a.negate !== undefined) params.negate = a.negate;
  return { assertionId: SYSTEM_LLM_JUDGE, params };
}

function mapSkillWasCalled(a: SkillWasCalledAssertion): ScenarioAssertionLink {
  const params: LinkParams = { skillNames: JSON.stringify(a.skillNames) };
  if (a.referenceFiles !== undefined) params.referenceFiles = JSON.stringify(a.referenceFiles);
  if (a.negate !== undefined) params.negate = a.negate;
  return { assertionId: SYSTEM_SKILL_WAS_CALLED, params };
}

function mapBuildPassed(a: BuildPassedAssertion): ScenarioAssertionLink {
  const params: LinkParams = {};
  if (a.command !== undefined) params.command = a.command;
  if (a.expectedExitCode !== undefined) params.expectedExitCode = a.expectedExitCode;
  if (a.negate !== undefined) params.negate = a.negate;
  return Object.keys(params).length > 0
    ? { assertionId: SYSTEM_BUILD_PASSED, params }
    : { assertionId: SYSTEM_BUILD_PASSED };
}

function mapTokenCount(a: TokenCountAssertion): ScenarioAssertionLink {
  const params: LinkParams = { maxTokens: a.maxTokens };
  if (a.negate !== undefined) params.negate = a.negate;
  return { assertionId: SYSTEM_TOKEN_COUNT, params };
}

function mapApiCall(a: ApiCallAssertion): ScenarioAssertionLink {
  const params: LinkParams = {
    url: a.url,
    expectedResponse: jsonifyMaybe(a.expectedResponse),
  };
  if (a.method !== undefined) params.method = a.method;
  if (a.requestBody !== undefined) params.requestBody = jsonifyMaybe(a.requestBody);
  if (a.requestHeaders !== undefined) params.requestHeaders = jsonifyMaybe(a.requestHeaders);
  if (a.timeoutMs !== undefined) params.timeoutMs = a.timeoutMs;
  if (a.negate !== undefined) params.negate = a.negate;
  return { assertionId: SYSTEM_API_CALL, params };
}

function mapCost(a: CostAssertion): ScenarioAssertionLink {
  const params: LinkParams = { maxCostUsd: a.maxCostUsd };
  if (a.negate !== undefined) params.negate = a.negate;
  return { assertionId: SYSTEM_COST, params };
}

function mapTimeLimit(a: TimeLimitAssertion): ScenarioAssertionLink {
  const params: LinkParams = { maxDurationMs: a.maxDurationMs };
  if (a.negate !== undefined) params.negate = a.negate;
  return { assertionId: SYSTEM_TIME_LIMIT, params };
}

// EvalForge expects expectedResponse/requestBody/requestHeaders as JSON STRINGS. Authors may write
// a YAML object/array for ergonomics — stringify if so, pass through if already a string.
function jsonifyMaybe(v: unknown): string {
  return typeof v === 'string' ? v : JSON.stringify(v);
}

// Inverse of `toEvalForgeBody`, used by the EvalForge -> repo YAML migration. `tags` is not part
// of the EvalForge wire body (toEvalForgeBody drops it — sync handles tags separately), so callers
// migrating scenarios must pass the repo/action-managed tags in explicitly. The result is validated
// through ScenarioSchema so a bad conversion fails loudly rather than emitting invalid YAML.
export function fromEvalForgeBody(body: {
  name: string;
  description?: string;
  triggerPrompt: string;
  assertionLinks?: ScenarioAssertionLink[];
  siteSetup?: EvalForgeSiteSetup;
  tags?: string[];
}): Scenario {
  const siteSetup = body.siteSetup ? unmapSiteSetup(body.siteSetup) : undefined;
  const scenario: Record<string, unknown> = {
    name: body.name,
    description: body.description ?? '',
    triggerPrompt: body.triggerPrompt,
    tags: body.tags ?? [],
    assertions: (body.assertionLinks ?? []).map(unmapAssertion),
    ...(siteSetup ? { siteSetup } : {}),
  };
  return ScenarioSchema.parse(scenario);
}

function unmapSiteSetup(s: EvalForgeSiteSetup): SiteSetup | undefined {
  if (s.mode === 'NONE') return undefined;
  const bootstrap = s.bootstrap
    ? { steps: s.bootstrap.steps.map(unmapBootstrapStep) }
    : undefined;
  return {
    mode: 'template',
    templateId: s.templateOptions.templateId,
    ...(bootstrap ? { bootstrap } : {}),
  };
}

function unmapBootstrapStep(step: EvalForgeBootstrapStep): SiteBootstrapStep {
  // V1 SiteBootstrapHttpMethod enum names are uppercase; schema methods are lowercase.
  const out: SiteBootstrapStep = {
    method: step.method.toLowerCase() as SiteBootstrapStep['method'],
    url: step.url,
  };
  if (step.label !== undefined) out.label = step.label;
  if (step.body !== undefined) out.body = step.body;
  return out;
}

function unmapAssertion(link: ScenarioAssertionLink): Assertion {
  const params: LinkParams = link.params ?? {};
  switch (link.assertionId) {
    case SYSTEM_LLM_JUDGE: return unmapLlmJudge(params);
    case SYSTEM_API_CALL: return unmapApiCall(params);
    case SYSTEM_COST: return unmapCost(params);
    case SYSTEM_TIME_LIMIT: return unmapTimeLimit(params);
    case SYSTEM_SKILL_WAS_CALLED: return unmapSkillWasCalled(params);
    case SYSTEM_BUILD_PASSED: return unmapBuildPassed(params);
    case SYSTEM_TOKEN_COUNT: return unmapTokenCount(params);
    case SYSTEM_TOOL_CALL: return unmapToolCall(params);
    default: throw new Error(`fromEvalForgeBody: unknown assertionId "${link.assertionId}"`);
  }
}

// Matches the authored tool-call shape (`type` is optional in ScenarioSchema for this assertion) —
// omit `type` on the way back so round-tripping an implicit-type scenario stays implicit-type.
function unmapToolCall(params: LinkParams): ToolCallAssertion {
  const out: ToolCallAssertion = { tool: String(params.toolName) };
  if (params.expectedParams !== undefined) {
    const parsedParams = JSON.parse(String(params.expectedParams));
    if (Object.keys(parsedParams).length > 0) out.params = parsedParams;
  }
  if (params.negate !== undefined) out.negate = Boolean(params.negate);
  return out;
}

function unmapLlmJudge(params: LinkParams): LlmJudgeAssertion {
  const out: LlmJudgeAssertion = { type: 'llm_judge', prompt: String(params.prompt) };
  if (params.minScore !== undefined) out.minScore = Number(params.minScore);
  if (params.model !== undefined) out.model = String(params.model);
  if (params.maxTokens !== undefined) out.maxTokens = Number(params.maxTokens);
  if (params.temperature !== undefined) out.temperature = Number(params.temperature);
  if (params.scoringMode !== undefined) out.scoringMode = params.scoringMode as LlmJudgeAssertion['scoringMode'];
  if (params.browserTools !== undefined) out.browserTools = Boolean(params.browserTools);
  if (params.parameters !== undefined) out.parameters = JSON.parse(String(params.parameters));
  if (params.negate !== undefined) out.negate = Boolean(params.negate);
  return out;
}

function unmapSkillWasCalled(params: LinkParams): SkillWasCalledAssertion {
  const out: SkillWasCalledAssertion = {
    type: 'skill_was_called',
    skillNames: JSON.parse(String(params.skillNames)),
  };
  if (params.referenceFiles !== undefined) out.referenceFiles = JSON.parse(String(params.referenceFiles));
  if (params.negate !== undefined) out.negate = Boolean(params.negate);
  return out;
}

function unmapBuildPassed(params: LinkParams): BuildPassedAssertion {
  const out: BuildPassedAssertion = { type: 'build_passed' };
  if (params.command !== undefined) out.command = String(params.command);
  if (params.expectedExitCode !== undefined) out.expectedExitCode = Number(params.expectedExitCode);
  if (params.negate !== undefined) out.negate = Boolean(params.negate);
  return out;
}

function unmapTokenCount(params: LinkParams): TokenCountAssertion {
  const out: TokenCountAssertion = { type: 'token_count', maxTokens: Number(params.maxTokens) };
  if (params.negate !== undefined) out.negate = Boolean(params.negate);
  return out;
}

function unmapApiCall(params: LinkParams): ApiCallAssertion {
  const out: ApiCallAssertion = {
    type: 'api_call',
    url: String(params.url),
    expectedResponse: JSON.parse(String(params.expectedResponse)),
  };
  if (params.method !== undefined) out.method = params.method as ApiCallAssertion['method'];
  if (params.requestBody !== undefined) out.requestBody = JSON.parse(String(params.requestBody));
  if (params.requestHeaders !== undefined) out.requestHeaders = JSON.parse(String(params.requestHeaders));
  if (params.timeoutMs !== undefined) out.timeoutMs = Number(params.timeoutMs);
  if (params.negate !== undefined) out.negate = Boolean(params.negate);
  return out;
}

function unmapCost(params: LinkParams): CostAssertion {
  const out: CostAssertion = { type: 'cost', maxCostUsd: Number(params.maxCostUsd) };
  if (params.negate !== undefined) out.negate = Boolean(params.negate);
  return out;
}

function unmapTimeLimit(params: LinkParams): TimeLimitAssertion {
  const out: TimeLimitAssertion = { type: 'time_limit', maxDurationMs: Number(params.maxDurationMs) };
  if (params.negate !== undefined) out.negate = Boolean(params.negate);
  return out;
}
