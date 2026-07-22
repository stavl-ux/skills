import { describe, it, expect } from 'vitest';
import { toEvalForgeBody, fromEvalForgeBody, type ScenarioAssertionLink } from '../src/evalforge-mapper';
import type { Scenario } from '../src/schema';

const scenario: Scenario = {
  name: 'blog/how-to-create-blog-posts',
  description: 'Create and publish a blog post.',
  triggerPrompt: 'Create a blog post titled Hello',
  tags: ['blog'],
  assertions: [
    {
      tool: 'wix_mcp_remote_ReadFullDocsArticle',
      params: { articleUrl: 'https://dev.wix.com/foo' },
    },
    {
      tool: 'wix_mcp_remote_CallWixSiteAPI',
      params: { url: 'https://www.wixapis.com/blog/v3/draft-posts', method: 'POST' },
    },
  ],
};

function linkByType(links: ScenarioAssertionLink[], systemId: string): ScenarioAssertionLink {
  const link = links.find(l => l.assertionId === systemId);
  if (!link) throw new Error(`no link with assertionId=${systemId}`);
  return link;
}

describe('toEvalForgeBody', () => {
  it('maps top-level fields', () => {
    const body = toEvalForgeBody(scenario);
    expect(body.name).toBe(scenario.name);
    expect(body.description).toBe(scenario.description);
    expect(body.triggerPrompt).toBe(scenario.triggerPrompt);
  });

  it('drops the YAML-only tags field (handled separately by sync)', () => {
    expect(toEvalForgeBody(scenario)).not.toHaveProperty('tags');
  });

  it('produces assertionLinks pointing at system:tool_called_with_param', () => {
    const body = toEvalForgeBody(scenario);
    expect(body.assertionLinks).toHaveLength(2);
    for (const l of body.assertionLinks) {
      expect(l.assertionId).toBe('system:tool_called_with_param');
      expect(l.params).toBeDefined();
    }
  });

  it('JSON-stringifies params into expectedParams string', () => {
    const [first] = toEvalForgeBody(scenario).assertionLinks;
    expect(first.params?.toolName).toBe('wix_mcp_remote_ReadFullDocsArticle');
    expect(typeof first.params?.expectedParams).toBe('string');
    expect(JSON.parse(String(first.params?.expectedParams))).toEqual({ articleUrl: 'https://dev.wix.com/foo' });
  });

  it('handles assertions with no params (empty object)', () => {
    const noParams: Scenario = { ...scenario, assertions: [{ tool: 't' }] };
    const [l] = toEvalForgeBody(noParams).assertionLinks;
    expect(JSON.parse(String(l.params?.expectedParams))).toEqual({});
  });

  it('maps llm_judge with minimal fields (prompt only)', () => {
    const judge: Scenario = {
      ...scenario,
      assertions: [{ type: 'llm_judge', prompt: 'judge {{output}}' }],
    };
    const [l] = toEvalForgeBody(judge).assertionLinks;
    expect(l).toEqual({
      assertionId: 'system:llm_judge',
      params: { prompt: 'judge {{output}}' },
    });
  });

  it('maps llm_judge with optional fields (only sets the ones provided)', () => {
    const judge: Scenario = {
      ...scenario,
      assertions: [{
        type: 'llm_judge',
        prompt: 'judge {{output}}',
        minScore: 8,
        model: 'claude-3-5-haiku-20241022',
        maxTokens: 2048,
        temperature: 0.2,
      }],
    };
    const [l] = toEvalForgeBody(judge).assertionLinks;
    expect(l).toEqual({
      assertionId: 'system:llm_judge',
      params: {
        prompt: 'judge {{output}}',
        minScore: 8,
        model: 'claude-3-5-haiku-20241022',
        maxTokens: 2048,
        temperature: 0.2,
      },
    });
  });

  it('mixes tool_called_with_param + llm_judge in one scenario', () => {
    const mixed: Scenario = {
      ...scenario,
      assertions: [
        { tool: 'wix_mcp_remote_X', params: { url: 'https://x' } },
        { type: 'llm_judge', prompt: 'judge' },
      ],
    };
    const body = toEvalForgeBody(mixed);
    expect(body.assertionLinks.map(l => l.assertionId)).toEqual([
      'system:tool_called_with_param',
      'system:llm_judge',
    ]);
  });

  it('maps api_call: stringifies object expectedResponse, passes string through', () => {
    const objExpected: Scenario = {
      ...scenario,
      assertions: [{
        type: 'api_call',
        url: 'https://x',
        expectedResponse: { ok: true },
      }],
    };
    const l1 = linkByType(toEvalForgeBody(objExpected).assertionLinks, 'system:api_call');
    expect(l1.params?.expectedResponse).toBe('{"ok":true}');

    const stringExpected: Scenario = {
      ...scenario,
      assertions: [{
        type: 'api_call',
        url: 'https://x',
        expectedResponse: '{"ok":true}',
      }],
    };
    const l2 = linkByType(toEvalForgeBody(stringExpected).assertionLinks, 'system:api_call');
    expect(l2.params?.expectedResponse).toBe('{"ok":true}');
  });

  it('maps api_call: emits all optional fields when set', () => {
    const full: Scenario = {
      ...scenario,
      assertions: [{
        type: 'api_call',
        url: 'https://x',
        method: 'POST',
        requestBody: { k: 'v' },
        expectedResponse: { ok: true },
        requestHeaders: { Authorization: 'Bearer y' },
        timeoutMs: 5000,
        negate: false,
      }],
    };
    const [l] = toEvalForgeBody(full).assertionLinks;
    expect(l).toEqual({
      assertionId: 'system:api_call',
      params: {
        url: 'https://x',
        method: 'POST',
        requestBody: '{"k":"v"}',
        expectedResponse: '{"ok":true}',
        requestHeaders: '{"Authorization":"Bearer y"}',
        timeoutMs: 5000,
        negate: false,
      },
    });
  });

  it('maps cost', () => {
    const c: Scenario = {
      ...scenario,
      assertions: [{ type: 'cost', maxCostUsd: 0.5 }],
    };
    const [l] = toEvalForgeBody(c).assertionLinks;
    expect(l).toEqual({ assertionId: 'system:cost', params: { maxCostUsd: 0.5 } });
  });

  it('maps time_limit', () => {
    const t: Scenario = {
      ...scenario,
      assertions: [{ type: 'time_limit', maxDurationMs: 60_000, negate: true }],
    };
    const [l] = toEvalForgeBody(t).assertionLinks;
    expect(l).toEqual({
      assertionId: 'system:time_limit',
      params: { maxDurationMs: 60_000, negate: true },
    });
  });

  it('emits siteSetup NONE when the scenario has none (explicit clear on update)', () => {
    expect(toEvalForgeBody(scenario).siteSetup).toEqual({ mode: 'NONE' });
  });

  it('maps a template siteSetup to the V1 oneof shape (mode + templateOptions, no bootstrap)', () => {
    const s: Scenario = { ...scenario, siteSetup: { mode: 'template', templateId: 'ecommerce' } };
    expect(toEvalForgeBody(s).siteSetup).toEqual({ mode: 'TEMPLATE', templateOptions: { templateId: 'ecommerce' } });
  });

  it('omits bootstrap when steps is empty (matches EvalForge normalization)', () => {
    const s: Scenario = {
      ...scenario,
      siteSetup: { mode: 'template', templateId: 'ecommerce', bootstrap: { steps: [] } },
    };
    expect(toEvalForgeBody(s).siteSetup).toEqual({ mode: 'TEMPLATE', templateOptions: { templateId: 'ecommerce' } });
  });

  it('maps bootstrap steps through, uppercasing method and dropping undefined optionals', () => {
    const s: Scenario = {
      ...scenario,
      siteSetup: {
        mode: 'template',
        templateId: 'ecommerce',
        bootstrap: { steps: [{ method: 'post', url: 'https://x', body: { a: 1 } }] },
      },
    };
    expect(toEvalForgeBody(s).siteSetup).toEqual({
      mode: 'TEMPLATE',
      templateOptions: { templateId: 'ecommerce' },
      bootstrap: { steps: [{ method: 'POST', url: 'https://x', body: { a: 1 } }] },
    });
  });

  it('maps skill_was_called: JSON-stringifies skillNames and referenceFiles', () => {
    const s: Scenario = {
      ...scenario,
      assertions: [{
        type: 'skill_was_called',
        skillNames: ['wix-app', 'wds-docs'],
        referenceFiles: { 'wix-app': ['SKILL.md'] },
        negate: true,
      }],
    };
    const [l] = toEvalForgeBody(s).assertionLinks;
    expect(l.assertionId).toBe('system:skill_was_called');
    expect(typeof l.params?.skillNames).toBe('string');
    expect(JSON.parse(String(l.params?.skillNames))).toEqual(['wix-app', 'wds-docs']);
    expect(typeof l.params?.referenceFiles).toBe('string');
    expect(JSON.parse(String(l.params?.referenceFiles))).toEqual({ 'wix-app': ['SKILL.md'] });
    expect(l.params?.negate).toBe(true);
  });

  it('maps skill_was_called with only the required field', () => {
    const s: Scenario = {
      ...scenario,
      assertions: [{ type: 'skill_was_called', skillNames: ['wix-app'] }],
    };
    const [l] = toEvalForgeBody(s).assertionLinks;
    expect(l).toEqual({
      assertionId: 'system:skill_was_called',
      params: { skillNames: '["wix-app"]' },
    });
  });

  it('maps build_passed with fields set', () => {
    const s: Scenario = {
      ...scenario,
      assertions: [{
        type: 'build_passed',
        command: 'yarn build',
        expectedExitCode: 0,
        negate: false,
      }],
    };
    const [l] = toEvalForgeBody(s).assertionLinks;
    expect(l).toEqual({
      assertionId: 'system:build_passed',
      params: { command: 'yarn build', expectedExitCode: 0, negate: false },
    });
  });

  it('maps build_passed with no fields to a link with no params', () => {
    const s: Scenario = {
      ...scenario,
      assertions: [{ type: 'build_passed' }],
    };
    const [l] = toEvalForgeBody(s).assertionLinks;
    expect(l).toEqual({ assertionId: 'system:build_passed' });
  });

  it('maps token_count', () => {
    const s: Scenario = {
      ...scenario,
      assertions: [{ type: 'token_count', maxTokens: 4096 }],
    };
    const [l] = toEvalForgeBody(s).assertionLinks;
    expect(l).toEqual({
      assertionId: 'system:token_count',
      params: { maxTokens: 4096 },
    });
  });

  it('maps llm_judge with browserTools, scoringMode, and parameters', () => {
    const s: Scenario = {
      ...scenario,
      assertions: [{
        type: 'llm_judge',
        prompt: 'judge {{output}}',
        scoringMode: 'boolean',
        browserTools: true,
        parameters: [{ name: 'foo', label: 'Foo', type: 'string', required: true }],
      }],
    };
    const [l] = toEvalForgeBody(s).assertionLinks;
    expect(l.params?.scoringMode).toBe('boolean');
    expect(l.params?.browserTools).toBe(true);
    expect(typeof l.params?.parameters).toBe('string');
    expect(JSON.parse(String(l.params?.parameters))).toEqual([
      { name: 'foo', label: 'Foo', type: 'string', required: true },
    ]);
  });
});

// toEvalForgeBody intentionally drops `tags` (handled separately by sync), so the round-trip
// helper reattaches the original scenario's tags onto the wire body before feeding it back in —
// mirroring how the migration will merge EvalForge's JSON with the repo's separately-tracked tags.
function roundTrip(scenario: Scenario): Scenario {
  const body = { ...toEvalForgeBody(scenario), tags: scenario.tags };
  return fromEvalForgeBody(body);
}

describe('fromEvalForgeBody', () => {
  it('round-trips a tool_called_with_param scenario (implicit type, no params key when empty)', () => {
    expect(roundTrip(scenario)).toEqual(scenario);
  });

  it('round-trips tool_called_with_param with no params (omits the params key, not {})', () => {
    const s: Scenario = { ...scenario, assertions: [{ tool: 't' }] };
    expect(roundTrip(s)).toEqual(s);
  });

  it('round-trips llm_judge with all optional fields, parameters parsed back to an array', () => {
    const s: Scenario = {
      ...scenario,
      assertions: [{
        type: 'llm_judge',
        prompt: 'judge {{output}}',
        minScore: 8,
        model: 'claude-3-5-haiku-20241022',
        maxTokens: 2048,
        temperature: 0.2,
        scoringMode: 'boolean',
        browserTools: true,
        parameters: [{ name: 'foo', label: 'Foo', type: 'string', required: true }],
        negate: true,
      }],
    };
    const result = roundTrip(s);
    expect(result).toEqual(s);
    expect(Array.isArray((result.assertions[0] as { parameters?: unknown }).parameters)).toBe(true);
  });

  it('round-trips api_call, expectedResponse/requestBody/requestHeaders parsed back to objects', () => {
    const s: Scenario = {
      ...scenario,
      assertions: [{
        type: 'api_call',
        url: 'https://x',
        method: 'POST',
        requestBody: { k: 'v' },
        expectedResponse: { ok: true },
        requestHeaders: { Authorization: 'Bearer y' },
        timeoutMs: 5000,
        negate: false,
      }],
    };
    const result = roundTrip(s);
    expect(result).toEqual(s);
    const [assertion] = result.assertions as [{ expectedResponse: unknown; requestBody: unknown; requestHeaders: unknown }];
    expect(typeof assertion.expectedResponse).not.toBe('string');
    expect(assertion.expectedResponse).toEqual({ ok: true });
    expect(assertion.requestBody).toEqual({ k: 'v' });
    expect(assertion.requestHeaders).toEqual({ Authorization: 'Bearer y' });
  });

  it('round-trips cost', () => {
    const s: Scenario = { ...scenario, assertions: [{ type: 'cost', maxCostUsd: 0.5, negate: true }] };
    expect(roundTrip(s)).toEqual(s);
  });

  it('round-trips time_limit', () => {
    const s: Scenario = { ...scenario, assertions: [{ type: 'time_limit', maxDurationMs: 60_000, negate: true }] };
    expect(roundTrip(s)).toEqual(s);
  });

  it('round-trips skill_was_called, skillNames/referenceFiles parsed back to array/object', () => {
    const s: Scenario = {
      ...scenario,
      assertions: [{
        type: 'skill_was_called',
        skillNames: ['wix-app', 'wds-docs'],
        referenceFiles: { 'wix-app': ['SKILL.md'] },
        negate: true,
      }],
    };
    const result = roundTrip(s);
    expect(result).toEqual(s);
    const [assertion] = result.assertions as [{ skillNames: unknown; referenceFiles: unknown }];
    expect(Array.isArray(assertion.skillNames)).toBe(true);
    expect(typeof assertion.referenceFiles).toBe('object');
  });

  it('round-trips build_passed with fields set', () => {
    const s: Scenario = {
      ...scenario,
      assertions: [{ type: 'build_passed', command: 'yarn build', expectedExitCode: 0, negate: false }],
    };
    expect(roundTrip(s)).toEqual(s);
  });

  it('round-trips build_passed with no fields', () => {
    const s: Scenario = { ...scenario, assertions: [{ type: 'build_passed' }] };
    expect(roundTrip(s)).toEqual(s);
  });

  it('round-trips token_count', () => {
    const s: Scenario = { ...scenario, assertions: [{ type: 'token_count', maxTokens: 4096, negate: true }] };
    expect(roundTrip(s)).toEqual(s);
  });

  it('round-trips a scenario with no siteSetup: NONE on the wire becomes undefined again', () => {
    expect(scenario.siteSetup).toBeUndefined();
    const result = roundTrip(scenario);
    expect(result.siteSetup).toBeUndefined();
    expect(result).toEqual(scenario);
  });

  it('round-trips a template siteSetup with bootstrap steps (method case round-trips too)', () => {
    const s: Scenario = {
      ...scenario,
      siteSetup: {
        mode: 'template',
        templateId: 'ecommerce',
        bootstrap: { steps: [{ method: 'post', url: 'https://x', body: { a: 1 }, label: 'seed' }] },
      },
    };
    expect(roundTrip(s)).toEqual(s);
  });

  it('round-trips a template siteSetup with no bootstrap', () => {
    const s: Scenario = { ...scenario, siteSetup: { mode: 'template', templateId: 'ecommerce' } };
    expect(roundTrip(s)).toEqual(s);
  });
});
