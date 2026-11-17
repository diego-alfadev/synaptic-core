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
  assert.equal(inspection.inspect({workspace,harness:'copilot',context:allowed}).execution.nativeFiring,'unknown');
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
test('shipped CORE routes diagnostics and each consolidate passive notice without boot wiring',()=>{
  const skill=fs.readFileSync(path.join(product,'standalone/synaptic/SKILL.md'),'utf8'),consolidate=fs.readFileSync(path.join(product,'standalone/synaptic/references/consolidate.md'),'utf8'),manifest=fs.readFileSync(path.join(product,'standalone/synaptic/MANIFEST.txt'),'utf8');
  assert(skill.includes('references/setup-diagnostics.md'));assert(manifest.includes('templates/templates/setup-adapter.md'));
  assert.match(consolidate,/each.*consolidation/i);assert.match(consolidate,/Do not inspect the machine/);assert.match(skill,/Normal boot observes existing wiring/);
});
console.log(`1..${n}`);
