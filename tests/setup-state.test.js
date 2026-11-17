'use strict';
const assert = require('node:assert/strict');
const {evaluateEvidence, capabilityProgress} = require('../tools/lib/setup-state');
let count = 0;
function test(name, fn) {fn(); console.log(`ok ${++count} - ${name}`);}
const now = '2026-11-17T10:00:00Z';
const identity = {host: 'vscode', harness: 'copilot', profile: 'work', session: 'session-1', fingerprint: 'a'.repeat(64)};
const current = {claim: 'loading', context: identity};
const observed = {claim: 'loading', kind: 'host-observation', source: 'evidence/session.json', observedAt: '2026-11-17T09:00:00Z', context: {...identity}};
const evaluate = (e = observed, c = current, o = {now}) => evaluateEvidence(e, c, o);

test('matched observations retain a recorded assurance and never invent a freshness policy', () => {
  const result = evaluate();
  assert.equal(result.state, 'applicable');
  assert.equal(result.assurance, 'recorded-not-independently-verified');
  assert.equal(result.freshness, 'unknown');
  assert.equal(result.ageMs, 3600000);
  assert.equal(evaluate(observed, current, {now, maxAgeMs: 3600000}).freshness, 'within-policy');
});
test('configuration, manual adapter invocation and bytes cannot establish host execution', () => {
  for (const claim of ['loading', 'native-firing', 'mcp-connectivity']) {
    for (const kind of ['file-check', 'configuration-inspection', 'manual-invocation']) {
      assert.equal(evaluate({...observed, claim, kind}, {...current, claim}).reason, 'insufficient-observation-kind');
    }
  }
  assert.equal(evaluate({...observed, claim: 'configuration', kind: 'configuration-inspection'}).reason, 'different-claim');
});
test('changed identity remains historical across profiles, sessions, versions and fingerprints', () => {
  for (const key of ['host', 'harness', 'profile', 'session', 'fingerprint']) {
    const value = key === 'fingerprint' ? 'b'.repeat(64) : 'another';
    const result = evaluate(observed, {claim: 'loading', context: {...identity, [key]: value}});
    assert.equal(result.state, 'historical'); assert.deepEqual(result.dimensions, [key]);
  }
  const context = {...identity, hostVersion: '2'};
  const result = evaluate({...observed, context: {...context, hostVersion: '1'}}, {...current, context});
  assert.equal(result.state, 'historical');
});
test('missing or null profile/session cannot act as wildcards or current proof', () => {
  for (const key of ['profile', 'session']) {
    const partial = {...identity}; delete partial[key];
    assert.equal(evaluate({...observed, context: partial}, {claim: 'loading', context: partial}).state, 'unknown');
    assert.equal(evaluate({...observed, context: {...identity, [key]: null}}).reason, 'identity-unresolved');
    assert.equal(evaluate(observed, {claim: 'loading', context: {...identity, [key]: null}}).state, 'unknown');
  }
  assert.equal(evaluate({...observed, context: {...identity, profile: 'other', session: null}}).state, 'historical');
});
test('additional context dimensions must be accounted for rather than silently dropped', () => {
  const result = evaluate(observed, {claim: 'loading', context: {...identity, sourceCommit: 'c'.repeat(40)}});
  assert.equal(result.reason, 'identity-unresolved'); assert.deepEqual(result.dimensions, ['sourceCommit']);
});
test('future, expired, impossible, non-UTC and ambiguous dates never become fresh evidence', () => {
  assert.equal(evaluate({...observed, observedAt: '2026-11-18T00:00:00Z'}).reason, 'future-observation');
  assert.equal(evaluate(observed, current, {now, maxAgeMs: 3599999}).reason, 'expired');
  for (const observedAt of ['2026-02-30T00:00:00Z', '2026-11-17', '2026-11-17T09:00:00+00:00', 'yesterday', 0]) {
    assert.equal(evaluate({...observed, observedAt}).reason, 'invalid-evidence');
  }
  assert.throws(() => evaluate(observed, current, {now, maxAgeMs: -1}), /INVALID_EVIDENCE_OPTIONS/);
  assert.throws(() => evaluate(observed, current, {now: '2026-02-30T00:00:00Z'}), /INVALID_EVIDENCE_OPTIONS/);
});
test('malformed and accessor records are rejected without invoking getters', () => {
  let invoked = false;
  const getter = {...observed}; Object.defineProperty(getter, 'source', {get() {invoked = true; throw Error('getter');}, enumerable: true});
  for (const input of [false, [], {}, Object.create({claim: 'loading'}), {...observed, extra: true}, {...observed, source: 'bad\nsource'}, getter]) {
    assert.equal(evaluate(input).state, 'unknown');
  }
  assert.equal(invoked, false);
  assert.equal(evaluate(null).reason, 'no-evidence');
  assert.equal(evaluate({...observed, context: {...identity, fingerprint: 'not-a-hash'}}).reason, 'invalid-evidence');
  assert.throws(() => evaluate(observed, {...current, claim: '__proto__'}), /INVALID_CURRENT_CONTEXT/);
});
test('file observations need a fingerprint but do not pretend to have session identity', () => {
  const c = {claim: 'file-access', context: {fingerprint: identity.fingerprint}};
  const result = evaluate({...observed, claim: c.claim, kind: 'file-read', context: c.context}, c);
  assert.equal(result.state, 'applicable');
  assert.equal(result.assurance, 'recorded-not-independently-verified');
});
test('interpretation mutates neither historical observations nor current identity', () => {
  const e = JSON.parse(JSON.stringify(observed)), c = JSON.parse(JSON.stringify(current));
  const before = JSON.stringify({e, c}); Object.freeze(e.context); Object.freeze(e); Object.freeze(c.context); Object.freeze(c);
  evaluate(e, c); assert.equal(JSON.stringify({e, c}), before);
});
test('unknown legacy target remains unknown despite configured bytes or successful outcome', () => {
  const result = capabilityProgress({configured: 'yes', lastOutcome: 'succeeded'});
  assert.equal(result.targetState, 'unknown'); assert.equal(result.selected, 'unknown'); assert.equal(result.decision, 'unknown');
});
test('selected target survives failure, deferral, refusal and unavailable support independently', () => {
  const base = {supported: 'yes', permitted: 'yes', selected: 'yes', configured: 'no'};
  for (const decision of ['unknown', 'not-offered', 'deferred', 'accepted']) {
    const result = capabilityProgress({...base, decision, lastOutcome: 'failed'});
    assert.equal(result.targetState, 'outstanding'); assert.equal(result.lastOutcome, 'failed'); assert.equal(result.decision, decision);
  }
  assert.equal(capabilityProgress({...base, decision: 'declined'}).reason, 'selected-target-conflicts-with-decline');
  assert.equal(capabilityProgress({...base, supported: 'no'}).reason, 'unsupported');
  assert.equal(capabilityProgress({...base, permitted: 'no'}).reason, 'not-permitted');
});
test('configured capability can still have failed execution or a policy block', () => {
  const result = capabilityProgress({supported: 'yes', permitted: 'no', selected: 'yes', configured: 'yes', lastOutcome: 'failed'});
  assert.equal(result.targetState, 'configured'); assert.equal(result.permitted, 'no'); assert.equal(result.lastOutcome, 'failed');
  assert.equal(result.execution, 'not-established-by-configuration');
});
test('explicitly excluded target is not an incomplete selected target', () => {
  assert.equal(capabilityProgress({selected: 'no', configured: 'no', decision: 'declined'}).targetState, 'not-selected');
});
test('capability states reject conflated, prototype, inherited and unexpected values', () => {
  for (const input of [null, [], {selected: true}, {configured: 'failed'}, {decision: 'failed'}, {lastOutcome: 'declined'}, {extra: 'yes'}, Object.create({selected: 'yes'})]) {
    assert.throws(() => capabilityProgress(input), /INVALID_CAPABILITY_STATE/);
  }
});
console.log(`1..${count}`);
