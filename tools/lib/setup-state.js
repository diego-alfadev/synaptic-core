'use strict';
// Pure setup record interpretation. No I/O, host probing, proof creation or clock access.
// A result evaluates supplied records; it does not authenticate their observers.
// evaluateEvidence(evidence, current, {now, maxAgeMs?}) uses explicit UTC instants.
// current = {claim, context}; evidence = {claim, kind, source, observedAt, context}.
// Execution observations require a matching host/harness/profile/session/fingerprint.
// Additional identity dimensions, when supplied on either side, must match too.

const CLAIM_KINDS = Object.freeze({
  'installation-integrity': 'file-check',
  configuration: 'configuration-inspection',
  'file-access': 'file-read',
  loading: 'host-observation',
  'native-firing': 'host-observation',
  'mcp-connectivity': 'host-observation',
  'semantic-quality': 'reviewed-output'
});
const EXECUTION = new Set(['loading', 'native-firing', 'mcp-connectivity']);
const CONTEXT_KEYS = ['host', 'hostVersion', 'harness', 'harnessVersion', 'profile',
  'session', 'workspace', 'fingerprint', 'sourceCommit', 'carrierDigest', 'adapterVersion'];
const ASSURANCE = 'recorded-not-independently-verified';
const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
const fail = code => { const e = new TypeError(code); e.code = code; throw e; };

function record(value, allowed) {
  if (!value || typeof value !== 'object' || Array.isArray(value) ||
      ![Object.prototype, null].includes(Object.getPrototypeOf(value))) return false;
  return Reflect.ownKeys(value).every(key => typeof key === 'string' && allowed.includes(key) &&
    own(Object.getOwnPropertyDescriptor(value, key), 'value'));
}
function text(value, max = 256) {
  return typeof value === 'string' && value.length > 0 && value.length <= max &&
    !/[\u0000-\u001f\u007f-\u009f]/.test(value);
}
function instant(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value)) return null;
  const n = Date.parse(value);
  if (!Number.isFinite(n)) return null;
  const canonical = value.includes('.') ? value : value.slice(0, -1) + '.000Z';
  return new Date(n).toISOString() === canonical ? n : null;
}
function context(value) {
  if (!record(value, CONTEXT_KEYS)) return false;
  return Object.keys(value).every(key => {
    const item = value[key];
    if (item === null) return true; // explicitly unresolved is not a wildcard
    if (['fingerprint', 'carrierDigest'].includes(key)) return typeof item === 'string' && /^[a-f0-9]{64}$/.test(item);
    if (key === 'sourceCommit') return typeof item === 'string' && /^[a-f0-9]{40}$/.test(item);
    return text(item, key === 'workspace' ? 4096 : 256);
  });
}
function evaluateEvidence(evidence, current, options) {
  if (!record(current, ['claim', 'context']) || !own(CLAIM_KINDS, current.claim) || !context(current.context)) fail('INVALID_CURRENT_CONTEXT');
  if (!record(options, ['now', 'maxAgeMs']) || instant(options.now) === null ||
      own(options, 'maxAgeMs') && (!Number.isSafeInteger(options.maxAgeMs) || options.maxAgeMs < 0)) fail('INVALID_EVIDENCE_OPTIONS');
  const result = (state, reason, extra = {}) => ({state, reason, assurance: ASSURANCE,
    freshness: 'unknown', ageMs: null, ...extra});
  if (evidence === null || evidence === undefined) return result('unknown', 'no-evidence');
  if (!record(evidence, ['claim', 'kind', 'source', 'observedAt', 'context']) ||
      !own(CLAIM_KINDS, evidence.claim) || !text(evidence.kind) || !text(evidence.source, 1024) ||
      instant(evidence.observedAt) === null || !context(evidence.context)) return result('unknown', 'invalid-evidence');
  if (evidence.claim !== current.claim) return result('unknown', 'different-claim');
  if (evidence.kind !== CLAIM_KINDS[current.claim]) return result('unknown', 'insufficient-observation-kind');
  const ageMs = instant(options.now) - instant(evidence.observedAt);
  if (ageMs < 0) return result('unknown', 'future-observation');
  // Age/freshness and identity applicability are separate axes. Even an
  // unresolved or historical identity can have a deterministically expired date.
  const details = {ageMs, source: evidence.source, observedAt: evidence.observedAt,
    freshness: own(options, 'maxAgeMs') ? ageMs > options.maxAgeMs ? 'stale' : 'within-policy' : 'unknown'};
  const required = EXECUTION.has(current.claim) ? ['host', 'harness', 'profile', 'session', 'fingerprint'] : ['fingerprint'];
  const keys = [...new Set([...required, ...Object.keys(current.context), ...Object.keys(evidence.context)])];
  // Inspect all dimensions before returning: a known mismatch is historical even
  // when another dimension is missing. Missing/null identity never matches itself.
  const mismatched = keys.filter(key => current.context[key] != null && evidence.context[key] != null && current.context[key] !== evidence.context[key]);
  if (mismatched.length) return result('historical', 'identity-changed', {...details, dimensions: mismatched});
  const unresolved = keys.filter(key => current.context[key] == null || evidence.context[key] == null);
  if (unresolved.length) return result('unknown', 'identity-unresolved', {...details, dimensions: unresolved});
  if (own(options, 'maxAgeMs') && ageMs > options.maxAgeMs) return result('historical', 'expired', {...details, freshness: 'stale'});
  return result('applicable', 'matching-recorded-evidence', {...details,
    freshness: own(options, 'maxAgeMs') ? 'within-policy' : 'unknown'});
}

// Selection is intent, configuration is a checked state, decision is offer
// history, and lastOutcome is execution history. None overrides another axis.
// Unknown legacy values stay unknown; this function never selects a target.
function capabilityProgress(input) {
  if (!record(input, ['supported', 'permitted', 'selected', 'configured', 'decision', 'lastOutcome'])) fail('INVALID_CAPABILITY_STATE');
  const tri = ['yes', 'no', 'unknown'];
  const values = {
    supported: input.supported === undefined ? 'unknown' : input.supported,
    permitted: input.permitted === undefined ? 'unknown' : input.permitted,
    selected: input.selected === undefined ? 'unknown' : input.selected,
    configured: input.configured === undefined ? 'unknown' : input.configured,
    decision: input.decision === undefined ? 'unknown' : input.decision,
    lastOutcome: input.lastOutcome === undefined ? 'unknown' : input.lastOutcome
  };
  if (!['supported', 'permitted', 'selected', 'configured'].every(key => tri.includes(values[key])) ||
      !['unknown', 'not-offered', 'deferred', 'declined', 'accepted'].includes(values.decision) ||
      !['unknown', 'not-attempted', 'succeeded', 'failed', 'pending'].includes(values.lastOutcome)) fail('INVALID_CAPABILITY_STATE');
  let targetState, reason;
  if (values.selected === 'unknown') {targetState = 'unknown'; reason = 'target-not-recorded';}
  else if (values.selected === 'no') {targetState = 'not-selected'; reason = 'owner-target-excludes-capability';}
  else if (values.configured === 'yes') {targetState = 'configured'; reason = 'configuration-present-execution-separate';}
  else if (values.supported === 'no') {targetState = 'blocked'; reason = 'unsupported';}
  else if (values.permitted === 'no') {targetState = 'blocked'; reason = 'not-permitted';}
  else if (values.supported === 'unknown' || values.permitted === 'unknown' || values.configured === 'unknown') {
    targetState = 'unknown'; reason = 'capability-or-configuration-unresolved';
  } else {targetState = 'outstanding'; reason = values.decision === 'declined' ? 'selected-target-conflicts-with-decline' : 'selected-not-configured';}
  return {...values, targetState, reason, execution: 'not-established-by-configuration'};
}

module.exports = {evaluateEvidence, capabilityProgress};
