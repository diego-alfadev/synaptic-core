'use strict';
const {copyFixtureTree}=require('./lib/fixture-copy');
// Synthetic filesystem/transport tests. No VS Code process or live model is invoked.
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {spawnSync}=require('node:child_process');
const {build,verifySkill}=require('../tools/package-release');
const api=require('../tools/vscode-integration');
const {sha}=require('../tools/lib/curation-stop');
const base=fs.mkdtempSync(path.join(os.tmpdir(),'syn-vscode-'));
const repo=path.join(base,'source'),hooks=path.join(base,'empty-hooks');fs.mkdirSync(repo);fs.mkdirSync(hooks);
const product=path.resolve(__dirname,'..');
function git(args){const r=spawnSync('git',['-C',repo,'-c','core.hooksPath='+hooks,'-c','commit.gpgSign=false','-c','tag.gpgSign=false',...args],{encoding:'utf8'});assert.equal(r.status,0,r.stderr);return r.stdout.trim();}
function write(root,ref,value){const f=path.join(root,ref);fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,value);}
function snapshot(root){const out={};function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const f=path.join(dir,e.name);if(e.isDirectory())walk(f);else if(e.isFile())out[path.relative(root,f).replace(/\\/g,'/')]=fs.readFileSync(f).toString('base64');}}walk(root);return out;}
let count=0;function test(name,fn){fn();console.log(`ok ${++count} - ${name}`);}
let packageRoot;
function fixture(extra={}){
  const workspace=fs.mkdtempSync(path.join(base,'workspace é [notes] '));
  write(workspace,'.synaptic/BRAIN.md','---\nschema_version: 1.0\n---\n# Existing brain\n');
  write(workspace,'.synaptic/journal/_current.md','# Resume\nDecision: retain the synthetic archive offline. Next: test restore.\n');
  write(workspace,'.synaptic/knowledge/INDEX.md','[[archive]]\n');
  write(workspace,'.synaptic/knowledge/archive.md','# Archive\nExisting knowledge must survive.\n');
  write(workspace,'.synaptic/harness/guardrails.md','# Guardrails\nOwner approval still applies.\n');
  write(workspace,'AGENTS.md','# User rules\r\nKeep all user-authored text.\r\n');
  const out=path.join(base,'plan-'+Math.random().toString(16).slice(2));
  const input={workspace,package:packageRoot,out,harness:'copilot',...extra};
  return {workspace,input,out,brain:path.join(workspace,'.synaptic')};
}
function plan(f){return JSON.parse(fs.readFileSync(path.join(f.out,'plan.json'),'utf8'));}
function copilot(f,timestamp=1794010000000,active=false,session='synthetic-session'){return {sessionId:session,timestamp,cwd:f.workspace,transcriptPath:'PRIVATE_TRANSCRIPT_MUST_NOT_PERSIST',stopReason:'end_turn',stop_hook_active:active,untrustedPrompt:'RAW_INPUT_SENTINEL_NOT_RETAINED'};}
function nativeInput(f){return {workspace:f.workspace,capture:'counter',curation:'native'};}
function complete(f,result){
  const id=result.status.requestId,dir=`playgrounds/curation/${id}`;
  const q=JSON.parse(fs.readFileSync(path.join(f.brain,dir,'request.json'),'utf8'));
  const artifact=['# Curation result',`Request: ${id}`,'','## Curated notes',
    'The saved decision keeps the synthetic archive offline. The next action is to test restore; this fixture does not claim that restoration passed.',
    '','## Provenance',...q.sources.map(s=>`- [${s.ref}](${s.link}) ${s.ref} sha256:${s.sha256}`),'','## Limitations',
    'This is a hand-authored fixture for structural checks. Native event firing and semantic model quality remain unproven.',''].join('\n');
  write(f.brain,q.artifactRef,artifact);
  write(f.brain,q.receiptRef,JSON.stringify({requestId:id,artifactKind:'curated-draft',promotionState:'not_promoted',sourceHashes:q.sources.map(s=>({ref:s.ref,sha256:s.sha256})),artifactSha256:sha(Buffer.from(artifact)),outcome:'curated-draft'}));
}
try{
  git(['init','--quiet','--initial-branch=main']);git(['config','user.name','Fixture']);git(['config','user.email','fixture@example.invalid']);git(['config','core.autocrlf','false']);
  const sources=['tools/vscode-integration.js','tools/package-release.js','tools/lib/publish-new-directory.js','tools/lib/curation-stop.js','tools/lib/core-lib.js','tools/lib/brain-graph.js'];
  for(const ref of sources)write(repo,ref,fs.readFileSync(path.join(product,ref)));
  write(repo,'standalone/synaptic/SKILL.md','---\nname: synaptic\nversion: 1.6.0\n---\n# Synthetic skill\n');
  write(repo,'standalone/synaptic/MANIFEST.txt','SKILL.md\nreferences/vscode.md\n');
  write(repo,'standalone/synaptic/references/vscode.md','# Synthetic file-only guide\n');
  for(const ref of ['docs/UPGRADE-v0.3-to-v1.md','docs/UPGRADE-v0.3-to-v1.AGENT.md','tools/migrate.js','tools/check.js'])write(repo,ref,'Fixture migration dependency\n');
  git(['add','.']);git(['commit','--quiet','-m','fixture: immutable VS Code package']);
  packageRoot=path.join(base,'package');build(repo,'HEAD',packageRoot);
  test('default no-Node/no-MCP assisted preparation changes no active workspace bytes',()=>{
    const f=fixture(),before=snapshot(f.workspace),result=api.prepare(f.input),p=plan(f);
    assert.equal(result.state,'prepared-not-installed');assert.deepEqual(snapshot(f.workspace),before);
    assert.equal(p.selected.runtime,'none');assert.equal(p.selected.mcp,'not-enabled');assert.equal(p.selected.curation,'assisted');
    assert(p.entries.some(e=>e.path==='.github/skills/synaptic/SKILL.md'));assert(!p.entries.some(e=>e.path===api.HOOK || e.path.includes('mcp.json')));
    assert.equal(api.status(f.out).loading,'needs-fresh-session-proof');
  });
  test('missing or unsupported brain schema requires review before staging or applying',()=>{
    for(const brainText of [null,'# Pre-schema brain\n','---\nschema_version: 0.3\n---\n','---\nschema_version: 2.0\n---\n']){
      const f=fixture();if(brainText===null)fs.unlinkSync(path.join(f.brain,'BRAIN.md'));else write(f.brain,'BRAIN.md',brainText);
      const before=snapshot(f.workspace);assert.throws(()=>api.prepare(f.input),/DOCUMENT_UNAVAILABLE|UNSUPPORTED_BRAIN_SCHEMA_REQUIRES_REVIEW/);
      assert(!fs.existsSync(f.out));assert.deepEqual(snapshot(f.workspace),before);
    }
    const f=fixture();api.prepare(f.input);write(f.brain,'BRAIN.md','---\nschema_version: 2.0\n---\n');
    const before=snapshot(f.workspace);assert.throws(()=>api.apply(f.out),/UNSUPPORTED_BRAIN_SCHEMA_REQUIRES_REVIEW/);assert.deepEqual(snapshot(f.workspace),before);
  });
  test('explicit apply preserves user text/CRLF and knowledge; status never invents loading proof',()=>{
    const f=fixture({carrier:'agents'}),before=snapshot(f.brain),original=fs.readFileSync(path.join(f.workspace,'AGENTS.md'),'utf8');
    api.prepare(f.input);const result=api.apply(f.out);assert.equal(result.state,'applied');
    const text=fs.readFileSync(path.join(f.workspace,'AGENTS.md'),'utf8');assert(text.startsWith(original));assert(text.includes(api.START+'\r\n'));
    assert.equal(verifySkill(path.join(f.workspace,'.github/skills/synaptic')).status,'content-verified');
    for(const [ref,value] of Object.entries(before))assert.equal(snapshot(f.brain)[ref],value);
    const observed=api.status(f.out);assert.equal(observed.files,'candidate-files-present');assert.equal(observed.mcp,'not-enabled');assert.equal(observed.nativeTrigger,'not-proven-by-status');
    assert.equal(api.apply(f.out).repeated,false);
  });
  test('rollback restores touched preimages while preserving newer knowledge and unrelated files',()=>{
    const f=fixture({carrier:'agents'}),original=fs.readFileSync(path.join(f.workspace,'AGENTS.md'));
    api.prepare(f.input);api.apply(f.out);write(f.workspace,'.synaptic/knowledge/new.md','# New knowledge\n');write(f.workspace,'my-file.txt','New unrelated work');
    assert.equal(api.rollback(f.out).state,'restored');assert.deepEqual(fs.readFileSync(path.join(f.workspace,'AGENTS.md')),original);
    assert.equal(fs.readFileSync(path.join(f.workspace,'.synaptic/knowledge/new.md'),'utf8'),'# New knowledge\n');assert(fs.existsSync(path.join(f.workspace,'my-file.txt')));
    assert(!fs.existsSync(path.join(f.workspace,'.github/skills/synaptic/SKILL.md')));assert.equal(api.rollback(f.out).restored,0);
  });
  test('full preflight refuses a post-plan target edit before any live write',()=>{
    const f=fixture({carrier:'agents'});api.prepare(f.input);write(f.workspace,'AGENTS.md','# New user edit\n');const before=snapshot(f.workspace);
    assert.throws(()=>api.apply(f.out),/WORKSPACE_CHANGED_SINCE_PREPARE/);assert.deepEqual(snapshot(f.workspace),before);
  });
  test('restore refuses later edits to touched targets without overwriting other targets',()=>{
    const f=fixture({carrier:'agents'});api.prepare(f.input);api.apply(f.out);fs.appendFileSync(path.join(f.workspace,'AGENTS.md'),'Later user text\n');
    const before=snapshot(f.workspace);assert.throws(()=>api.rollback(f.out),/LATER_EDIT_REQUIRES_REVIEW/);assert.deepEqual(snapshot(f.workspace),before);
  });
  test('same-version existing complete skill is content-checked, not mistaken for a new install',()=>{
    const f=fixture();fs.mkdirSync(path.join(f.workspace,'.github/skills'),{recursive:true});copyFixtureTree(path.join(packageRoot,'standalone/synaptic'),path.join(f.workspace,'.github/skills/synaptic'));
    api.prepare(f.input);assert(plan(f).entries.some(e=>!e.changed));assert.equal(api.apply(f.out).state,'applied');
    fs.appendFileSync(path.join(f.workspace,'.github/skills/synaptic/SKILL.md'),'User edit with same version\n');
    assert.throws(()=>api.prepare({...f.input,out:path.join(base,'repair-plan')}),/PACKAGE_CONTENT_MISMATCH/);
  });
  test('existing owned bridge is replaced once, preserving rules and pointing to the selected skill',()=>{
    const f=fixture(),prefix='# Existing user rules\r\n',suffix='\r\n<!-- BEGIN:SYNAPTIC-RULES -->\r\nKeep stricter rules.\r\n<!-- END:SYNAPTIC-RULES -->\r\n';
    write(f.workspace,'AGENTS.md',prefix+api.START+'\r\nRead `.synaptic/BRAIN.md`; old skill pointer `.agents/skills/synaptic/SKILL.md`.\r\n'+api.END+suffix);
    api.prepare(f.input);assert.equal(plan(f).carrier,'AGENTS.md');api.apply(f.out);
    const text=fs.readFileSync(path.join(f.workspace,'AGENTS.md'),'utf8');assert(text.startsWith(prefix));assert(text.endsWith(suffix));
    assert.equal(text.split(api.START).length-1,1);assert(!text.includes('.agents/skills/synaptic'));assert(text.includes('.github/skills/synaptic/SKILL.md'));
    assert(!fs.existsSync(path.join(f.workspace,'.github/copilot-instructions.md')));
  });
  test('global/unreachable/duplicate bridges and competing legacy skill carriers require review',()=>{
    const pointers=[['../outside/BRAIN.md','PROJECT_ONLY_BRIDGE_SCOPE'],['.synaptic/missing/BRAIN.md','PROJECT_ONLY_BRIDGE_SCOPE']];
    for(const [pointer,reason] of pointers){const f=fixture();write(f.workspace,'AGENTS.md',`${api.START}\nRead \`${pointer}\`.\n${api.END}\n`);const before=snapshot(f.workspace);assert.throws(()=>api.prepare(f.input),new RegExp(reason));assert.deepEqual(snapshot(f.workspace),before);}
    const unreachable=fixture();fs.unlinkSync(path.join(unreachable.brain,'BRAIN.md'));write(unreachable.workspace,'AGENTS.md',`${api.START}\nRead \`.synaptic/BRAIN.md\`.\n${api.END}\n`);assert.throws(()=>api.prepare(unreachable.input),/UNREACHABLE_BRIDGE_POINTER/);
    const duplicate=fixture();for(const ref of ['AGENTS.md','.github/copilot-instructions.md'])write(duplicate.workspace,ref,`${api.START}\nRead \`.synaptic/BRAIN.md\`.\n${api.END}\n`);assert.throws(()=>api.prepare(duplicate.input),/MULTIPLE_ACTIVE_BRIDGES/);
    const legacy=fixture();write(legacy.workspace,'AGENTS.md',`${api.START}\nRead \`.synaptic/BRAIN.md\`; skill \`.agents/skills/synaptic/SKILL.md\`.\n${api.END}\n`);write(legacy.workspace,'.agents/skills/synaptic/SKILL.md','---\nname: synaptic\nversion: 1.4.0\n---');const before=snapshot(legacy.workspace);
    assert.throws(()=>api.prepare(legacy.input),/LEGACY_SKILL_CARRIER_REQUIRES_REVIEW/);assert.deepEqual(snapshot(legacy.workspace),before);assert(!fs.existsSync(path.join(legacy.workspace,'.github/skills')));
  });
  test('recognised legacy .github skill gets a reviewable unknown-source plan, not a false verified skip',()=>{
    const f=fixture();fs.mkdirSync(path.join(f.workspace,'.github/skills'),{recursive:true});copyFixtureTree(path.join(packageRoot,'standalone/synaptic'),path.join(f.workspace,'.github/skills/synaptic'));
    fs.unlinkSync(path.join(f.workspace,'.github/skills/synaptic/SOURCE.json'));fs.appendFileSync(path.join(f.workspace,'.github/skills/synaptic/SKILL.md'),'Legacy local modification\n');
    api.prepare(f.input);assert.equal(plan(f).installedSkill.state,'legacy-source-unknown');assert.equal(plan(f).installedSkill.reviewRequired,true);
    const before=snapshot(f.workspace);assert.throws(()=>api.apply(f.out),/LEGACY_SOURCE_REVIEW_REQUIRED/);assert.deepEqual(snapshot(f.workspace),before);
    assert.equal(api.apply(f.out,{acceptLegacy:'yes'}).state,'applied');assert.equal(api.rollback(f.out).state,'restored');
    assert(fs.readFileSync(path.join(f.workspace,'.github/skills/synaptic/SKILL.md'),'utf8').includes('Legacy local modification'));assert(!fs.existsSync(path.join(f.workspace,'.github/skills/synaptic/SOURCE.json')));
  });
  test('optional native selection never silently downgrades no-Node or Local profiles',()=>{
    for(const extra of [{curation:'native'},{capture:'counter'},{runtime:'node',harness:'local',curation:'native'},{mcp:'required'}]){
      const f=fixture(extra),before=snapshot(f.workspace);assert.throws(()=>api.prepare(f.input),/NODE_REQUIRED|NATIVE_LOCAL|INVALID_SELECTION/);assert.deepEqual(snapshot(f.workspace),before);
    }
    const local=fixture({harness:'local'});assert.equal(api.prepare(local.input).selected.curation,'assisted');
  });
  test('Copilot hook is independently selected, uses native dialect, and never configures MCP',()=>{
    const f=fixture({runtime:'node',capture:'counter',curation:'native'});api.prepare(f.input);
    const hook=JSON.parse(fs.readFileSync(path.join(f.out,'files',api.HOOK),'utf8'));
    assert.equal(hook.version,1);assert.equal(hook.hooks.agentStop[0].timeoutSec,10);assert(hook.hooks.agentStop[0].command.includes('vscode-integration.js event'));
    assert(!hook.hooks.Stop);assert(!plan(f).entries.some(e=>/\.mcp\.json|mcp\.json/.test(e.path)));
  });
  test('native event mapping rejects Codex/Local payloads, wrong casing and outside workspace',()=>{
    const f=fixture(),good=copilot(f);
    assert.throws(()=>api.nativeEvent({...good,session_id:'wrong-dialect'}),/INVALID_COPILOT_STOP_EVENT/);
    assert.throws(()=>api.nativeEvent({...good,stop_hook_active:undefined,stopHookActive:false}),/INVALID_COPILOT_STOP_EVENT/);
    assert.throws(()=>api.nativeEvent({...good,timestamp:'2026-11-07T00:00:00Z'}),/INVALID_COPILOT_STOP_EVENT/);
    assert.throws(()=>api.event(nativeInput(f),{...good,cwd:base}),/EVENT_WORKSPACE_MISMATCH/);
    assert(!fs.existsSync(path.join(f.brain,'.curation-state')));
  });
  test('one continuation remains bounded when native timestamps change; persisted draft gets checked',()=>{
    const f=fixture(),input=nativeInput(f),initial=api.event(input,copilot(f));assert.equal(initial.hook.decision,'block');
    for(const active of [true,false]){const repeated=api.event(input,copilot(f,1794010000999,active));assert.deepEqual(repeated.hook,{});assert.equal(repeated.status.state,'pending');}
    assert.equal(fs.readdirSync(path.join(f.brain,'.curation-state/requests')).length,1);
    complete(f,initial);const done=api.event(input,copilot(f,1794010001999,true));assert.deepEqual(done.hook,{});assert.equal(done.status.state,'structurally_checked');
    assert.equal(done.status.nativeTrigger,'not-proven-by-adapter');assert.equal(done.status.requestIdentity,'session-and-native-event-timestamp');
    assert.deepEqual(api.event(input,copilot(f,1794010002999,false)).hook,{});
    const saved=JSON.stringify(snapshot(f.workspace));assert(!saved.includes(Buffer.from('RAW_INPUT_SENTINEL_NOT_RETAINED').toString('base64')));
    assert(!saved.includes(Buffer.from('PRIVATE_TRANSCRIPT_MUST_NOT_PERSIST').toString('base64')));
  });
  test('counter records adapter invocations only and does not block curation result verification',()=>{
    const f=fixture(),input=nativeInput(f),r=api.event(input,copilot(f));complete(f,r);assert.equal(api.event(input,copilot(f,1794010001999,true)).status.state,'structurally_checked');
    const counters=JSON.parse(fs.readFileSync(path.join(f.workspace,api.RUNTIME,'state/counters.json'),'utf8'));
    assert.equal(Object.values(counters).reduce((a,b)=>a+b,0),2);
    assert.deepEqual(api.event({workspace:f.workspace,capture:'counter',curation:'assisted'},copilot(f)).hook,{});
  });
  test('native checker keeps modified Copilot instructions or hook configuration pending',()=>{
    for(const ref of ['.github/copilot-instructions.md',api.HOOK]){
      const f=fixture({runtime:'node',curation:'native'});api.prepare(f.input);api.apply(f.out);
      const input={workspace:f.workspace,capture:'off',curation:'native'},initial=api.event(input,copilot(f));complete(f,initial);
      fs.appendFileSync(path.join(f.workspace,ref),'\nChanged during curation\n');
      const checked=api.event(input,copilot(f,1794010000999,true));assert.deepEqual(checked.hook,{});assert.equal(checked.status.reason,'PROTECTED_SCOPE_CHANGED');
    }
  });
  test('actual prepared command subprocess handles Copilot input without model calls or unsupported output fields',()=>{
    const f=fixture({runtime:'node',capture:'counter',curation:'native'});api.prepare(f.input);api.apply(f.out);
    const script=path.join(f.workspace,api.RUNTIME,'tools/vscode-integration.js');
    const r=spawnSync(process.execPath,[script,'event','--workspace','.', '--capture','counter','--curation','native'],{cwd:f.workspace,input:JSON.stringify(copilot(f)),encoding:'utf8'});
    assert.equal(r.status,0,r.stderr);const out=JSON.parse(r.stdout);assert.equal(out.decision,'block');assert.equal(typeof out.reason,'string');assert(!('systemMessage' in out));
    const pending=spawnSync(process.execPath,[script,'event','--workspace','.', '--capture','counter','--curation','native'],{cwd:f.workspace,input:JSON.stringify(copilot(f,1794010000999,true)),encoding:'utf8'});
    assert.equal(pending.status,2);assert.deepEqual(JSON.parse(pending.stdout),{});assert.match(pending.stderr,/pending/);
    const bad=spawnSync(process.execPath,[script,'event','--workspace','.'],{cwd:f.workspace,input:'x'.repeat(131073),encoding:'utf8'});
    assert.equal(bad.status,2);assert.deepEqual(JSON.parse(bad.stdout),{});assert.match(bad.stderr,/EVENT_INPUT_LIMIT/);
    const malformed=spawnSync(process.execPath,[script,'event','--workspace','.'],{cwd:f.workspace,input:'RAW_PROMPT_SHOULD_NOT_ENTER_DIAGNOSTIC',encoding:'utf8'});
    assert.equal(malformed.status,2);assert.match(malformed.stderr,/INVALID_EVENT_JSON/);assert(!malformed.stderr.includes('RAW_PROMPT'));
  });
  test('a blocked state write yields exit2 diagnostic with no continuation or source edit',()=>{
    const f=fixture({runtime:'node',curation:'native'});api.prepare(f.input);api.apply(f.out);write(f.brain,'.curation-state','A non-directory blocks state writes');
    const source=fs.readFileSync(path.join(f.brain,'journal/_current.md'));
    const r=spawnSync(process.execPath,[path.join(f.workspace,api.RUNTIME,'tools/vscode-integration.js'),'event','--workspace','.', '--curation','native'],{cwd:f.workspace,input:JSON.stringify(copilot(f)),encoding:'utf8'});
    assert.equal(r.status,2);assert.deepEqual(JSON.parse(r.stdout),{});assert.match(r.stderr,/pending/);assert.deepEqual(fs.readFileSync(path.join(f.brain,'journal/_current.md')),source);
  });
  test('interrupted apply retains a recoverable transaction; rollback restores only touched paths',()=>{
    const f=fixture();api.prepare(f.input);const original=fs.renameSync;let injected=false;
    fs.renameSync=function(a,b){if(!injected && b===path.join(f.workspace,'.synaptic/harness/setup/vscode-copilot.md')){injected=true;throw Error('SYNTHETIC_WRITE_FAILURE');}return original.apply(this,arguments);};
    try{assert.throws(()=>api.apply(f.out),/SYNTHETIC_WRITE_FAILURE/);}finally{fs.renameSync=original;}
    assert(injected);assert.equal(JSON.parse(fs.readFileSync(path.join(f.out,'TRANSACTION.json'),'utf8')).state,'partial-pending');
    assert.equal(api.rollback(f.out).state,'restored');assert(!fs.existsSync(path.join(f.workspace,'.github/skills/synaptic/SKILL.md')));
    assert(fs.readFileSync(path.join(f.workspace,'.synaptic/journal/_current.md'),'utf8').includes('synthetic archive'));
  });
  test('a late edit during a transient rename failure is preserved on every platform',()=>{
    const f=fixture({carrier:'agents'});api.prepare(f.input);const original=fs.renameSync;let injected=false;
    fs.renameSync=function(a,b){if(!injected && b===path.join(f.workspace,'AGENTS.md')){injected=true;fs.writeFileSync(b,'Late user edit must survive\n');const e=Error('SYNTHETIC_SHARING_FAILURE');e.code='EPERM';throw e;}return original.apply(this,arguments);};
    try{assert.throws(()=>api.apply(f.out),process.platform==='win32'?/ATOMIC_TARGET_CHANGED/:/SYNTHETIC_SHARING_FAILURE/);}finally{fs.renameSync=original;}
    assert(injected);assert.equal(fs.readFileSync(path.join(f.workspace,'AGENTS.md'),'utf8'),'Late user edit must survive\n');
    assert.throws(()=>api.rollback(f.out),/LATER_EDIT_REQUIRES_REVIEW/);
  });
  test('persistent owned-file rename failure has a bounded retry and a restorable pending result',()=>{
    const f=fixture({carrier:'agents'});api.prepare(f.input);const original=fs.renameSync;let attempts=0;
    fs.renameSync=function(a,b){if(b===path.join(f.workspace,'AGENTS.md')){attempts++;const e=Error('SYNTHETIC_PERSISTENT_SHARING_FAILURE');e.code='EPERM';throw e;}return original.apply(this,arguments);};
    try{assert.throws(()=>api.apply(f.out),/SYNTHETIC_PERSISTENT_SHARING_FAILURE/);}finally{fs.renameSync=original;}
    assert.equal(attempts,process.platform==='win32'?6:1);assert.equal(JSON.parse(fs.readFileSync(path.join(f.out,'TRANSACTION.json'),'utf8')).state,'partial-pending');
    assert.equal(api.rollback(f.out).state,'restored');assert(fs.readFileSync(path.join(f.workspace,'AGENTS.md'),'utf8').includes('Keep all user-authored text.'));
  });
  test('symlink scope, ambiguous markers, changed stage and retained locks fail closed',()=>{
    const linked=fixture();const outside=path.join(base,'outside');fs.mkdirSync(outside);fs.symlinkSync(outside,path.join(linked.workspace,'.github'),'junction');
    assert.throws(()=>api.prepare(linked.input),/UNSAFE_PATH/);
    const ambiguous=fixture({carrier:'agents'});write(ambiguous.workspace,'AGENTS.md',api.START+'\nmissing end');assert.throws(()=>api.prepare(ambiguous.input),/AMBIGUOUS_MARKER/);
    const changed=fixture();api.prepare(changed.input);fs.appendFileSync(path.join(changed.out,'files',plan(changed).carrier),'Tampered');assert.throws(()=>api.apply(changed.out),/STAGED_FILE_CHANGED/);
    const locked=fixture();api.prepare(locked.input);write(locked.out,'transaction.lock','Previous observer');assert.throws(()=>api.apply(locked.out),/TRANSACTION_BUSY/);assert(fs.existsSync(path.join(locked.out,'transaction.lock')));
  });
  test('status explicitly observes later changes; there is no automatic loading/connection proof',()=>{
    const f=fixture();api.prepare(f.input);api.apply(f.out);assert.equal(api.status(f.out).files,'candidate-files-present');
    fs.appendFileSync(path.join(f.workspace,'.github/skills/synaptic/SKILL.md'),'Changed after installation');
    const s=api.status(f.out);assert.equal(s.files,'needs-checking');assert(s.changes.some(e=>e.path.endsWith('/SKILL.md')));assert.equal(s.observer,'explicit-check-only');
  });
  test('CLI keeps the path of a content mismatch; the documented manual repair restores a verified skill',()=>{
    const f=fixture();api.prepare(f.input);api.apply(f.out);const skill=path.join(f.workspace,'.github/skills/synaptic');
    fs.appendFileSync(path.join(skill,'references/vscode.md'),'x');
    const cli=args=>spawnSync(process.execPath,[path.join(product,'tools/vscode-integration.js'),...args],{encoding:'utf8'});
    const r=cli(['prepare','--workspace',f.workspace,'--package',packageRoot,'--out',path.join(base,'mismatch-plan'),'--harness','copilot']);
    assert.equal(r.status,1);assert.equal(r.stderr,'PACKAGE_CONTENT_MISMATCH: references/vscode.md\n');
    const raw=cli(['prepare','--workspace','RAW_ARGUMENT_MUST_NOT_LEAK: x','--package',packageRoot,'--out',path.join(base,'raw-plan'),'--harness','copilot']);
    assert.equal(raw.status,1);assert(!raw.stderr.includes('RAW_ARGUMENT'));
    const kept=path.join(base,'kept-modified-skill-'+Math.random().toString(16).slice(2));fs.renameSync(skill,kept);
    const repair={...f.input,out:path.join(base,'repair-'+Math.random().toString(16).slice(2))};api.prepare(repair);assert.equal(api.apply(repair.out).state,'applied');
    assert.equal(verifySkill(skill).status,'content-verified');assert(fs.readFileSync(path.join(kept,'references/vscode.md'),'utf8').endsWith('x'));
    for(const kind of ['missing','extra']){
      const g=fixture();api.prepare(g.input);api.apply(g.out);const s=path.join(g.workspace,'.github/skills/synaptic');const restore=fs.readFileSync(path.join(s,'references/vscode.md'));
      if(kind==='missing')fs.unlinkSync(path.join(s,'references/vscode.md'));else write(s,'references/extra.md','Extra\n');
      const bad=cli(['prepare','--workspace',g.workspace,'--package',packageRoot,'--out',path.join(base,'inventory-'+Math.random().toString(16).slice(2)),'--harness','copilot']);
      assert.equal(bad.stderr,'PACKAGE_INVENTORY_MISMATCH\n');
      fs.renameSync(s,path.join(base,'kept-'+Math.random().toString(16).slice(2)));const again={...g.input,out:path.join(base,'repair-'+Math.random().toString(16).slice(2))};
      api.prepare(again);assert.equal(api.apply(again.out).state,'applied');assert.deepEqual(fs.readFileSync(path.join(s,'references/vscode.md')),restore);
    }
  });
  test('a second bridge added after apply never blocks status or rollback',()=>{
    const f=fixture();api.prepare(f.input);api.apply(f.out);
    fs.appendFileSync(path.join(f.workspace,'AGENTS.md'),'\n'+api.START+'\nSynaptic project brain: `.synaptic/BRAIN.md`.\n'+api.END+'\n');
    assert.throws(()=>api.prepare({...f.input,out:path.join(base,'second-'+Math.random().toString(16).slice(2))}),/MULTIPLE_ACTIVE_BRIDGES_REQUIRE_REVIEW/);
    const s=api.status(f.out);assert.equal(s.files,'candidate-files-present');assert.deepEqual(s.bridgeWarning,{code:'MULTIPLE_ACTIVE_BRIDGES_REQUIRE_REVIEW'});
    assert.equal(api.rollback(f.out).state,'restored');
    for(const e of plan(f).entries.filter(e=>e.changed)){const file=path.join(f.workspace,e.path);if(e.before===null)assert(!fs.existsSync(file));else assert.equal(sha(fs.readFileSync(file)),e.before.sha256);}
  });
  test('a killed apply leaves a diagnosable lock; explicit recovery and rollback restore the original bytes',()=>{
    const f=fixture(),original=snapshot(f.workspace);api.prepare(f.input);
    const targets=plan(f).entries.filter(e=>e.changed).map(e=>path.join(f.workspace,e.path));
    const childScript=`const fs=require('node:fs');const [mod,dir,targets]=process.argv.slice(1);const wanted=new Set(JSON.parse(targets));let n=0;
      const rename=fs.renameSync;fs.renameSync=function(a,b){if(wanted.has(b) && ++n===3)process.kill(process.pid,'SIGKILL');return rename.apply(this,arguments);};
      require(mod).apply(dir);`;
    const child=spawnSync(process.execPath,['-e',childScript,path.join(product,'tools/vscode-integration.js'),f.out,JSON.stringify(targets)],{encoding:'utf8'});
    assert.equal(child.signal,'SIGKILL',child.stderr);
    const leftovers=()=>targets.flatMap(t=>fs.existsSync(path.dirname(t))?fs.readdirSync(path.dirname(t)).filter(n=>n.startsWith(path.basename(t)+'.synaptic-')):[]);
    assert.equal(leftovers().length,1);
    const s=api.status(f.out);assert.equal(s.lock.state,'retained');assert.equal(s.lock.pid,child.pid);assert.match(s.lock.createdAt,/^\d{4}-/);
    assert.throws(()=>api.apply(f.out),/TRANSACTION_BUSY/);assert.throws(()=>api.rollback(f.out),/TRANSACTION_BUSY/);
    const cli=args=>spawnSync(process.execPath,[path.join(product,'tools/vscode-integration.js'),...args],{encoding:'utf8'});
    assert.equal(cli(['recover-lock','--plan',f.out,'--expected-sha256','0'.repeat(64),'--confirm-owner-stopped','yes']).stderr,'LOCK_CHANGED\n');
    assert.equal(cli(['recover-lock','--plan',f.out,'--expected-sha256',s.lock.sha256,'--confirm-owner-stopped','no']).status,1);
    const live=fixture();api.prepare(live.input);const liveLock=JSON.stringify({pid:process.pid,createdAt:new Date().toISOString()});write(live.out,'transaction.lock',liveLock);
    assert.throws(()=>api.recoverLock(live.out,sha(Buffer.from(liveLock)),'yes'),/LOCK_OWNER_STILL_RUNNING|LOCK_OWNER_UNVERIFIED/);assert(fs.existsSync(path.join(live.out,'transaction.lock')));
    const recovered=cli(['recover-lock','--plan',f.out,'--expected-sha256',s.lock.sha256,'--confirm-owner-stopped','yes']);assert.equal(recovered.status,0,recovered.stderr);
    assert.equal(JSON.parse(recovered.stdout).state,'lock-recovered');assert.equal(api.status(f.out).lock.state,'none');
    assert.equal(api.rollback(f.out).state,'restored');assert.deepEqual(snapshot(f.workspace),original);assert.equal(leftovers().length,0);
    const fresh={...f.input,out:path.join(base,'fresh-'+Math.random().toString(16).slice(2))};assert.equal(api.prepare(fresh).state,'prepared-not-installed');
  });
  console.log(`1..${count}`);
}finally{
  assert(path.basename(base).startsWith('syn-vscode-') && path.dirname(base)===os.tmpdir());
  fs.rmSync(base,{recursive:true,force:true});
}
