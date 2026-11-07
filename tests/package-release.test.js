'use strict';
// Behavioural packaging tests: immutable Git objects, complete migration sources,
// no live install writes, and observable integrity failures. No model/network calls.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const crypto=require('node:crypto');
const {build,verifyPackage,verifySkill,MANIFEST,RECEIPT}=require('../tools/package-release');
const {publishNewDirectory}=require('../tools/lib/publish-new-directory');
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'syn-package-'));
const repo=path.join(temp,'repo é [source]');fs.mkdirSync(repo);
const emptyHooks=path.join(temp,'empty-hooks');fs.mkdirSync(emptyHooks);
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
function put(rel,bytes){const file=path.join(repo,rel);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,bytes);}
function git(args){const r=spawnSync('git',['-C',repo,'-c','commit.gpgSign=false','-c','tag.gpgSign=false','-c','core.hooksPath='+emptyHooks,...args],{encoding:'utf8'});assert.equal(r.status,0,r.stderr);return r.stdout.trim();}
function copy(source,name){const out=path.join(temp,name);fs.cpSync(source,out,{recursive:true});return out;}
let number=0;
function test(name,fn){fn();console.log(`ok ${++number} - ${name}`);}
try {
  git(['init','--quiet','--initial-branch=main']);git(['config','user.name','Fixture']);git(['config','user.email','fixture@example.invalid']);
  git(['config','core.autocrlf','false']); // The fixture intentionally commits exact mixed line endings.
  put('standalone/synaptic/SKILL.md','---\nname: synaptic\nversion: 1.6.0\n---\nPinned original\r\n');
  put('standalone/synaptic/MANIFEST.txt','SKILL.md\nreferences/upgrade-to-v1.md\ntemplates/BRAIN.md\ntemplates/raw/.gitkeep\n');
  put('standalone/synaptic/references/upgrade-to-v1.md','# Use the packaged migration guide\n');
  put('standalone/synaptic/templates/BRAIN.md','# Template\n');
  put('standalone/synaptic/templates/raw/.gitkeep','');
  put('docs/UPGRADE-v0.3-to-v1.md','# Human migration guide\r\n');
  put('docs/UPGRADE-v0.3-to-v1.AGENT.md','# Agent migration guide\n');
  put('tools/migrate.js','// Optional Node migration helper\n');
  put('tools/check.js','// Optional Node checks\n');
  put('tools/lib/brain-graph.js','// Shared parser\n');
  put('tests/source-test.js','// Source test\n');
  put('README.md','# Package fixture\n');
  put('recipes/capture.md','# Hook recipe source\n');
  put('UPGRADING.md','# Source-pinned upgrade entry\n');
  put('research/source-note.md','# Tracked source context\n');
  git(['add','.']);git(['commit','--quiet','-m','fixture: pinned source']);
  const pinned=git(['rev-parse','HEAD']);git(['tag','v-fixture']);
  const out=path.join(temp,'release package é');
  let result;
  test('build reads exact committed bytes, not modified worktree or a moving main',()=>{
    put('standalone/synaptic/SKILL.md','---\nversion: 9.9.9\n---\nDirty new bytes');
    result=build(repo,'v-fixture',out);
    assert.equal(result.source.commit,pinned);
    assert.equal(result.engineVersion,'1.6.0');
    assert.equal(fs.readFileSync(path.join(out,'standalone/synaptic/SKILL.md'),'utf8'),'---\nname: synaptic\nversion: 1.6.0\n---\nPinned original\r\n');
    assert(fs.readFileSync(path.join(repo,'standalone/synaptic/SKILL.md'),'utf8').includes('Dirty new bytes'));
    assert(fs.existsSync(path.join(out,'UPGRADING.md')));
    assert(fs.existsSync(path.join(out,'recipes/capture.md')));
    assert(fs.existsSync(path.join(out,'research/source-note.md')));
  });
  test('complete package retains migration docs/tools and a verifiable skill receipt/manifest',()=>{
    const report=verifyPackage(out,result.manifestSha256);
    assert.equal(report.status,'content-verified');assert.equal(report.source.commit,pinned);
    for(const name of ['docs/UPGRADE-v0.3-to-v1.md','docs/UPGRADE-v0.3-to-v1.AGENT.md','tools/migrate.js','tools/check.js']) assert(fs.existsSync(path.join(out,name)));
    const skill=path.join(out,'standalone/synaptic');
    assert(fs.existsSync(path.join(skill,'MANIFEST.txt')));assert(fs.existsSync(path.join(skill,RECEIPT)));
    assert.equal(verifySkill(skill).source.commit,pinned);
    assert.equal(fs.statSync(path.join(skill,'templates/raw/.gitkeep')).size,0);
  });
  test('building the same immutable source is byte-for-byte deterministic',()=>{
    const other=path.join(temp,'same source');const second=build(repo,pinned,other);
    assert.equal(second.manifestSha256,result.manifestSha256);
    assert.equal(fs.readFileSync(path.join(other,MANIFEST),'utf8'),fs.readFileSync(path.join(out,MANIFEST),'utf8'));
  });
  test('existing destination is never overwritten, including a live-looking install',()=>{
    const installed=path.join(temp,'existing skill');fs.mkdirSync(installed);fs.writeFileSync(path.join(installed,'SKILL.md'),'Working old skill');
    assert.throws(()=>build(repo,pinned,installed),/OUTPUT_ALREADY_EXISTS/);
    assert.equal(fs.readFileSync(path.join(installed,'SKILL.md'),'utf8'),'Working old skill');
  });
  test('same-version changed or missing payload is detected rather than skipped',()=>{
    const changed=copy(out,'changed');const skill=path.join(changed,'standalone/synaptic');
    fs.appendFileSync(path.join(skill,'SKILL.md'),'Changed with the same version');
    assert.throws(()=>verifySkill(skill),/PACKAGE_CONTENT_MISMATCH/);
    const missing=copy(out,'missing');fs.unlinkSync(path.join(missing,'standalone/synaptic/templates/BRAIN.md'));
    assert.throws(()=>verifySkill(path.join(missing,'standalone/synaptic')),/PACKAGE_INVENTORY_MISMATCH/);
  });
  test('unexpected user file is a conflict; verification never removes it',()=>{
    const changed=copy(out,'extra');const extra=path.join(changed,'standalone/synaptic/my-notes.md');
    fs.writeFileSync(extra,'Keep this user content');assert.throws(()=>verifySkill(path.dirname(extra)),/PACKAGE_INVENTORY_MISMATCH/);
    assert.equal(fs.readFileSync(extra,'utf8'),'Keep this user content');
  });
  test('trusted release digest detects rewritten package metadata',()=>{
    const changed=copy(out,'changed-metadata');const file=path.join(changed,MANIFEST);
    const metadata=JSON.parse(fs.readFileSync(file,'utf8'));metadata.engineVersion='8.8.8';fs.writeFileSync(file,JSON.stringify(metadata));
    assert.throws(()=>verifyPackage(changed,result.manifestSha256),/RELEASE_MANIFEST_HASH_MISMATCH/);
  });
  test('metadata traversal, ADS and symlink entries are rejected before reading outside payload',()=>{
    const changed=copy(out,'traversal');const file=path.join(changed,MANIFEST);
    const metadata=JSON.parse(fs.readFileSync(file,'utf8'));metadata.files[0].path='../secret.md';fs.writeFileSync(file,JSON.stringify(metadata));
    assert.throws(()=>verifyPackage(changed),/INVALID_PACKAGE_METADATA/);
    metadata.files[0].path='docs/public.md:secret.md';fs.writeFileSync(file,JSON.stringify(metadata));
    assert.throws(()=>verifyPackage(changed),/INVALID_PACKAGE_METADATA/);
    const linked=copy(out,'linked');const outside=path.join(temp,'outside');fs.mkdirSync(outside);fs.writeFileSync(path.join(outside,'private.md'),'Outside sentinel');
    fs.symlinkSync(outside,path.join(linked,'escape'),'junction');assert.throws(()=>verifyPackage(linked),/SYMLINK_PACKAGE_ENTRY/);
  });
  test('missing migration dependencies fail before creating the output package',()=>{
    git(['rm','--quiet','docs/UPGRADE-v0.3-to-v1.AGENT.md']);git(['commit','--quiet','-m','fixture: incomplete dependency']);
    const target=path.join(temp,'incomplete-output');assert.throws(()=>build(repo,'HEAD',target),/MISSING_SOURCE_DEPENDENCY/);assert(!fs.existsSync(target));
  });
  test('malformed source manifest cannot escape staging or make a partial output',()=>{
    git(['checkout','v-fixture','--','docs/UPGRADE-v0.3-to-v1.AGENT.md']);
    put('standalone/synaptic/MANIFEST.txt','SKILL.md\n../outside.md\n');git(['add','.']);git(['commit','--quiet','-m','fixture: invalid inventory']);
    const target=path.join(temp,'invalid-manifest-output');assert.throws(()=>build(repo,'HEAD',target),/INVALID_SKILL_MANIFEST/);assert(!fs.existsSync(target));
  });
  test('verification CLI is usable without a source checkout or a git subprocess',()=>{
    const cli=path.resolve(__dirname,'../tools/package-release.js');
    const r=spawnSync(process.execPath,[cli,'--verify',out,'--sha256',result.manifestSha256],{encoding:'utf8',env:{...process.env,PATH:''}});
    assert.equal(r.status,0,r.stderr);assert.equal(JSON.parse(r.stdout).source.commit,pinned);
    assert.equal(hash(fs.readFileSync(path.join(out,MANIFEST))),result.manifestSha256);
  });
  test('trusted bootstrap verifier runs from its single authenticated file, without local helper imports',()=>{
    const isolated=path.join(temp,'single-file-verifier');fs.mkdirSync(isolated);
    const verifier=path.join(isolated,'package-release.js');fs.copyFileSync(path.resolve(__dirname,'../tools/package-release.js'),verifier);
    const run=()=>spawnSync(process.execPath,[verifier,'--verify',out,'--sha256',result.manifestSha256],{encoding:'utf8',env:{...process.env,PATH:''}});
    const alone=run();assert.equal(alone.status,0,alone.stderr);assert.equal(JSON.parse(alone.stdout).source.commit,pinned);
    // An unverified sibling must not execute merely because it is present before validation.
    fs.mkdirSync(path.join(isolated,'lib'));const sentinel=path.join(isolated,'untrusted-helper-executed');
    fs.writeFileSync(path.join(isolated,'lib','publish-new-directory.js'),`require('node:fs').writeFileSync(${JSON.stringify(sentinel)},'executed');throw Error('UNTRUSTED_HELPER_LOADED');`);
    const poisoned=run();assert.equal(poisoned.status,0,poisoned.stderr);assert(!fs.existsSync(sentinel));
  });
  test('Windows transient sharing errors retry briefly without modifying contents or permissions',()=>{
    for(const code of ['EPERM','EACCES','EBUSY']){
      const source=path.join(temp,'rename-'+code),target=source+'-published';fs.mkdirSync(source);fs.writeFileSync(path.join(source,'payload.md'),'Unchanged staging bytes');
      let attempts=0;const delays=[];
      const publication=publishNewDirectory(source,target,{platform:'win32',rename:(from,to)=>{attempts++;if(attempts===1){const e=Error('simulated transient sharing denial');e.code=code;throw e;}fs.renameSync(from,to);},wait:ms=>delays.push(ms)});
      assert.equal(publication.attempts,2);assert.deepEqual(delays,[25]);assert.equal(fs.readFileSync(path.join(target,'payload.md'),'utf8'),'Unchanged staging bytes');
    }
  });
  test('permanent Windows denial exhausts a bounded retry and retains staging unchanged',()=>{
    const source=path.join(temp,'permanent-denial'),target=source+'-published';fs.mkdirSync(source);fs.writeFileSync(path.join(source,'payload.md'),'Keep evidence');
    const original=Error('permanent denial');original.code='EPERM';let attempts=0;const delays=[];
    assert.throws(()=>publishNewDirectory(source,target,{platform:'win32',rename:()=>{attempts++;throw original;},wait:ms=>delays.push(ms)}),e=>e===original);
    assert.equal(attempts,6);assert.equal(delays.reduce((a,b)=>a+b,0),575);assert(!fs.existsSync(target));assert.equal(fs.readFileSync(path.join(source,'payload.md'),'utf8'),'Keep evidence');
  });
  test('a destination appearing after a failed rename is preserved, never overwritten by retry',()=>{
    const source=path.join(temp,'collision-source'),target=path.join(temp,'late-destination');fs.mkdirSync(source);fs.writeFileSync(path.join(source,'payload.md'),'Keep staging');
    let attempts=0;
    assert.throws(()=>publishNewDirectory(source,target,{platform:'win32',rename:()=>{attempts++;fs.mkdirSync(target);fs.writeFileSync(path.join(target,'owner.md'),'Concurrent owner data');const e=Error('sharing failure');e.code='EBUSY';throw e;},wait:()=>{throw Error('must not wait once destination exists');}}),/OUTPUT_ALREADY_EXISTS/);
    assert.equal(attempts,1);assert.equal(fs.readFileSync(path.join(target,'owner.md'),'utf8'),'Concurrent owner data');assert.equal(fs.readFileSync(path.join(source,'payload.md'),'utf8'),'Keep staging');
  });
  test('non-Windows or non-transient errors are not silently retried',()=>{
    const source=path.join(temp,'no-retry'),target=source+'-published';fs.mkdirSync(source);let attempts=0;
    const denial=Error('denied');denial.code='EACCES';
    assert.throws(()=>publishNewDirectory(source,target,{platform:'linux',rename:()=>{attempts++;throw denial;},wait:()=>{throw Error('unexpected wait');}}),e=>e===denial);
    assert.equal(attempts,1);assert(fs.existsSync(source));assert(!fs.existsSync(target));
    attempts=0;const unexpected=Error('I/O failure');unexpected.code='EIO';
    assert.throws(()=>publishNewDirectory(source,target,{platform:'win32',rename:()=>{attempts++;throw unexpected;},wait:()=>{throw Error('unexpected wait');}}),e=>e===unexpected);
    assert.equal(attempts,1);
  });
  console.log(`1..${number}`);
} finally {
  // Test-owned absolute temp root, fixed before all operations; never a product path.
  assert(path.basename(temp).startsWith('syn-package-') && path.dirname(temp)===os.tmpdir());
  fs.rmSync(temp,{recursive:true,force:true});
}
