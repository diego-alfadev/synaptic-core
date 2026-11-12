'use strict';
// Synthetic committed sources only. No network, model, gh, tag publication or live install.
const assert=require('node:assert/strict');const fs=require('node:fs');const os=require('node:os');const path=require('node:path');
const {spawnSync}=require('node:child_process');const crypto=require('node:crypto');
const {prepare,verifyPrepared,tarPath}=require('../tools/prepare-release');
const {verifyPackage,RECEIPT,MANIFEST}=require('../tools/package-release');
const {copyFixtureTree}=require('./lib/fixture-copy');
const root=fs.mkdtempSync(path.join(os.tmpdir(),'syn-prepare-'));
const repo=path.join(root,'source é [exact]'),hooks=path.join(root,'empty-hooks');fs.mkdirSync(repo);fs.mkdirSync(hooks);
const tag='v2.0.0-rc.1',hash=b=>crypto.createHash('sha256').update(b).digest('hex');
function put(ref,bytes){const p=path.join(repo,ref);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,bytes);}
function git(args){const r=spawnSync('git',['-C',repo,'-c','commit.gpgSign=false','-c','core.hooksPath='+hooks,...args],{encoding:'utf8'});assert.equal(r.status,0,r.stderr);return r.stdout.trim();}
let n=0;function test(name,fn){fn();console.log(`ok ${++n} - ${name}`);}
try{
  git(['init','--quiet','--initial-branch=main']);git(['config','user.name','Synthetic release fixture']);git(['config','user.email','fixture@example.invalid']);git(['config','core.autocrlf','false']);
  put('standalone/synaptic/SKILL.md','---\nname: synaptic\nversion: 1.6.0\n---\n');
  put('standalone/synaptic/MANIFEST.txt','SKILL.md\nreferences/upgrade-to-v1.md\ntemplates/notes café.md\n');
  put('standalone/synaptic/references/upgrade-to-v1.md','# Upgrade the existing brain\r\n');
  put('standalone/synaptic/templates/notes café.md','# Unicode fixture\r\nPreserve CRLF and café.\r\n');
  for(const ref of ['docs/UPGRADE-v0.3-to-v1.md','docs/UPGRADE-v0.3-to-v1.AGENT.md','tools/migrate.js','tools/check.js','tools/lib/brain-graph.js'])put(ref,'Synthetic dependency\n');
  put('bin/fixture.sh','#!/bin/sh\nprintf fixture\n');put('research/payload.dat',Buffer.from([0,255,13,10,1]));
  // Export attributes must not drop/transform the generated receipts in the prepared asset.
  put('.gitattributes','SOURCE.json export-ignore\nRELEASE-MANIFEST.json export-ignore\n');
  git(['add','.']);git(['update-index','--chmod=+x','bin/fixture.sh']);git(['commit','--quiet','-m','fixture: old committed version']);const old=git(['rev-parse','HEAD']);
  test('version mismatch fails before output and never silently relabels old engine bytes',()=>{
    const out=path.join(root,'mismatch');assert.throws(()=>prepare(repo,old,tag,out),/ENGINE_VERSION_MISMATCH.*committed=1\.6\.0/);assert(!fs.existsSync(out));assert(fs.readFileSync(path.join(repo,'standalone/synaptic/SKILL.md'),'utf8').includes('1.6.0'));
  });
  put('standalone/synaptic/SKILL.md','---\nname: synaptic\nversion: 2.0.0-rc.1\n---\n');git(['add','standalone/synaptic/SKILL.md']);git(['commit','--quiet','-m','fixture: explicit RC version preparation']);const commit=git(['rev-parse','HEAD']);
  let result;const out=path.join(root,'prepared candidate é');
  test('prepares an exact committed RC while preserving dirty worktree and git configuration',()=>{
    put('standalone/synaptic/SKILL.md','---\nversion: 9.9.9\n---\nDirty source stays unchanged.\n');
    const dirty=git(['status','--porcelain']),config=git(['config','--local','--list']);
    result=prepare(repo,commit,tag,out);assert.equal(result.sourceCommit,commit);assert.equal(result.engineVersion,'2.0.0-rc.1');assert.equal(result.published,false);
    assert.equal(git(['status','--porcelain']),dirty);assert.equal(git(['config','--local','--list']),config);assert.equal(git(['tag','--list']),'');
    assert(fs.readFileSync(path.join(repo,'standalone/synaptic/SKILL.md'),'utf8').includes('9.9.9'));
    const receipt=JSON.parse(fs.readFileSync(path.join(out,'package','standalone/synaptic',RECEIPT),'utf8'));assert.equal(receipt.source.commit,commit);assert.equal(receipt.engineVersion,'2.0.0-rc.1');
    assert(fs.readFileSync(path.join(out,'RELEASE-NOTES.md'),'utf8').includes('not a stable integration claim'));
  });
  test('archive and digest set are reproducible with fixed owner/time metadata',()=>{
    const second=prepare(repo,commit,tag,path.join(root,'second identical candidate'));
    assert.equal(result.archiveSha256,second.archiveSha256);assert.equal(result.manifestSha256,second.manifestSha256);assert.equal(result.checksumsSha256,second.checksumsSha256);
    const bytes=fs.readFileSync(path.join(out,result.archive));assert(bytes.subarray(4,8).every(b=>b===0));assert.equal(hash(bytes),result.archiveSha256);
    assert(fs.readFileSync(path.join(out,'SHA256SUMS'),'utf8').includes(result.archiveSha256+'  '+result.archive));
  });
  test('independent tar consumer extracts UTF-8/CRLF/binary/generated receipts and executable mode',()=>{
    const probe=spawnSync('tar',['--version'],{encoding:'utf8'});
    if(probe.error && probe.error.code==='ENOENT'){console.log('# tar consumer unavailable; local byte verification passed, extraction acceptance remains external');return;}
    assert.equal(probe.status,0,probe.stderr);
    const extracted=path.join(root,'independent extraction');fs.mkdirSync(extracted);
    const unpack=spawnSync('tar',['-xzf',path.join(out,result.archive),'-C',extracted],{encoding:'utf8'});assert.equal(unpack.status,0,unpack.stderr);
    const pkg=path.join(extracted,'synaptic-2.0.0-rc.1');assert.equal(verifyPackage(pkg,result.manifestSha256).source.commit,commit);
    assert.equal(fs.readFileSync(path.join(pkg,'standalone/synaptic/templates/notes café.md'),'utf8'),'# Unicode fixture\r\nPreserve CRLF and café.\r\n');
    assert.deepEqual(fs.readFileSync(path.join(pkg,'research/payload.dat')),Buffer.from([0,255,13,10,1]));
    assert(fs.existsSync(path.join(pkg,MANIFEST)));assert(fs.existsSync(path.join(pkg,'standalone/synaptic',RECEIPT)));
    const listing=spawnSync('tar',['-tvf',path.join(out,result.archive)],{encoding:'utf8'});assert.equal(listing.status,0,listing.stderr);assert(/^-rwxr-xr-x[^\n]*bin\/fixture\.sh/m.test(listing.stdout),listing.stdout);
  });
  test('existing output, including a live-looking directory, is never replaced',()=>{
    const live=path.join(root,'existing');fs.mkdirSync(live);fs.writeFileSync(path.join(live,'SKILL.md'),'Keep current');
    assert.throws(()=>prepare(repo,commit,tag,live),/OUTPUT_ALREADY_EXISTS/);assert.equal(fs.readFileSync(path.join(live,'SKILL.md'),'utf8'),'Keep current');
  });
  test('exact commit and explicit prerelease identity are required',()=>{
    for(const ref of ['HEAD','main',commit.slice(0,12),'--bad'])assert.throws(()=>prepare(repo,ref,tag,path.join(root,'invalid-ref')),/EXACT_40_CHARACTER_COMMIT_REQUIRED/);
    for(const version of ['v2.0.0','2.0.0-rc.1','v2.0.0-rc.0','v02.0.0-rc.1'])assert.throws(()=>prepare(repo,commit,version,path.join(root,'invalid-tag')),/EXPLICIT_RC_TAG_REQUIRED/);
  });
  test('changed asset, metadata or notes fail local verification',()=>{
    for(const ref of [result.archive,'PREPARED-RELEASE.json','RELEASE-NOTES.md']){
      const copy=path.join(root,'tampered-'+ref.replace(/[^A-Za-z0-9]/g,'_'));copyFixtureTree(out,copy);
      fs.appendFileSync(path.join(copy,ref),'tampered');assert.throws(()=>verifyPrepared(copy));
    }
  });
  test('verification CLI works without git/gh on PATH and does not fetch anything',()=>{
    const cli=path.resolve(__dirname,'../tools/prepare-release.js');const checked=spawnSync(process.execPath,[cli,'--verify',out],{encoding:'utf8',env:{...process.env,PATH:''}});
    assert.equal(checked.status,0,checked.stderr);assert.equal(JSON.parse(checked.stdout).sourceCommit,commit);assert.equal(JSON.parse(checked.stdout).published,false);
  });
  test('release notes print the trusted manifest digest',()=>{
    const notes=fs.readFileSync(path.join(out,'RELEASE-NOTES.md'),'utf8');
    assert(notes.includes('`manifestSha256`: `'+result.manifestSha256+'`'),notes);
  });
  test('the four downloaded release assets verify without the expanded package',()=>{
    const assets=path.join(root,'downloaded assets');fs.mkdirSync(assets);
    for(const ref of [result.archive,'PREPARED-RELEASE.json','RELEASE-NOTES.md','SHA256SUMS'])fs.copyFileSync(path.join(out,ref),path.join(assets,ref));
    assert.throws(()=>verifyPrepared(assets),/HANDOFF_INVENTORY_MISMATCH/);
    const listed=fs.readFileSync(path.join(assets,'SHA256SUMS'),'utf8').trim().split('\n').map(l=>l.split('  ')[1]);
    for(const ref of listed)assert(fs.existsSync(path.join(assets,ref)),ref);
    const cli=path.resolve(__dirname,'../tools/prepare-release.js');
    const checked=spawnSync(process.execPath,[cli,'--verify-assets',assets],{encoding:'utf8',env:{...process.env,PATH:''}});assert.equal(checked.status,0,checked.stderr);
    const report=JSON.parse(checked.stdout);assert.equal(report.manifestSha256,result.manifestSha256);assert.equal(report.archiveSha256,result.archiveSha256);assert.equal(report.status,'assets-verified');
    for(const ref of [result.archive,'PREPARED-RELEASE.json','RELEASE-NOTES.md','SHA256SUMS']){
      const copy=path.join(root,'tampered asset '+ref.replace(/[^A-Za-z0-9]/g,'_'));copyFixtureTree(assets,copy);fs.appendFileSync(path.join(copy,ref),'tampered');
      assert.equal(spawnSync(process.execPath,[cli,'--verify-assets',copy],{encoding:'utf8'}).status,1,ref);
    }
  });
  test('documented gh release commands attach every file SHA256SUMS lists',()=>{
    const releasing=fs.readFileSync(path.join(__dirname,'../docs/RELEASING.md'),'utf8');
    const commands=releasing.split(/\r?\n/).filter(l=>l.startsWith('gh release create ')).map(l=>l.replace(/ --notes-file \S+/,''));assert(commands.length>=2);
    for(const line of commands)for(const ref of ['synaptic-2.0.0-rc.1.tar.gz','SHA256SUMS','PREPARED-RELEASE.json','RELEASE-NOTES.md'])assert(new RegExp(' \\S*/'+ref.replace(/\./g,'\\.')+'(?: |$)').test(line),ref+' not attached: '+line);
  });
  test('unrepresentable USTAR paths fail clearly, never silently truncate or produce final output',()=>{
    assert.throws(()=>tarPath('synaptic-2.0.0-rc.1/research/'+('x'.repeat(101))),/ARCHIVE_PATH_TOO_LONG/);
    put('research/'+('x'.repeat(101)),'Long leaf');git(['add','research']);git(['commit','--quiet','-m','fixture: long path']);const long=git(['rev-parse','HEAD']);
    const target=path.join(root,'long-path-output');assert.throws(()=>prepare(repo,long,tag,target),/ARCHIVE_PATH_TOO_LONG/);assert(!fs.existsSync(target));
  });
  test('Windows outer publication uses the same bounded retry after a verified handoff is staged',()=>{
    if(process.platform!=='win32'){console.log('# production Windows integration is covered on Windows; shared retry state machine is tested cross-platform');return;}
    const target=path.join(root,'outer-transient-retry'),originalRename=fs.renameSync;let attempts=0;
    try{
      fs.renameSync=(from,to)=>{if(path.resolve(to)===target && path.basename(from).startsWith('.synaptic-rc-') && ++attempts===1){const e=Error('simulated transient outer rename');e.code='EPERM';throw e;}return originalRename(from,to);};
      const report=prepare(repo,commit,tag,target);assert.equal(report.publicationAttempts,2);assert.equal(verifyPrepared(target).sourceCommit,commit);assert.equal(attempts,2);
    }finally{fs.renameSync=originalRename;}
  });
  console.log(`1..${n}`);
}finally{
  assert(path.basename(root).startsWith('syn-prepare-') && path.dirname(root)===os.tmpdir());fs.rmSync(root,{recursive:true,force:true});
}
