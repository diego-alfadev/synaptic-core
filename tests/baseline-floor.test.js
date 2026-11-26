'use strict';
// Shipped prose-contract and synthetic filesystem checks, not an agent/host simulation.
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {spawnSync}=require('node:child_process');
const {createHash}=require('node:crypto');
const {build,verifySkill,inventory}=require('../tools/package-release');
const api=require('../tools/vscode-integration');
const {createBrain}=require('../tools/lib/core-lib');
const product=path.resolve(__dirname,'..');
const base=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'syn-baseline-')));
const repo=path.join(base,'source'),hooks=path.join(base,'empty-hooks');
fs.mkdirSync(repo);fs.mkdirSync(hooks);
function put(root,ref,data){const f=path.join(root,ref);fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,data);}
function matches(value,pattern){assert(pattern.test(value),'Missing contract: '+pattern);}
function read(ref){return fs.readFileSync(path.join(product,'standalone/synaptic',ref),'utf8').replace(/\r\n/g,'\n').replace(/^│\s*/gm,'');}
function git(args){const r=spawnSync('git',['-C',repo,'-c','core.hooksPath='+hooks,'-c','commit.gpgSign=false',...args],{encoding:'utf8'});assert.equal(r.status,0,r.stderr);return r.stdout.trim();}
function snap(root){const result={};function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const f=path.join(dir,e.name);if(e.isDirectory())walk(f);else if(e.isFile())result[path.relative(root,f).replace(/\\/g,'/')]=fs.readFileSync(f).toString('base64');}}walk(root);return result;}
let count=0,failures=0;
function test(name,fn){try{fn();console.log(`ok ${++count} - ${name}`);}catch(e){console.error(`not ok ${++count} - ${name}\n${e.stack}`);failures++;}}
let packageRoot;
function fixture(){
  const workspace=fs.mkdtempSync(path.join(base,'workspace é [baseline] '));
  put(workspace,'.synaptic/BRAIN.md','---\nschema_version: 1.0\n---\n# Synthetic brain\n');
  put(workspace,'.synaptic/journal/_current.md','# Resume\nRetain this existing source.\n');
  put(workspace,'.synaptic/harness/conventions.md','# Approved conventions\nPreserve the selected assisted profile.\n');
  put(workspace,'.synaptic/harness/guardrails.md','# Approved guardrails\nPreserve user content.\n');
  put(workspace,'AGENTS.md','# Existing owner rules\r\nKeep these bytes.\r\n');
  put(workspace,'.vscode/settings.json','{\r\n  "user.choice": true\r\n}\r\n');
  put(workspace,'.vscode/mcp.json','{"servers":{"existing":{"command":"owner-tool"}}}\n');
  const out=path.join(base,'plan-'+Math.random().toString(16).slice(2));
  return {workspace,out,input:{workspace,package:packageRoot,out,harness:'copilot'}};
}
try{
  test('normal boot cannot re-enter generic self-wiring or confuse proof with setup',()=>{
    const skill=read('SKILL.md');
    matches(skill,/Normal boot observes existing wiring; it does not install, repair, redeploy or add\s+carriers\./);
    assert(!skill.includes('Any missing → run Harness Self-Wire'));
    assert(!/Run on .*or on a boot where wiring is missing/.test(skill));
    matches(skill,/Approved-rules fallback \(read-only\)/);
    matches(skill,/unknown adapter[\s\S]{0,90}`limited`/i);
    matches(skill,/Missing proof[\s\S]{0,100}never repair triggers/);
  });
  test('ping and status alias are zero-read debug paths, separate from the situation report',()=>{
    const skill=read('SKILL.md'),situation=read('references/situation.md');
    matches(skill,/synaptic ping/);matches(skill,/synaptic status/);
    matches(skill,/retained in 1\.8/);matches(skill,/SYNAPTIC-BOOT-UNKNOWN/);
    matches(skill,/No file reads, tools or situation report belong to either canary/);
    matches(situation,/explicit/i);matches(situation,/synaptic ping/);
  });
  test('unknown-host and audit procedures retain separate support, choices and bounded diagnosis',()=>{
    const setup=read('references/host-setup.md'),audit=read('references/audit.md');
    for(const field of ['setup_id','adapter:','wired:','l3:','l4:','canary_offered_minor:','audit_reported_engine:'])assert(setup.includes(field),field);
    matches(setup,/carrier_id \+ "\\n" \+ declared_harness/);
    matches(setup,/unknown[\s\S]{0,80}limited/i);
    matches(setup,/declined[\s\S]{0,100}terminal/i);
    matches(audit,/missing legacy `<host>\.md` = baseline/);
    matches(audit,/at most once per engine version/);
    matches(audit,/cross-session suppression[\s\S]{0,50}cannot be persisted/);
    assert(!/run a fresh-session boot check|then run the boot check/i.test(audit));
  });
  test('upgrade entry requires new-engine handoff before host detection',()=>{
    const upgrade=read('references/upgrade-to-v1.md'),install=read('references/package-install.md');
    matches(upgrade,/reload/i);matches(upgrade,/old(?:er)? engine/i);
    matches(upgrade,/reload\s+the new SKILL\.md and references before host detection/i);matches(install,/adapter/i);
    matches(install,/preimages/);matches(install,/rollback|restore/i);
    matches(upgrade,/never request[\s\S]{0,80}canary|never request[\s\S]{0,80}ping/i);
  });
  // Package the actual worktree skill from immutable temporary Git objects. No user repo commit.
  git(['init','--quiet','--initial-branch=main']);git(['config','user.name','Fixture']);git(['config','user.email','fixture@example.invalid']);git(['config','core.autocrlf','false']);
  const bundle=path.join(product,'standalone/synaptic'),manifest=fs.readFileSync(path.join(bundle,'MANIFEST.txt'),'utf8');
  for(const ref of ['MANIFEST.txt',...inventory(manifest)])put(repo,'standalone/synaptic/'+ref,fs.readFileSync(path.join(bundle,...ref.split('/'))));
  for(const ref of ['tools/vscode-integration.js','tools/package-release.js','tools/lib/publish-new-directory.js','tools/lib/curation-stop.js','tools/lib/core-lib.js','tools/lib/brain-graph.js'])put(repo,ref,fs.readFileSync(path.join(product,ref)));
  for(const ref of ['docs/UPGRADE-v0.3-to-v1.md','docs/UPGRADE-v0.3-to-v1.AGENT.md','tools/migrate.js','tools/check.js'])put(repo,ref,'Synthetic migration dependency\n');
  git(['add','.']);git(['commit','--quiet','-m','fixture: shipped baseline contract']);
  packageRoot=path.join(base,'package');build(repo,'HEAD',packageRoot);
  test('a partial optional skill cannot route normal boot through installation gates',()=>{
    const skill=read('SKILL.md'),entry=skill.indexOf('## Entry routing — before bootstrap'),bootstrap=skill.indexOf('## Bootstrap / self-install');
    assert(entry>=0 && entry<bootstrap,'The normal-boot guard must precede incomplete-bundle acquisition');
    const guard=skill.slice(entry,bootstrap);
    matches(guard,/Unless the user explicitly requests install,\s+upgrade or repair, skip Bootstrap \/ self-install entirely, even when/);
    matches(guard,/absent or incomplete/);
    matches(guard,/Do not acquire files, run installation verification gates, ask for a package\/source, offer\s+repair/);
    matches(guard,/specific operation\s+as unavailable/);matches(guard,/without blocking brain reads/);
    // This is a source-routing contract plus real file availability, not a host-agent execution.
    const f=fixture();api.prepare(f.input);api.apply(f.out);
    const installed=path.join(f.workspace,'.github/skills/synaptic');
    const missing=path.join(installed,'references/host-setup.md');fs.unlinkSync(missing);
    const before=snap(f.workspace),carrier=fs.readFileSync(path.join(f.workspace,'.github/copilot-instructions.md'),'utf8');
    assert(carrier.includes(api.START));assert(carrier.includes('`.synaptic/BRAIN.md`'));
    const partial=fs.readFileSync(path.join(installed,'SKILL.md'),'utf8');
    assert(partial.includes('## Entry routing — before bootstrap'));
    assert(fs.readFileSync(path.join(installed,'MANIFEST.txt'),'utf8').includes('references/host-setup.md'));
    assert.throws(()=>verifySkill(installed),/PACKAGE_INVENTORY_MISMATCH/);
    const brain=createBrain(path.join(f.workspace,'.synaptic'));
    assert(brain.read('BRAIN.md').text.includes('schema_version: 1.0'));
    assert.equal(brain.read('journal/_current.md').text,'# Resume\nRetain this existing source.\n');
    assert.deepEqual(snap(f.workspace),before);assert(!fs.existsSync(missing));
  });
  test('no-record assisted setup uses real shipped bytes and leaves settings, MCP and hooks alone',()=>{
    const f=fixture(),before=snap(f.workspace);
    assert(!fs.existsSync(path.join(f.workspace,'.synaptic/harness/setup')));
    assert.equal(api.prepare(f.input).state,'prepared-not-installed');assert.deepEqual(snap(f.workspace),before);
    const p=JSON.parse(fs.readFileSync(path.join(f.out,'plan.json'),'utf8'));
    assert.deepEqual(p.selected,{harness:'copilot',runtime:'none',capture:'off',curation:'assisted',mcp:'not-enabled'});
    assert(!p.entries.some(e=>e.path===api.HOOK || /(?:settings|mcp)\.json$/.test(e.path)));
    assert.equal(api.apply(f.out).state,'applied');
    for(const ref of ['AGENTS.md','.vscode/settings.json','.vscode/mcp.json','.synaptic/BRAIN.md','.synaptic/journal/_current.md'])assert.equal(snap(f.workspace)[ref],before[ref],ref);
    assert.equal(verifySkill(path.join(f.workspace,'.github/skills/synaptic')).status,'content-verified');
    const record=fs.readFileSync(path.join(f.workspace,'.synaptic/harness/setup/vscode-copilot.md'),'utf8');
    const expectedId=createHash('sha256').update('project:'+p.carrier+'\ncopilot').digest('hex');
    assert(record.includes('setup_id: '+expectedId));
    for(const line of ['adapter: supported','wired: baseline','l3: not-configured','l4: not-configured','audit_reported_engine:'])assert(record.includes(line),line);
    const installed=fs.readFileSync(path.join(f.workspace,'.github/skills/synaptic/SKILL.md'),'utf8');
    assert.equal(installed,fs.readFileSync(path.join(bundle,'SKILL.md'),'utf8'));
    assert(!fs.readFileSync(path.join(f.workspace,p.carrier),'utf8').includes('BEGIN:SYNAPTIC-RULES'));
    assert.equal(api.status(f.out).loading,'needs-fresh-session-proof');
    const applied=snap(f.workspace);assert.equal(api.apply(f.out).state,'applied');assert.deepEqual(snap(f.workspace),applied);
    const second={...f.input,out:path.join(base,'second-'+Math.random().toString(16).slice(2))};
    api.prepare(second);assert.deepEqual(snap(f.workspace),applied);
    const again=JSON.parse(fs.readFileSync(path.join(second.out,'plan.json'),'utf8'));
    assert.equal(again.carrier,p.carrier);assert.deepEqual(again.selected,p.selected);
    assert.equal(again.nonce,p.nonce);assert.equal(again.entries.filter(e=>e.changed).length,0);
    assert(!again.entries.some(e=>e.path==='AGENTS.md' || e.path===api.HOOK || e.path.startsWith('.agents/') || e.path.startsWith('.claude/')));
    assert.throws(()=>api.prepare({...second,out:path.join(base,'switch-carrier'),carrier:'agents'}),/CARRIER_MIGRATION_REQUIRES_REVIEW/);
    assert.deepEqual(snap(f.workspace),applied);
    assert.equal(api.rollback(f.out).state,'restored');assert.deepEqual(snap(f.workspace),before);
  });
  test('a private/global pointer in a project carrier is refused before any integration write',()=>{
    const f=fixture();
    put(f.workspace,'AGENTS.md','# Owner instructions\n'+api.START+'\nPrivate brain: `../private/.synaptic/BRAIN.md`.\n'+api.END+'\n');
    const before=snap(f.workspace);
    assert.throws(()=>api.prepare(f.input),/PROJECT_ONLY_BRIDGE_SCOPE/);
    assert.deepEqual(snap(f.workspace),before);assert(!fs.existsSync(f.out));
  });
}finally{
  assert(path.basename(base).startsWith('syn-baseline-') && path.dirname(base)===fs.realpathSync(os.tmpdir()));
  fs.rmSync(base,{recursive:true,force:true});
}
console.log(`1..${count}`);if(failures)process.exitCode=1;
