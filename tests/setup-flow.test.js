'use strict';
// Synthetic end-to-end target transaction. No host, model, trust change or publication.
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {spawnSync}=require('node:child_process');
const {build}=require('../tools/package-release'),flow=require('../tools/setup'),transaction=require('../tools/vscode-integration'),inspection=require('../tools/lib/setup-inspection');
const product=path.resolve(__dirname,'..'),base=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'syn-setup-flow-'))),repo=path.join(base,'source'),hooks=path.join(base,'empty-hooks');
fs.mkdirSync(repo);fs.mkdirSync(hooks);
function put(root,ref,data){const file=path.join(root,ref);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,data);}
function git(args){const r=spawnSync('git',['-C',repo,'-c','core.hooksPath='+hooks,'-c','commit.gpgSign=false',...args],{encoding:'utf8'});assert.equal(r.status,0,r.stderr);}
function snap(root){const out={};function visit(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,e.name);if(e.isDirectory())visit(file);else out[path.relative(root,file).replace(/\\/g,'/')]=fs.readFileSync(file).toString('base64');}}visit(root);return out;}
const now='2026-11-17T10:00:00Z';
const context={format:'synaptic-setup-context-v1',source:'synthetic owner declaration',observedAt:now,profile:'test-profile',permissions:{node:'unknown',hooks:'unknown'}};
const selected={files:true,skill:true,commands:false,capture:true,curation:false,mcp:false};
const deferred={format:'synaptic-setup-intent-v1',selected,decisions:[{capability:'capture',state:'deferred',at:now,reason:'Await permission review.',revisitOn:'permission-change'}]};
function fixture(){const workspace=fs.mkdtempSync(path.join(base,'workspace é [flow] '));put(workspace,'.synaptic/BRAIN.md','---\nschema_version: 1.0\n---\n# Synthetic brain\n');put(workspace,'.synaptic/journal/_current.md','# Resume\nKeep sources offline.\n');put(workspace,'AGENTS.md','# Owner text\r\n');put(workspace,'.vscode/settings.json','{"owner.option":true}\r\n');return workspace;}
let n=0;function test(name,fn){fn();console.log(`ok ${++n} - ${name}`);}
git(['init','--quiet','--initial-branch=main']);git(['config','user.name','Fixture']);git(['config','user.email','fixture@example.invalid']);git(['config','core.autocrlf','false']);
for(const ref of ['tools/vscode-integration.js','tools/package-release.js','tools/lib/publish-new-directory.js','tools/lib/curation-stop.js','tools/lib/core-lib.js','tools/lib/brain-graph.js','tools/lib/setup-policy.js'])put(repo,ref,fs.readFileSync(path.join(product,ref)));
put(repo,'standalone/synaptic/SKILL.md','---\nname: synaptic\nversion: 1.8.0-rc.1\n---\n# Synthetic skill\n');put(repo,'standalone/synaptic/MANIFEST.txt','SKILL.md\n');
for(const ref of ['docs/UPGRADE-v0.3-to-v1.md','docs/UPGRADE-v0.3-to-v1.AGENT.md','tools/migrate.js','tools/check.js'])put(repo,ref,'Synthetic dependency\n');
git(['add','.']);git(['commit','--quiet','-m','fixture: setup target source']);
const packageRoot=path.join(base,'package');build(repo,'HEAD',packageRoot);
let serial=0;const planInput=(workspace,target=deferred,extra={})=>({workspace,harness:'copilot',context,target,package:packageRoot,out:path.join(base,'plan-'+(++serial)),...extra});
const assisted={format:'synaptic-setup-intent-v1',selected:{...selected,capture:false},decisions:[]};
const declined={...assisted,decisions:[{capability:'capture',state:'declined',at:now,reason:'Owner explicitly refuses native capture.'}]};
function legacyInput(workspace,extra={}){return {workspace,harness:'copilot',package:packageRoot,out:path.join(base,'legacy-'+(++serial)),...extra};}
function emulateOlderPlan(out){const ref=path.join(out,'plan.json'),p=JSON.parse(fs.readFileSync(ref,'utf8'));delete p.intentPrecondition;fs.writeFileSync(ref,JSON.stringify(p,null,2)+'\n');}
test('optional context works through public API and CLI without permitting native configuration',()=>{
  const workspace=fixture(),before=snap(workspace),input=planInput(workspace,assisted,{context:undefined});
  flow.prepare(input);assert.deepEqual(snap(workspace),before);transaction.apply(input.out);
  const p=JSON.parse(fs.readFileSync(path.join(input.out,'plan.json'),'utf8'));assert.deepEqual(p.intentPrecondition,{path:'.synaptic/harness/setup/intent-vscode-copilot.json',before:null});
  const record=JSON.parse(fs.readFileSync(path.join(workspace,'.synaptic/harness/setup/intent-vscode-copilot.json'),'utf8'));
  assert.equal(record.observedAt,null);assert.equal(record.profile,null);
  assert.equal(inspection.notify({workspace,harness:'copilot'}).recordState,'recorded');
  assert.throws(()=>flow.prepare(planInput(fixture(),{...deferred,decisions:[]},{context:undefined})),/TARGET_PERMISSIONS/);
  assert.throws(()=>flow.prepare(planInput(fixture(),assisted,{context:null})),/INVALID_SETUP_CONTEXT/);
  const targetFile=path.join(base,'assisted-target.json');fs.writeFileSync(targetFile,JSON.stringify(assisted));
  const cliWorkspace=fixture(),cliBefore=snap(cliWorkspace),out=path.join(base,'cli-without-context');
  const result=spawnSync(process.execPath,[path.join(product,'tools/setup.js'),'prepare','--workspace',cliWorkspace,'--harness','copilot','--package',packageRoot,'--out',out,'--target',targetFile],{encoding:'utf8'});
  assert.equal(result.status,0,result.stderr);assert.equal(JSON.parse(result.stdout).state,'prepared-not-installed');assert.deepEqual(snap(cliWorkspace),cliBefore);
});
test('a native plan cannot apply after a newer refusal even when all its write preimages still match',()=>{
  const workspace=fixture(),baseline=legacyInput(workspace);transaction.prepare(baseline);transaction.apply(baseline.out);
  const native=legacyInput(workspace,{runtime:'node',capture:'counter'});transaction.prepare(native);
  const refuse=planInput(workspace,declined);flow.prepare(refuse);transaction.apply(refuse.out);
  const before=snap(workspace);assert.throws(()=>transaction.apply(native.out),/SETUP_INTENT_CHANGED_SINCE_PREPARE/);
  assert.deepEqual(snap(workspace),before);assert(!fs.existsSync(path.join(workspace,transaction.HOOK)));
  assert.equal(transaction.status(native.out).lastTransaction,'not-applied');
  // A no-write repeat of the already-applied baseline is safe and remains idempotent.
  assert.equal(transaction.apply(baseline.out).state,'applied');assert.deepEqual(snap(workspace),before);
  transaction.rollback(refuse.out);transaction.rollback(baseline.out);
});
test('retained pre-guard legacy plans require replan when rich intent appears, but remain usable when none exists',()=>{
  const workspace=fixture(),baseline=legacyInput(workspace);transaction.prepare(baseline);emulateOlderPlan(baseline.out);transaction.apply(baseline.out);
  const native=legacyInput(workspace,{runtime:'node',capture:'counter'});transaction.prepare(native);emulateOlderPlan(native.out);
  const refuse=planInput(workspace,declined);flow.prepare(refuse);transaction.apply(refuse.out);
  const before=snap(workspace);assert.throws(()=>transaction.apply(native.out),/INTENT_PRECONDITION_MISSING_REQUIRES_REPLAN/);assert.deepEqual(snap(workspace),before);
  assert.equal(transaction.status(native.out).lastTransaction,'not-applied');
  transaction.rollback(refuse.out);transaction.rollback(baseline.out);
});
test('older rich plans derive the intent prerequisite from their own target preimage',()=>{
  const workspace=fixture(),input=planInput(workspace,assisted);flow.prepare(input);emulateOlderPlan(input.out);
  transaction.apply(input.out);assert.equal(inspection.notify({workspace,harness:'copilot',context}).recordState,'recorded');
  transaction.apply(input.out);transaction.rollback(input.out);
});
test('a changed non-refusal intent also invalidates the prepared target before workspace writes',()=>{
  const workspace=fixture(),first=planInput(workspace);flow.prepare(first);transaction.apply(first.out);
  const allowed={...context,permissions:{node:'allowed',hooks:'allowed'}},native=planInput(workspace,{...deferred,decisions:[]},{context:allowed});flow.prepare(native);
  const changed=planInput(workspace,assisted);flow.prepare(changed);transaction.apply(changed.out);
  const before=snap(workspace);assert.throws(()=>transaction.apply(native.out),/SETUP_INTENT_CHANGED_SINCE_PREPARE/);assert.deepEqual(snap(workspace),before);
  transaction.rollback(changed.out);transaction.rollback(first.out);
});
test('mid-apply intent drift remains partial-pending and rollback preserves the new decision',()=>{
  const workspace=fixture(),baseline=legacyInput(workspace);transaction.prepare(baseline);transaction.apply(baseline.out);
  const input=legacyInput(workspace,{runtime:'node',capture:'counter'});transaction.prepare(input);
  const intentRef='.synaptic/harness/setup/intent-vscode-copilot.json',lateDecision=JSON.stringify({format:'synaptic-setup-record-v1',harness:'copilot',profile:null,observedAt:null,intent:declined,configured:{...assisted.selected}})+'\n';
  const rename=fs.renameSync;let injected=false;
  fs.renameSync=function(from,to){const result=rename.apply(this,arguments);if(!injected && to===path.join(workspace,transaction.HOOK)){injected=true;put(workspace,intentRef,lateDecision);}return result;};
  try{assert.throws(()=>transaction.apply(input.out),/SETUP_INTENT_CHANGED_SINCE_PREPARE/);}finally{fs.renameSync=rename;}
  assert(injected);assert.equal(transaction.status(input.out).lastTransaction,'partial-pending');
  transaction.rollback(input.out);assert(!fs.existsSync(path.join(workspace,transaction.HOOK)));assert.equal(fs.readFileSync(path.join(workspace,intentRef),'utf8'),lateDecision);
  transaction.rollback(baseline.out);
});
test('deferred target stages only permitted subset, persists through reviewed apply and stays passively visible',()=>{
  const workspace=fixture(),before=snap(workspace),input=planInput(workspace),result=flow.prepare(input);
  assert.deepEqual(snap(workspace),before);assert.equal(result.target.capture,true);assert.equal(result.configuredSubset.capture,false);
  const plan=JSON.parse(fs.readFileSync(path.join(input.out,'plan.json'),'utf8'));
  assert(!plan.entries.some(e=>e.path===transaction.HOOK));assert(plan.entries.some(e=>e.path.endsWith('intent-vscode-copilot.json')));
  transaction.apply(input.out);
  const applied=snap(workspace),notice=inspection.notify({workspace,harness:'copilot',context});
  assert.equal(notice.notices[0].capability,'capture');assert.equal(notice.notices[0].state,'deferred');assert.deepEqual(snap(workspace),applied);
  assert.equal(fs.readFileSync(path.join(workspace,'.vscode/settings.json'),'utf8'),'{"owner.option":true}\r\n');
  const again=flow.prepare(planInput(workspace));assert.equal(again.changed,0);
  put(workspace,'.synaptic/journal/_current.md','# Newer retained memory\n');transaction.rollback(input.out);
  assert.equal(fs.readFileSync(path.join(workspace,'.synaptic/journal/_current.md'),'utf8'),'# Newer retained memory\n');
  assert(!fs.existsSync(path.join(workspace,'.synaptic/harness/setup/intent-vscode-copilot.json')));
});
test('explicit completion adds permitted native configuration, keeps execution unknown and can restore previous intent',()=>{
  const workspace=fixture(),first=planInput(workspace);flow.prepare(first);transaction.apply(first.out);
  const allowed={...context,permissions:{node:'allowed',hooks:'allowed'}},input=planInput(workspace,{...deferred,decisions:[]},{context:allowed});
  flow.prepare(input);const p=JSON.parse(fs.readFileSync(path.join(input.out,'plan.json'),'utf8'));
  assert(p.entries.some(e=>e.path===transaction.HOOK));assert(p.entries.some(e=>e.path.endsWith('/tools/lib/setup-policy.js')));
  transaction.apply(input.out);transaction.apply(input.out);
  assert.deepEqual(inspection.notify({workspace,harness:'copilot',context:allowed}).notices,[]);
  const report=inspection.inspect({workspace,harness:'copilot',context:allowed});
  assert.equal(report.execution.nativeFiring,'unknown');assert.equal(report.projectConfigured.capture,true);
  assert(!report.configGaps.some(g=>g.capability==='capture'));assert(report.observationGaps.some(g=>g.capability==='capture' && g.claim==='native-firing'));
  assert(!report.nextActions.some(action=>action.includes('request setup completion')));
  const before=snap(workspace);assert.throws(()=>flow.prepare(planInput(workspace,{...deferred,decisions:[]},{context:allowed})),/EXISTING_ADAPTER_REQUIRES_REVIEW/);assert.deepEqual(snap(workspace),before);
  transaction.rollback(input.out);assert.equal(inspection.notify({workspace,harness:'copilot',context}).notices[0].state,'deferred');
});
test('unknown permissions, unsupported targets and files-only choice fail without workspace changes',()=>{
  const workspace=fixture(),before=snap(workspace);
  assert.throws(()=>flow.prepare(planInput(workspace,{...deferred,decisions:[]})),/TARGET_PERMISSIONS/);
  for(const change of [{mcp:true},{commands:true},{skill:false}])assert.throws(()=>flow.prepare(planInput(workspace,{...deferred,selected:{...selected,...change}})),/TARGET_REQUIRES_ANOTHER_ADAPTER/);
  assert.deepEqual(snap(workspace),before);
});
test('scoped declines cannot be reopened by dropping history or borrowing another profile',()=>{
  const workspace=fixture(),target={format:deferred.format,selected:{...selected,capture:false},decisions:[{capability:'capture',state:'declined',at:now,reason:'Owner chose no native hooks.'}]},first=planInput(workspace,target);
  flow.prepare(first);transaction.apply(first.out);const before=snap(workspace),allowed={...context,permissions:{node:'allowed',hooks:'allowed'}};
  assert.deepEqual(inspection.notify({workspace,harness:'copilot',context}).notices,[]);
  assert.throws(()=>flow.prepare(planInput(workspace,{...deferred,decisions:[]},{context:allowed})),/EXPLICIT_DECLINE_REOPEN_REQUIRED/);
  assert.throws(()=>flow.prepare(planInput(workspace,deferred,{context:{...context,profile:'other'}})),/SETUP_INTENT_REVIEW_REQUIRED/);
  assert.deepEqual(snap(workspace),before);
  assert.throws(()=>transaction.prepare({workspace,harness:'copilot',runtime:'node',capture:'counter',package:packageRoot,out:path.join(base,'direct-bypass')}),/RICH_INTENT_REQUIRES_TARGET/);
  const omitted=planInput(workspace,{format:deferred.format,selected:{...selected,capture:false},decisions:[]});flow.prepare(omitted);transaction.apply(omitted.out);
  const saved=JSON.parse(fs.readFileSync(path.join(workspace,'.synaptic/harness/setup/intent-vscode-copilot.json'),'utf8'));
  assert.equal(saved.intent.decisions.find(d=>d.capability==='capture').state,'declined');
  assert.throws(()=>flow.prepare(planInput(workspace,{...deferred,decisions:[]},{context:allowed})),/EXPLICIT_DECLINE_REOPEN_REQUIRED/);
});
test('assisted completion preserves an already-selected Node runtime and historical target changes',()=>{
  const workspace=fixture(),out=path.join(base,'node-assisted');
  transaction.prepare({workspace,harness:'copilot',runtime:'node',package:packageRoot,out});transaction.apply(out);
  const first=planInput(workspace);flow.prepare(first);transaction.apply(first.out);
  const p=JSON.parse(fs.readFileSync(path.join(first.out,'plan.json'),'utf8'));assert.equal(p.selected.runtime,'node');
  const target={format:deferred.format,selected:{...selected,capture:false},decisions:[]},next=planInput(workspace,target);flow.prepare(next);transaction.apply(next.out);
  const record=JSON.parse(fs.readFileSync(path.join(workspace,'.synaptic/harness/setup/intent-vscode-copilot.json'),'utf8'));
  assert.equal(record.history.length,1);assert.equal(record.history[0].intent.selected.capture,true);
});
test('preimage drift rejects approved candidate application and retains owner bytes',()=>{
  const workspace=fixture(),input=planInput(workspace);flow.prepare(input);
  put(workspace,'AGENTS.md','# Owner changed after plan\n');
  // The planned carrier is Copilot; alter a target rather than an unrelated file.
  put(workspace,'.github/copilot-instructions.md','# New owner carrier\n');
  assert.throws(()=>transaction.apply(input.out),/CHANGED|DRIFT/);
  assert.equal(fs.readFileSync(path.join(workspace,'.github/copilot-instructions.md'),'utf8'),'# New owner carrier\n');
});
test('CLI operations are explicit, reject ambiguous flags and never repurpose status',()=>{
  const workspace=fixture(),before=snap(workspace),cli=path.join(product,'tools/setup.js');
  const result=spawnSync(process.execPath,[cli,'inspect','--workspace',workspace,'--harness','copilot'],{encoding:'utf8'});assert.equal(result.status,0,result.stderr);assert.equal(JSON.parse(result.stdout).writesPerformed,0);assert.deepEqual(snap(workspace),before);
  for(const args of [['status'],['inspect','--workspace',workspace,'--harness','copilot','--harness','local']])assert.notEqual(spawnSync(process.execPath,[cli,...args],{encoding:'utf8'}).status,0);
  const recommendation=flow.main(['recommend','--workspace',workspace,'--harness','copilot']);assert(recommendation.observedAt);assert.equal(recommendation.observer,'explicit-read-only-check');assert(recommendation.adapter.revision);
  const future={...context,observedAt:'2099-01-01T00:00:00Z',permissions:{node:'allowed',hooks:'allowed'}};
  const report=inspection.inspect({workspace,harness:'copilot',context:future,now});assert.equal(report.declarationFreshness.state,'future-declaration');assert.equal(report.capabilities.recommended.capture,false);assert.equal(report.progress.capture.permitted,'unknown');
  assert.throws(()=>flow.prepare(planInput(workspace,deferred,{context:future})),/FUTURE_SETUP_DECLARATION/);
});
test('explicit CLI observation documents report applicability without promoting records to host proof or reading sources',()=>{
  const workspace=fixture(),before=snap(workspace),cli=path.join(product,'tools/setup.js');
  const first=spawnSync(process.execPath,[cli,'inspect','--workspace',workspace,'--harness','copilot'],{encoding:'utf8'});assert.equal(first.status,0,first.stderr);
  const initial=JSON.parse(first.stdout);assert.equal(initial.observationInput.state,'not-supplied');assert.deepEqual(initial.recordedObservations,[]);
  const evidence=path.join(base,'observations.json');fs.writeFileSync(evidence,JSON.stringify({format:'synaptic-setup-observations-v1',observations:[
    {claim:'file-access',kind:'file-read',source:'not-followed-or-executed',observedAt:now,context:{fingerprint:initial.fingerprint,workspace:initial.scope.workspace}},
    {claim:'native-firing',kind:'configuration-inspection',source:'not-native-evidence',observedAt:now,context:{fingerprint:initial.fingerprint}}
  ]}));
  for(const operation of ['inspect','recommend']){
    const run=spawnSync(process.execPath,[cli,operation,'--workspace',workspace,'--harness','copilot','--evidence',evidence],{encoding:'utf8'});assert.equal(run.status,0,run.stderr);
    const report=JSON.parse(run.stdout);assert.equal(report.observationInput.state,'supplied');assert.equal(report.recordedObservations[0].state,'applicable');assert.equal(report.recordedObservations[0].assurance,'recorded-not-independently-verified');assert.equal(report.recordedObservations[1].state,'unknown');
    if(operation==='inspect')assert.equal(report.execution.nativeFiring,'unknown');
  }
  const rejected=spawnSync(process.execPath,[cli,'notify','--workspace',workspace,'--harness','copilot','--evidence',evidence],{encoding:'utf8'});assert.notEqual(rejected.status,0);
  assert.deepEqual(snap(workspace),before);
});
test('shipped CORE routes diagnostics and each consolidate passive notice without boot wiring',()=>{
  const skill=fs.readFileSync(path.join(product,'standalone/synaptic/SKILL.md'),'utf8'),consolidate=fs.readFileSync(path.join(product,'standalone/synaptic/references/consolidate.md'),'utf8'),manifest=fs.readFileSync(path.join(product,'standalone/synaptic/MANIFEST.txt'),'utf8');
  assert(skill.includes('references/setup-diagnostics.md'));assert(manifest.includes('templates/templates/setup-adapter.md'));
  assert.match(consolidate,/each.*consolidation/i);assert.match(consolidate,/Do not inspect the machine/);assert.match(skill,/Normal boot observes existing wiring/);
});
console.log(`1..${n}`);
