'use strict';
const assert=require('node:assert/strict');
const {validateAdapter,validateAcceptance,verifyPlanTargets}=require('../tools/lib/setup-adapter');
let count=0;
function test(name,fn){fn();console.log(`ok ${++count} - ${name}`);}
function fixture(origin='agent'){
  return {format:'synaptic-setup-adapter-v1',id:'reviewed-copilot',revision:'1.0.0',origin,scope:'project',hosts:[{host:'vscode',harness:'copilot'}],readPaths:['AGENTS.md','.github/copilot-instructions.md'],writePaths:['.github/copilot-instructions.md'],operations:{inspect:'Read the declared carrier only; retain unknown policy.',capabilities:'Declare project instruction support and unknown loading.',plan:'Show exact marker diff and byte-faithful current preimage.',apply:'Apply only the approved plan after rechecking current bytes.',verify:'Compare bytes; do not infer loading.',rollback:'Restore only touched owned targets; stop on newer edits.'},limitations:['No runtime or automatic loading proof.']};
}
const workspace=process.platform==='win32'?'C:\\synthetic\\project':'/synthetic/project';
function receipt(descriptor){return {format:'synaptic-setup-adapter-acceptance-v1',descriptorSha256:validateAdapter(descriptor).descriptorSha256,acceptedBy:'owner',acceptedAt:'2026-11-17T10:00:00Z',workspace};}
test('all origins share contract conformance without receiving write authority',()=>{
  for(const origin of ['official','user','agent']){
    const descriptor=fixture(origin),before=JSON.stringify(descriptor),checked=validateAdapter(descriptor);
    assert.equal(checked.validation,'contract-valid');assert.equal(checked.writesAuthorised,false);assert.match(checked.descriptorSha256,/^[a-f0-9]{64}$/);assert.equal(JSON.stringify(descriptor),before);
  }
});
test('digest is stable across object key and allowlist order and changes with procedure revision',()=>{
  const a=fixture(),b=JSON.parse(JSON.stringify(a));b.readPaths.reverse();
  const reversed=Object.fromEntries(Object.entries(b).reverse());
  assert.equal(validateAdapter(a).descriptorSha256,validateAdapter(reversed).descriptorSha256);
  b.operations.apply+=' Preserve all unrelated content.';
  assert.notEqual(validateAdapter(a).descriptorSha256,validateAdapter(b).descriptorSha256);
});
test('malformed descriptors, unknown operations and accessors fail before code can run',()=>{
  for(const mutate of [d=>{d.supported=true;},d=>{d.id=undefined;},d=>{d.hosts[0].host=undefined;},d=>{d.hosts=Array(1);},d=>{d.operations.execute='run arbitrary code';},d=>{delete d.operations.rollback;},d=>{d.scope='user';},d=>{d.hosts=[];},d=>{d.operations.inspect='';},d=>{d.origin='trusted';},d=>{d.revision='../../new';}]){
    const d=fixture();mutate(d);assert.throws(()=>validateAdapter(d),/INVALID_ADAPTER/);
  }
  let ran=false;const d=fixture();Object.defineProperty(d,'id',{enumerable:true,get(){ran=true;return 'oops';}});
  assert.throws(()=>validateAdapter(d),/INVALID_ADAPTER_DESCRIPTOR/);assert.equal(ran,false);
  const withSymbol=fixture();withSymbol[Symbol('hidden')]=true;assert.throws(()=>validateAdapter(withSymbol),/INVALID_ADAPTER_DESCRIPTOR/);
});
test('allowlists reject traversal, wildcards, absolute, Windows aliases and path collisions',()=>{
  for(const value of ['../AGENTS.md','a/../AGENTS.md','/AGENTS.md','C:/AGENTS.md','a\\AGENTS.md','a//b','a/./b','a/*','a/?','a/aux.txt','a/CON','a/dir.','a/dir ','.git/config','a\u0000b','cafe\u0301.md']){
    const d=fixture();d.writePaths=[value];assert.throws(()=>validateAdapter(d),/INVALID_ADAPTER_PATH/);
  }
  for(const values of [['AGENTS.md','agents.md'],['folder','folder/item.md']]){const d=fixture();d.writePaths=values;assert.throws(()=>validateAdapter(d),/ADAPTER_PATH_COLLISION/);}
  const crossed=fixture();crossed.writePaths=['agents.md'];assert.throws(()=>validateAdapter(crossed),/ADAPTER_PATH_COLLISION/);
});
test('acceptance records exact owner-declared revision and workspace but never approves a plan',()=>{
  const d=fixture(),result=validateAcceptance(d,receipt(d),workspace);
  assert.equal(result.accepted,true);assert.equal(result.acceptance,'owner-declared-local');assert.equal(result.writesAuthorised,false);
  assert.deepEqual(validateAcceptance(d,null,workspace),{accepted:false,reason:'acceptance-not-supplied',descriptorSha256:validateAdapter(d).descriptorSha256,writesAuthorised:false});
  const changed=fixture();changed.operations.plan+=' More files.';assert.throws(()=>validateAcceptance(changed,receipt(d),workspace),/ADAPTER_ACCEPTANCE_REVISION_MISMATCH/);
  assert.throws(()=>validateAcceptance(d,receipt(d),workspace+'-other'),/ADAPTER_ACCEPTANCE_SCOPE_MISMATCH/);
});
test('invalid acceptance never becomes implicit acceptance',()=>{
  const d=fixture();
  for(const mutate of [a=>{a.acceptedBy='agent';},a=>{a.acceptedAt='2026-02-30T10:00:00Z';},a=>{a.acceptedAt='today';},a=>{a.acceptedAt='2026-11-17';},a=>{a.accepted=true;},a=>{delete a.workspace;},a=>{a.workspace='relative';}]){
    const a=receipt(d);mutate(a);assert.throws(()=>validateAcceptance(d,a,workspace),/INVALID_ADAPTER_ACCEPTANCE/);
  }
  assert.throws(()=>validateAcceptance(d,receipt(d),'relative'),/INVALID_ADAPTER_ACCEPTANCE_SCOPE/);
});
test('exact target validation excludes additions and case substitutions without executing a procedure',()=>{
  const d=fixture();assert.deepEqual(verifyPlanTargets(d,['.github/copilot-instructions.md']).targets,['.github/copilot-instructions.md']);
  assert.equal(verifyPlanTargets(d,[]).writesAuthorised,false);
  for(const target of ['AGENTS.md','.github/Copilot-instructions.md','.github/copilot-instructions.md/extra'])assert.throws(()=>verifyPlanTargets(d,[target]),/ADAPTER_PLAN_TARGET_NOT_ALLOWED/);
  assert.throws(()=>verifyPlanTargets(d,['../escape']),/INVALID_ADAPTER_PATH/);
});
console.log(`1..${count}`);
