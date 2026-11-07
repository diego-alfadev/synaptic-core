#!/usr/bin/env node
'use strict';
// Build/verify an immutable, local release package. This never installs a skill,
// edits a brain/host config, fetches a URL, or publishes a release.
// Node >=18; git is required to BUILD, not to VERIFY an already supplied package.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {spawnSync} = require('node:child_process');

const MANIFEST = 'RELEASE-MANIFEST.json';
const RECEIPT = 'SOURCE.json';
const PREFIX = 'standalone/synaptic/';
const REPOSITORY = 'https://github.com/diego-alfadev/synaptic-core';
const REQUIRED = ['standalone/synaptic/MANIFEST.txt','standalone/synaptic/SKILL.md',
  'docs/UPGRADE-v0.3-to-v1.md','docs/UPGRADE-v0.3-to-v1.AGENT.md','tools/migrate.js','tools/check.js','tools/lib/brain-graph.js'];
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const jsonBytes = value => Buffer.from(JSON.stringify(value,null,2)+'\n');
const fail = message => {throw new Error(message);};

function validPath(ref) {
  return typeof ref==='string' && ref.length>0 && !ref.includes('\\') && !ref.includes(':') &&
    !/[\x00-\x1f\x7f]/.test(ref) && !path.posix.isAbsolute(ref) &&
    !ref.split('/').some(part=>!part || part==='.' || part==='..');
}
function git(repo,args,encoding='utf8') {
  const r=spawnSync('git',['-C',repo,...args],{encoding,maxBuffer:64*1024*1024});
  if(r.status!==0) fail('SOURCE_GIT_ERROR');
  return r.stdout;
}
function inventory(text) {
  const entries=text.split(/\r?\n/).map(line=>line.trim()).filter(Boolean);
  if(!entries.length || entries.some(ref=>!validPath(ref)) || new Set(entries).size!==entries.length) fail('INVALID_SKILL_MANIFEST');
  if(!entries.includes('SKILL.md')) fail('INVALID_SKILL_MANIFEST');
  if(entries.includes(RECEIPT) || entries.includes('MANIFEST.txt')) fail('RESERVED_SKILL_METADATA');
  return entries;
}
function version(skill) {
  const m=skill.match(/(?:^|\n)version:\s*["']?([^\s#"']+)/);
  if(!m) fail('MISSING_ENGINE_VERSION');
  return m[1];
}
function build(repoArg,ref,outArg) {
  if(typeof ref!=='string' || !ref || ref.startsWith('-') || /[\x00-\x1f]/.test(ref)) fail('EXPLICIT_SOURCE_REF_REQUIRED');
  const repo=path.resolve(repoArg);
  const commit=git(repo,['rev-parse','--verify','--end-of-options',ref+'^{commit}']).trim();
  if(!/^[a-f0-9]{40}$/.test(commit)) fail('INVALID_SOURCE_COMMIT');
  const out=path.resolve(outArg);
  if(fs.existsSync(out)) fail('OUTPUT_ALREADY_EXISTS');
  const parent=path.dirname(out);
  if(!fs.existsSync(parent) || !fs.statSync(parent).isDirectory()) fail('OUTPUT_PARENT_REQUIRED');
  const payload=new Map();
  const records=git(repo,['ls-tree','-r','-z','--full-tree',commit]).split('\0').filter(Boolean);
  for(const record of records) {
    const m=record.match(/^(\d+) (\w+) ([a-f0-9]+)\t([\s\S]+)$/);
    if(!m) fail('INVALID_SOURCE_TREE');
    const [,mode,type,object,refPath]=m;
    // Full tracked source snapshot: upgrade guides, recipes and their linked
    // helpers must not disappear behind an incomplete directory allowlist.
    if(!validPath(refPath) || type!=='blob' || !['100644','100755'].includes(mode)) fail('UNSUPPORTED_SOURCE_ENTRY');
    if(refPath===MANIFEST || refPath===PREFIX+RECEIPT) fail('RESERVED_SOURCE_METADATA');
    const bytes=git(repo,['cat-file','blob',object],null);
    payload.set(refPath,{bytes,mode});
  }
  for(const required of REQUIRED) if(!payload.has(required)) fail('MISSING_SOURCE_DEPENDENCY: '+required);
  const listed=inventory(payload.get(PREFIX+'MANIFEST.txt').bytes.toString('utf8'));
  for(const name of listed) if(!payload.has(PREFIX+name)) fail('MISSING_SKILL_FILE: '+name);
  const ownedSkill=[...payload.keys()].filter(p=>p.startsWith(PREFIX)).map(p=>p.slice(PREFIX.length));
  if(ownedSkill.some(p=>p!=='MANIFEST.txt' && !listed.includes(p))) fail('UNLISTED_SKILL_FILE');
  const engineVersion=version(payload.get(PREFIX+'SKILL.md').bytes.toString('utf8'));
  const source={repository:REPOSITORY,commit};
  const skillFiles=['MANIFEST.txt',...listed].sort().map(name=>{
    const bytes=payload.get(PREFIX+name).bytes;
    return {path:name,bytes:bytes.length,sha256:hash(bytes)};
  });
  payload.set(PREFIX+RECEIPT,{bytes:jsonBytes({format:'synaptic-skill-source-v1',source,engineVersion,files:skillFiles}),mode:'100644'});
  const manifest={format:'synaptic-release-package-v1',source,engineVersion,
    files:[...payload.entries()].sort(([a],[b])=>a<b?-1:a>b?1:0).map(([name,{bytes,mode}])=>({path:name,bytes:bytes.length,sha256:hash(bytes),mode}))};
  const manifestBytes=jsonBytes(manifest);
  // The output is a NEW staging package, never an existing installation. Prepare
  // in a sibling directory; rename only after self-verification. On failure leave
  // the private staging evidence and never recursively delete a computed path.
  const stage=fs.mkdtempSync(path.join(parent,'.synaptic-package-'));
  try {
    for(const [name,{bytes,mode}] of payload) {
      const file=path.join(stage,...name.split('/'));
      fs.mkdirSync(path.dirname(file),{recursive:true});
      fs.writeFileSync(file,bytes,{flag:'wx',mode:mode==='100755'?0o755:0o644});
    }
    fs.writeFileSync(path.join(stage,MANIFEST),manifestBytes,{flag:'wx'});
    verifyPackage(stage);
    if(fs.existsSync(out)) fail('OUTPUT_ALREADY_EXISTS');
    fs.renameSync(stage,out);
  } catch(e) {e.stagingPath=stage;throw e;}
  return {operation:'package-build',source,engineVersion,path:out,files:manifest.files.length,manifestSha256:hash(manifestBytes)};
}
function checkedRoot(input) {
  const root=fs.realpathSync(path.resolve(input));
  if(!fs.statSync(root).isDirectory()) fail('PACKAGE_DIRECTORY_REQUIRED');
  return root;
}
function readConfined(root,ref) {
  if(!validPath(ref)) fail('INVALID_PACKAGE_PATH');
  let file=root;
  for(const component of ref.split('/')) {
    file=path.join(file,component);
    if(fs.lstatSync(file).isSymbolicLink()) fail('SYMLINK_PACKAGE_ENTRY');
  }
  if(!fs.statSync(file).isFile()) fail('PACKAGE_FILE_REQUIRED');
  return fs.readFileSync(file);
}
function actualFiles(root) {
  const files=[];
  function walk(dir) {
    for(const entry of fs.readdirSync(dir,{withFileTypes:true})) {
      if(entry.isSymbolicLink()) fail('SYMLINK_PACKAGE_ENTRY');
      const full=path.join(dir,entry.name);
      if(entry.isDirectory()) walk(full);
      else if(entry.isFile()) files.push(path.relative(root,full).replace(/\\/g,'/'));
      else fail('UNSUPPORTED_PACKAGE_ENTRY');
    }
  }
  walk(root);return files.sort();
}
function metadata(bytes,format) {
  let value;
  try{value=JSON.parse(bytes.toString('utf8'));}catch(_){fail('INVALID_PACKAGE_METADATA');}
  if(!value || value.format!==format || !value.source || value.source.repository!==REPOSITORY ||
    !/^[a-f0-9]{40}$/.test(value.source.commit) || typeof value.engineVersion!=='string' || !Array.isArray(value.files)) fail('INVALID_PACKAGE_METADATA');
  const seen=new Set();
  for(const file of value.files) {
    if(!file || !validPath(file.path) || seen.has(file.path) || !Number.isSafeInteger(file.bytes) || file.bytes<0 ||
      !/^[a-f0-9]{64}$/.test(file.sha256)) fail('INVALID_PACKAGE_METADATA');
    seen.add(file.path);
  }
  if(!value.files.length) fail('INVALID_PACKAGE_METADATA');
  return value;
}
function verifyFiles(root,manifest,metadataName) {
  const wanted=manifest.files.map(f=>f.path).concat(metadataName).sort();
  if(new Set(wanted).size!==wanted.length || JSON.stringify(actualFiles(root))!==JSON.stringify(wanted)) fail('PACKAGE_INVENTORY_MISMATCH');
  for(const item of manifest.files) {
    const bytes=readConfined(root,item.path);
    if(bytes.length!==item.bytes || hash(bytes)!==item.sha256) fail('PACKAGE_CONTENT_MISMATCH: '+item.path);
  }
}
function verifySkill(input) {
  const root=checkedRoot(input);
  const manifest=metadata(readConfined(root,RECEIPT),'synaptic-skill-source-v1');
  const listed=inventory(readConfined(root,'MANIFEST.txt').toString('utf8'));
  if(JSON.stringify(manifest.files.map(f=>f.path).sort())!==JSON.stringify(['MANIFEST.txt',...listed].sort())) fail('SKILL_MANIFEST_MISMATCH');
  verifyFiles(root,manifest,RECEIPT);
  if(version(readConfined(root,'SKILL.md').toString('utf8'))!==manifest.engineVersion) fail('ENGINE_VERSION_MISMATCH');
  return {operation:'skill-verify',source:manifest.source,engineVersion:manifest.engineVersion,files:manifest.files.length,status:'content-verified'};
}
function verifyPackage(input,expectedManifestHash) {
  const root=checkedRoot(input);
  const bytes=readConfined(root,MANIFEST);
  if(expectedManifestHash!==undefined && (!/^[a-f0-9]{64}$/.test(expectedManifestHash) || hash(bytes)!==expectedManifestHash)) fail('RELEASE_MANIFEST_HASH_MISMATCH');
  const manifest=metadata(bytes,'synaptic-release-package-v1');
  verifyFiles(root,manifest,MANIFEST);
  const skill=verifySkill(path.join(root,'standalone','synaptic'));
  if(skill.source.commit!==manifest.source.commit || skill.engineVersion!==manifest.engineVersion) fail('PACKAGE_SOURCE_MISMATCH');
  for(const required of REQUIRED) if(!manifest.files.some(f=>f.path===required)) fail('MISSING_SOURCE_DEPENDENCY');
  return {operation:'package-verify',source:manifest.source,engineVersion:manifest.engineVersion,files:manifest.files.length,manifestSha256:hash(bytes),status:'content-verified'};
}
function main(args) {
  if(args.length===2 && args[0]==='--verify') return verifyPackage(args[1]);
  if(args.length===4 && args[0]==='--verify' && args[2]==='--sha256') return verifyPackage(args[1],args[3]);
  if(args.length===2 && args[0]==='--verify-skill') return verifySkill(args[1]);
  const options={};
  for(let i=0;i<args.length;i++) {
    if(!['--repo','--ref','--out'].includes(args[i]) || options[args[i]]!==undefined || !args[i+1] || args[i+1].startsWith('--')) fail('INVALID_ARGUMENTS');
    options[args[i]]=args[++i];
  }
  if(!options['--ref'] || !options['--out']) fail('Usage: node tools/package-release.js --ref <tag-or-commit> --out <new-directory> [--repo <source-repo>] | --verify <package> [--sha256 <trusted-manifest-digest>] | --verify-skill <installed-skill>');
  return build(options['--repo'] || path.resolve(__dirname,'..'),options['--ref'],options['--out']);
}
if(require.main===module) {
  try{process.stdout.write(JSON.stringify(main(process.argv.slice(2)))+'\n');}
  catch(e){process.stderr.write(JSON.stringify({error:e.message,...(e.stagingPath?{stagingPath:e.stagingPath}:{})})+'\n');process.exitCode=1;}
}
module.exports={build,verifyPackage,verifySkill,validPath,inventory,MANIFEST,RECEIPT};
