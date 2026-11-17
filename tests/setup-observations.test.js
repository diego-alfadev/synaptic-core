'use strict';
const assert=require('node:assert/strict');
const {decorateObservations}=require('../tools/lib/setup-observations');
const fingerprint='a'.repeat(64),now='2026-11-17T11:00:00Z';
const report={format:'synaptic-setup-report-v1',observedAt:now,scope:{host:'vscode',hostVersion:null,harness:'copilot',harnessVersion:null,profile:'work',session:'s1',workspace:'/synthetic'},configuration:{carriers:[]},coverage:{inspected:[]},adapter:{revision:'fixture'},installation:{state:'unknown'},fingerprint,execution:{loading:'unknown',nativeFiring:'unknown',mcpConnectivity:'unknown'}};
const context={host:'vscode',harness:'copilot',profile:'work',session:'s1',workspace:'/synthetic',adapterVersion:'fixture',fingerprint};
const observed={claim:'loading',kind:'host-observation',source:'synthetic-owner-retained-transcript',observedAt:'2026-11-17T10:00:00Z',context};
const doc=records=>({format:'synaptic-setup-observations-v1',observations:records});
let n=0;function test(name,fn){fn();console.log(`ok ${++n} - ${name}`);}
test('absent observation input remains unknown rather than asserting no observations exist',()=>{
  const result=decorateObservations(report);assert.equal(result.observationInput.state,'not-supplied');assert.deepEqual(result.recordedObservations,[]);assert.equal(result.execution.loading,'unknown');
});
test('matching records expose date and age without authenticating observers or claiming live execution',()=>{
  const before=JSON.stringify({report,observed}),result=decorateObservations(report,doc([observed])),record=result.recordedObservations[0];
  assert.equal(record.state,'applicable');assert.equal(record.ageMs,3600000);assert.equal(record.freshness,'unknown');assert.equal(record.assurance,'recorded-not-independently-verified');assert.equal(result.execution.loading,'unknown');assert.equal(JSON.stringify({report,observed}),before);
});
test('changed identity and fingerprints become historical while unknown profile cannot borrow proof',()=>{
  for(const change of [{profile:'other'},{session:'s2'},{fingerprint:'b'.repeat(64)}])assert.equal(decorateObservations(report,doc([{...observed,context:{...context,...change}}])).recordedObservations[0].state,'historical');
  assert.equal(decorateObservations({...report,scope:{...report.scope,profile:null}},doc([observed])).recordedObservations[0].state,'unknown');
});
test('configuration and manual script records do not pass as native event or MCP observations',()=>{
  for(const claim of ['loading','native-firing','mcp-connectivity'])for(const kind of ['configuration-inspection','file-check','manual-invocation'])assert.equal(decorateObservations(report,doc([{...observed,claim,kind}])).recordedObservations[0].reason,'insufficient-observation-kind');
});
test('expiry is explicit and future records are unknown',()=>{
  assert.equal(decorateObservations(report,{...doc([observed]),maxAgeMs:1}).recordedObservations[0].reason,'expired');
  assert.equal(decorateObservations(report,doc([{...observed,observedAt:'2099-01-01T00:00:00Z'}])).recordedObservations[0].reason,'future-observation');
  const unresolved=decorateObservations({...report,scope:{...report.scope,profile:null}},{...doc([observed]),maxAgeMs:1}).recordedObservations[0];
  assert.equal(unresolved.state,'unknown');assert.equal(unresolved.reason,'identity-unresolved');assert.equal(unresolved.freshness,'stale');assert.equal(unresolved.ageMs,3600000);
});
test('non-execution observations can match a minimal fingerprint without inventing a session identity',()=>{
  const record={...observed,claim:'file-access',kind:'file-read',context:{fingerprint,workspace:'/synthetic'}};
  assert.equal(decorateObservations({...report,scope:{...report.scope,profile:null,session:null}},doc([record])).recordedObservations[0].state,'applicable');
});
test('omitted known execution versions and workspace cannot be discarded to make evidence applicable',()=>{
  const richer={...report,scope:{...report.scope,hostVersion:'1.0',harnessVersion:'2.0'}};
  const oldRecord={...observed,context:{host:'vscode',harness:'copilot',profile:'work',session:'s1',fingerprint}};
  const result=decorateObservations(richer,doc([oldRecord])).recordedObservations[0];
  assert.equal(result.state,'unknown');assert.equal(result.reason,'identity-unresolved');
  for(const key of ['hostVersion','harnessVersion','workspace','adapterVersion'])assert(result.dimensions.includes(key));
  const fileRecord={...observed,claim:'file-access',kind:'file-read',context:{fingerprint}};
  assert.equal(decorateObservations(report,doc([fileRecord])).recordedObservations[0].state,'unknown');
});
test('malformed documents and accessor entries are rejected without executing source data',()=>{
  assert.throws(()=>decorateObservations(report,{...doc([]),run:'do something'}),/INVALID_OBSERVATION_DOCUMENT/);
  assert.throws(()=>decorateObservations(report,doc(Array(129).fill(observed))),/INVALID_OBSERVATION_DOCUMENT/);
  let touched=false;const evil=Object.defineProperty({},'claim',{enumerable:true,get(){touched=true;return 'loading';}});
  assert.equal(decorateObservations(report,doc([evil])).recordedObservations[0].reason,'invalid-evidence');assert.equal(touched,false);
  const ref=decorateObservations(report,doc([{...observed,source:'https://example.invalid/do-not-fetch'}]));assert.equal(ref.recordedObservations[0].source,'https://example.invalid/do-not-fetch');
});
console.log(`1..${n}`);
