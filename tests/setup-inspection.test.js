'use strict';
// Synthetic project files only. These tests never launch VS Code, a model or MCP.
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto');
const api=require('../tools/lib/setup-inspection');
const policy=require('../tools/lib/setup-policy');
const base=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'syn-setup-inspection-')));
const now='2026-11-17T10:00:00Z';
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
let count=0;
function test(name,fn){fn();console.log(`ok ${++count} - ${name}`);}
function put(root,ref,value){const file=path.join(root,ref);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,value);}
function fixture(){const root=fs.mkdtempSync(path.join(base,'workspace é [setup] '));put(root,'.synaptic/BRAIN.md','---\nschema_version: 1.0\n---\n# Synthetic brain\n');return root;}
function input(workspace,extra={}){return {workspace,harness:'copilot',now,...extra};}
function snapshot(root){const result={};function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,e.name),ref=path.relative(root,file).replace(/\\/g,'/');if(e.isSymbolicLink())result[ref]='link:'+fs.readlinkSync(file);else if(e.isDirectory()){result[ref]='/';walk(file);}else result[ref]=fs.readFileSync(file).toString('base64');}}walk(root);return result;}
function context(extra={}){return {format:'synaptic-setup-context-v1',source:'synthetic declared profile',observedAt:now,profile:'work',session:'session-a',permissions:{node:'allowed',hooks:'allowed'},...extra};}
const selected={files:true,skill:true,commands:false,capture:true,curation:false,mcp:false};
function intent(extra={}){return {format:'synaptic-setup-intent-v1',selected:{...selected},decisions:[{capability:'capture',state:'deferred',at:now,reason:'Await permission review.',revisitOn:'permission-change'}],...extra};}
function setupRecord(root,{profile=null,configured={files:true,skill:true,commands:false,capture:false,curation:false,mcp:false},value=intent()}={}){
  put(root,'.synaptic/harness/setup/intent-vscode-copilot.json',JSON.stringify({format:'synaptic-setup-record-v1',harness:'copilot',profile,intent:value,configured,observedAt:now}));
}
function skill(root,extra={}){
  const prefix='.github/skills/synaptic/',data={'SKILL.md':'---\nname: synaptic\nversion: 1.8.0\n---\n# Synthetic skill\n',...extra};
  data['MANIFEST.txt']=Object.keys(data).join('\n')+'\n';
  for(const [ref,value] of Object.entries(data))put(root,prefix+ref,value);
  put(root,prefix+'SOURCE.json',JSON.stringify({format:'synaptic-skill-source-v1',source:{repository:'https://github.com/diego-alfadev/synaptic-core',commit:'a'.repeat(40)},engineVersion:'1.8.0',files:Object.entries(data).map(([ref,value])=>({path:ref,bytes:Buffer.byteLength(value),sha256:sha(Buffer.from(value))}))}));
}

test('inspection without a retained plan reports bounded coverage and leaves all bytes unchanged',()=>{
  const root=fixture();put(root,'AGENTS.md','# Owner rules\r\n<!-- BEGIN:SYNAPTIC -->\r\nBrain: `.synaptic/BRAIN.md`\r\n<!-- END:SYNAPTIC -->\r\n');
  put(root,'.vscode/settings.json','{"owner.option":true}\n');
  const before=snapshot(root),report=api.inspect(input(root));
  assert.deepEqual(snapshot(root),before);assert.equal(report.writesPerformed,0);
  assert.equal(report.baseline.files,'readable');assert.equal(report.baseline.bridge,'scope-safe-candidate');assert.equal(report.baseline.effective,'unknown');
  assert.equal(report.intent.state,'absent');assert.equal(report.observer,'explicit-read-only-check');
});
test('configuration and legacy proof text never manufacture actual loading, firing or connectivity',()=>{
  const root=fixture();
  put(root,'.github/hooks/synaptic-vscode.json','{"version":1,"hooks":{"agentStop":[{"type":"command","command":"fixture-command"}]}}');
  put(root,'.vscode/mcp.json','{"servers":{"example":{"command":"fixture-command"}}}');
  put(root,'.synaptic/harness/setup/vscode-copilot.md','proof: proven\nproof_date: 2026-11-17\n');
  const report=api.inspect(input(root,{context:context()}));
  assert.equal(report.configuration.capture,'project-registration-present');assert.equal(report.configuration.mcp,'project-config-present');
  assert.equal(report.execution.loading,'unknown');assert.equal(report.execution.nativeFiring,'unknown');assert.equal(report.execution.mcpConnectivity,'unknown');
  assert.equal(report.scope.profile,'work');assert.equal(report.scope.session,'session-a');
});
test('empty or unrelated hook JSON does not establish a native event registration',()=>{
  const root=fixture();
  for(const value of [{},{version:1,hooks:{agentStop:[]}},{version:1,hooks:{otherEvent:[{}]}},null,[]]){
    put(root,'.github/hooks/synaptic-vscode.json',JSON.stringify(value));
    assert.equal(api.inspect(input(root)).configuration.capture,'unknown');
  }
});
test('JSON null or an array cannot stand in for an MCP configuration object',()=>{
  const root=fixture();
  for(const value of [null,[],false,1,'configuration']){
    put(root,'.vscode/mcp.json',JSON.stringify(value));
    assert.equal(api.inspect(input(root)).configuration.mcp,'unknown');
  }
});
test('project-only report excludes user and policy roots rather than claiming computer-wide activation',()=>{
  const root=fixture(),report=api.inspect(input(root));
  assert.equal(report.coverage.computerWide,false);
  for(const exclusion of ['user configuration','policy configuration','other profiles','other hosts','credential/auth files'])assert(report.coverage.excluded.includes(exclusion));
  assert.equal(report.configuration.effective,'unknown');assert.equal(report.scope.profile,null);assert.equal(report.scope.session,null);
  assert.equal(report.scope.identitySource,'not-supplied');
});
test('fingerprint stays stable across check timestamps and changes when inspected configuration changes',()=>{
  const root=fixture(),first=api.inspect(input(root)),again=api.inspect(input(root,{now:'2026-11-18T10:00:00Z'}));
  assert.equal(first.fingerprint,again.fingerprint);
  put(root,'.vscode/settings.json','{"owner.option":true}');
  assert.notEqual(api.inspect(input(root)).fingerprint,first.fingerprint);
});
test('malformed JSON and invalid UTF8 become explicit unknowns without suppressing other sources',()=>{
  const root=fixture();put(root,'.vscode/settings.json','{"broken":');put(root,'.vscode/mcp.json',Buffer.from([0xff,0xfe,0x80]));
  const before=snapshot(root),report=api.inspect(input(root));
  const settings=report.coverage.inspected.find(x=>x.path==='.vscode/settings.json'),mcp=report.coverage.inspected.find(x=>x.path==='.vscode/mcp.json');
  assert.equal(settings.state,'unknown');assert.equal(settings.reason,'JSON_OR_JSONC_NOT_PARSED');
  assert.equal(mcp.state,'unknown');assert.equal(mcp.reason,'INVALID_UTF8');assert.equal(report.baseline.files,'readable');
  assert.deepEqual(snapshot(root),before);
});
test('missing and non-file brain targets remain unknown rather than successful or empty',()=>{
  const missing=fixture();fs.renameSync(path.join(missing,'.synaptic/BRAIN.md'),path.join(missing,'.synaptic/retained.md'));
  assert.equal(api.inspect(input(missing)).baseline.files,'unknown');
  const unreadable=fixture();fs.renameSync(path.join(unreadable,'.synaptic/BRAIN.md'),path.join(unreadable,'.synaptic/retained.md'));fs.mkdirSync(path.join(unreadable,'.synaptic/BRAIN.md'));
  const report=api.inspect(input(unreadable)),entry=report.coverage.inspected.find(x=>x.path==='.synaptic/BRAIN.md');
  assert.equal(entry.state,'unknown');assert.equal(report.baseline.files,'unknown');
});
test('a non-file selected skill entry is an unresolved configuration gap rather than a confirmed absence',()=>{
  const root=fixture();setupRecord(root);fs.mkdirSync(path.join(root,'.github/skills/synaptic/SKILL.md'),{recursive:true});
  const report=api.inspect(input(root));
  assert.equal(report.progress.skill.configured,'unknown');
  assert(report.gaps.some(x=>x.capability==='skill' && x.state==='needs-checking'));
});
test('a symlinked configuration directory is not followed or modified',()=>{
  const root=fixture(),outside=fs.mkdtempSync(path.join(base,'outside-'));
  put(outside,'settings.json','{"private":"sentinel"}');
  fs.symlinkSync(outside,path.join(root,'.vscode'),process.platform==='win32'?'junction':'dir');
  const before=snapshot(root),outsideBefore=snapshot(outside),report=api.inspect(input(root));
  const entry=report.coverage.inspected.find(x=>x.path==='.vscode/settings.json');
  assert.equal(entry.state,'unknown');assert.equal(entry.reason,'SYMLINK_NOT_INSPECTED');
  assert.deepEqual(snapshot(root),before);assert.deepEqual(snapshot(outside),outsideBefore);
});
test('a version-labelled skill without source receipt remains provenance unknown',()=>{
  const root=fixture();put(root,'.github/skills/synaptic/SKILL.md','---\nversion: 1.8.0\n---\n');
  const report=api.inspect(input(root));assert.equal(report.installation.state,'unknown');assert.equal(report.installation.provenance,'not-authenticated');
  assert.equal(report.execution.loading,'unknown');
});
test('self-consistent installed receipt proves content consistency only, never trusted origin or activation',()=>{
  const root=fixture();skill(root);const before=snapshot(root),report=api.inspect(input(root));
  assert.equal(report.installation.state,'content-verified-receipt');assert.equal(report.installation.provenance,'self-consistency-only');
  assert.equal(report.installation.engine,'1.8.0');assert.equal(report.execution.loading,'unknown');assert.deepEqual(snapshot(root),before);
  put(root,'.github/skills/synaptic/SKILL.md','changed after receipt');
  assert.equal(api.inspect(input(root)).installation.state,'failed');
});
test('invalid source receipt is a diagnosed integrity failure with no acquisition or repair',()=>{
  const root=fixture();put(root,'.github/skills/synaptic/SOURCE.json','{"broken":true}');
  const before=snapshot(root),report=api.inspect(input(root));
  assert.equal(report.installation.state,'failed');assert.equal(report.installation.reason,'INSTALLED_SKILL_CONTENT_CHECK_FAILED');assert.deepEqual(snapshot(root),before);
});
test('unexpected credential-like files are inventoried by name without opening their contents',()=>{
  const root=fixture();skill(root);
  const ref='.github/skills/synaptic/auth.json',secretFile=path.join(root,ref);
  put(root,ref,Buffer.from([0xff,0xfe,0x80,0x81]));
  const before=snapshot(root),originalOpen=fs.openSync,originalRead=fs.readFileSync;
  let attempts=0,report;
  const rejectSecret=file=>{if(typeof file==='string' && path.resolve(file)===secretFile){attempts++;throw Error('UNEXPECTED_SECRET_CONTENT_READ');}};
  try{
    fs.openSync=function(file,...args){rejectSecret(file);return originalOpen.call(fs,file,...args);};
    fs.readFileSync=function(file,...args){rejectSecret(file);return originalRead.call(fs,file,...args);};
    report=api.inspect(input(root));
  }finally{fs.openSync=originalOpen;fs.readFileSync=originalRead;}
  assert.equal(attempts,0,'Inspection must not read an unexpected file merely because it is under the skill directory.');
  const entry=report.coverage.inspected.find(x=>x.path===ref);
  assert(entry,'Unexpected path must remain visible in coverage.');
  assert(['inventoried-not-read','unexpected-file'].includes(entry.state));
  assert.equal(entry.sha256,undefined);assert.notEqual(report.installation.state,'content-verified-receipt');
  assert.deepEqual(snapshot(root),before);
});
test('an unauthenticated receipt cannot authorise reading a credential-like file it lists',()=>{
  const root=fixture();skill(root,{'auth.json':Buffer.from([0xff,0x80,0x81])});
  const ref='.github/skills/synaptic/auth.json',secretFile=path.join(root,ref);
  const before=snapshot(root),originalOpen=fs.openSync,originalRead=fs.readFileSync;
  let attempts=0,report;
  const rejectSecret=file=>{if(typeof file==='string' && path.resolve(file)===secretFile){attempts++;throw Error('UNEXPECTED_SECRET_CONTENT_READ');}};
  try{
    fs.openSync=function(file,...args){rejectSecret(file);return originalOpen.call(fs,file,...args);};
    fs.readFileSync=function(file,...args){rejectSecret(file);return originalRead.call(fs,file,...args);};
    report=api.inspect(input(root));
  }finally{fs.openSync=originalOpen;fs.readFileSync=originalRead;}
  assert.equal(attempts,0);assert.notEqual(report.installation.state,'content-verified-receipt');
  const entry=report.coverage.inspected.find(x=>x.path===ref);
  assert(entry);assert(['inventoried-not-read','unexpected-file'].includes(entry.state));assert.equal(entry.sha256,undefined);
  assert.deepEqual(snapshot(root),before);
});
test('different corrupt bytes in an allowed non-entry skill file change the inspection fingerprint',()=>{
  const root=fixture();skill(root,{'references/fixture.md':'# Retained synthetic reference\n'});
  const initial=api.inspect(input(root));assert.equal(initial.installation.state,'content-verified-receipt');
  put(root,'.github/skills/synaptic/references/fixture.md',Buffer.from([0xff,0x80]));
  const first=api.inspect(input(root));assert.notEqual(first.fingerprint,initial.fingerprint);assert.notEqual(first.installation.state,'content-verified-receipt');
  put(root,'.github/skills/synaptic/references/fixture.md',Buffer.from([0xff,0x81]));
  const second=api.inspect(input(root));assert.notEqual(second.fingerprint,first.fingerprint);
  assert.equal(second.coverage.inspected.find(x=>x.path==='.github/skills/synaptic/references/fixture.md').reason,'INVALID_UTF8');
});
test('deep empty skill directories terminate within the disclosed inventory bound',()=>{
  const root=fixture();skill(root);
  fs.mkdirSync(path.join(root,'.github/skills/synaptic',...Array(18).fill('d')),{recursive:true});
  const before=snapshot(root),report=api.inspect(input(root));
  assert.notEqual(report.installation.state,'content-verified-receipt');
  assert(report.coverage.inspected.some(x=>x.reason==='INVENTORY_LIMIT'));
  assert(report.coverage.additionalChecks.some(x=>x.coverage==='verification-incomplete'));
  assert(report.coverage.inspected.length<600);assert.deepEqual(snapshot(root),before);
});
test('profile-bound record is historical in a different or unresolved profile',()=>{
  const root=fixture();setupRecord(root,{profile:'work'});
  for(const ctx of [{},context({profile:'personal'})]){
    const report=api.inspect(input(root,{context:ctx}));
    assert.equal(report.intent.state,'historical');assert.equal(report.intent.reason,'profile-unresolved-or-mismatched');assert.deepEqual(report.gaps,[]);
    assert.deepEqual(api.notify(input(root,{context:ctx})).notices,[]);
  }
  assert.equal(api.inspect(input(root,{context:context()})).intent.state,'recorded');
});
test('project-harness record can describe target gaps without claiming a profile binding',()=>{
  const root=fixture();setupRecord(root);const report=api.inspect(input(root));
  assert.equal(report.intent.state,'recorded');assert.equal(report.intent.scope,'project-harness');
  assert(report.gaps.some(x=>x.capability==='capture' && x.state==='needs-checking'));
  assert.equal(report.execution.nativeFiring,'unknown');
});
test('passive notices repeat selected deferred gaps on each call without inspecting configuration or writing',()=>{
  const root=fixture();setupRecord(root);put(root,'.vscode/settings.json',Buffer.from([0xff]));
  const before=snapshot(root),first=api.notify(input(root)),second=api.notify(input(root));
  assert.deepEqual(first,second);assert.equal(first.mode,'passive');assert.equal(first.writesPerformed,0);assert.equal(first.notices.length,1);
  assert.equal(first.notices[0].capability,'capture');assert.equal(first.notices[0].state,'deferred');assert(first.basis.includes('Recorded setup snapshot only'));
  assert.deepEqual(snapshot(root),before);
});
test('explicit declines are suppressed and deferred configuration remains separate from target',()=>{
  const value=intent({selected:{...selected,mcp:false},decisions:[...intent().decisions,{capability:'mcp',state:'declined',at:now,reason:'No connection wanted.'}]});
  assert.equal(policy.configuredTarget(value).capture,false);assert.equal(value.selected.capture,true);
  assert.deepEqual(policy.passiveNotices(value,{files:true,skill:true,commands:false,capture:false,curation:false,mcp:false}).map(x=>x.capability),['capture']);
  assert.throws(()=>policy.validateIntent({...value,selected:{...value.selected,mcp:true}}),/DECLINED_TARGET_CONFLICT/);
});
test('malformed intent snapshots are unknown, not inferred refusals or empty successful targets',()=>{
  const root=fixture();put(root,'.synaptic/harness/setup/intent-vscode-copilot.json','{"format":"synaptic-setup-record-v1","harness":"copilot","profile":null,"intent":{}}');
  const report=api.inspect(input(root));assert.equal(report.intent.state,'unknown');assert.deepEqual(api.notify(input(root)).notices,[]);
});
test('recommendation aims at strongest implemented permitted configuration without assuming missing permissions',()=>{
  const root=fixture(),allowed=api.inspect(input(root,{context:context()})).capabilities;
  assert.equal(allowed.recommended.capture,true);assert.equal(allowed.recommended.curation,true);assert.equal(allowed.recommended.mcp,false);
  const unknown=api.inspect(input(root)).capabilities;assert.equal(unknown.recommended.capture,false);assert(unknown.conditional.includes('capture'));
  const denied=api.inspect(input(root,{context:context({permissions:{node:'allowed',hooks:'denied'}})})).capabilities;assert.equal(denied.recommended.capture,false);assert.deepEqual(denied.conditional,[]);
  const local=api.inspect(input(root,{harness:'local',context:context()})).capabilities;assert.equal(local.adapterMaximum.capture,false);assert.equal(local.recommended.capture,false);
});
test('boot and consolidation can never trigger an offer even with changed capabilities or explicit reopen flag',()=>{
  const declined={state:'declined'};
  for(const type of ['boot','consolidate'])for(const decision of [null,declined,{state:'deferred'}]){
    const result=policy.offerEligibility(decision,{type,relevantChange:true,reopenDecline:true});assert.equal(result.eligible,false);assert.equal(result.reason,'passive-only');
  }
});
test('declines reopen only by explicit request, not engine or permission changes',()=>{
  for(const type of ['upgrade-review','adapter-change','permission-change'])assert.equal(policy.offerEligibility({state:'declined'},{type,relevantChange:true,reopenDecline:true}).eligible,false);
  assert.equal(policy.offerEligibility({state:'declined'},{type:'explicit-request'}).eligible,false);
  assert.equal(policy.offerEligibility({state:'declined'},{type:'explicit-request',reopenDecline:true}).eligible,true);
});
test('relevant reviews are bounded and deferred requests wait for their recorded revisit event',()=>{
  const deferred={state:'deferred',revisitOn:'permission-change'};
  assert.equal(policy.offerEligibility(null,{type:'upgrade-review'}).eligible,false);
  assert.equal(policy.offerEligibility(null,{type:'upgrade-review',relevantChange:true,alreadyOffered:true}).eligible,false);
  assert.equal(policy.offerEligibility(null,{type:'adapter-change',relevantChange:true}).eligible,true);
  assert.equal(policy.offerEligibility(deferred,{type:'adapter-change',relevantChange:true}).reason,'waiting-for-revisit-event');
  assert.equal(policy.offerEligibility(deferred,{type:'permission-change',relevantChange:true}).eligible,true);
  assert.equal(policy.offerEligibility(deferred,{type:'explicit-request'}).eligible,true);
});
test('invalid declared context dates and unsupported harness do not widen inspection',()=>{
  const root=fixture(),before=snapshot(root);
  assert.throws(()=>api.inspect(input(root,{harness:'guessed-host'})),/DECLARED_HARNESS_REQUIRED/);
  assert.throws(()=>api.inspect(input(root,{context:context({observedAt:'2026-02-30T00:00:00Z'})})),/INVALID_SETUP_CONTEXT/);
  assert.throws(()=>policy.validateContext(null),/INVALID_SETUP_CONTEXT/);
  for(const invalid of ['2026-02-30T00:00:00Z','2026-11-17','2026-11-17T10:00:00+00:00'])assert.throws(()=>api.inspect(input(root,{now:invalid})),/INVALID_CHECK_TIME/);
  assert.throws(()=>policy.offerEligibility(null,{type:'session-start'}),/INVALID_SETUP_EVENT/);
  assert.deepEqual(snapshot(root),before);
});
console.log(`1..${count}`);
