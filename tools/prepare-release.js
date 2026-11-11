#!/usr/bin/env node
'use strict';
// Local-only owner handoff. No gh/network/tag/push/install operations.
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const zlib=require('node:zlib');
const {spawnSync}=require('node:child_process');
const {build,verifyPackage,MANIFEST,validPath}=require('./package-release');
const {publishNewDirectory}=require('./lib/publish-new-directory');
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const json=value=>Buffer.from(JSON.stringify(value,null,2)+'\n');
const RC=/^v(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)-rc\.[1-9]\d*$/;
const MAX_TAR_BYTES=128*1024*1024;
function fail(message){throw Error(message);}
function exists(file){try{fs.lstatSync(file);return true;}catch(e){if(e.code==='ENOENT')return false;throw e;}}
function git(repo,args){const r=spawnSync('git',['-C',repo,...args],{encoding:'utf8',maxBuffer:4*1024*1024});if(r.status!==0)fail('SOURCE_GIT_ERROR');return r.stdout;}
function read(root,ref){
  if(!validPath(ref))fail('INVALID_HANDOFF_PATH');let file=root;
  for(const part of ref.split('/')){file=path.join(file,part);if(fs.lstatSync(file).isSymbolicLink())fail('SYMLINK_HANDOFF_ENTRY');}
  if(!fs.statSync(file).isFile())fail('HANDOFF_FILE_REQUIRED');return fs.readFileSync(file);
}
function tarPath(name){
  if(!validPath(name))fail('INVALID_ARCHIVE_PATH');
  if(Buffer.byteLength(name)<=100)return {name,prefix:''};
  const slashes=[...name.matchAll(/\//g)].map(m=>m.index).reverse();
  for(const i of slashes){const prefix=name.slice(0,i),leaf=name.slice(i+1);if(Buffer.byteLength(prefix)<=155 && Buffer.byteLength(leaf)<=100)return {name:leaf,prefix};}
  fail('ARCHIVE_PATH_TOO_LONG: '+name);
}
function octal(number,width){const s=number.toString(8);if(!Number.isSafeInteger(number) || number<0 || s.length>width-1)fail('ARCHIVE_FIELD_LIMIT');return s.padStart(width-1,'0')+'\0';}
function tarHeader(name,size,mode,type='0'){
  const parts=tarPath(name),header=Buffer.alloc(512);
  header.write(parts.name,0,100,'utf8');header.write(octal(mode,8),100,'ascii');
  header.write(octal(0,8),108,'ascii');header.write(octal(0,8),116,'ascii');
  header.write(octal(size,12),124,'ascii');header.write(octal(0,12),136,'ascii');
  header.fill(32,148,156);header.write(type,156,'ascii');header.write('ustar\0',257,'ascii');header.write('00',263,'ascii');header.write(parts.prefix,345,155,'utf8');
  let checksum=0;for(const byte of header)checksum+=byte;
  header.write(checksum.toString(8).padStart(6,'0')+'\0 ',148,'ascii');return header;
}
function tarPackage(packageRoot,rootName){
  const manifest=JSON.parse(read(packageRoot,MANIFEST).toString('utf8'));
  const files=[...manifest.files,{path:MANIFEST,mode:'100644'}].sort((a,b)=>a.path<b.path?-1:a.path>b.path?1:0);
  const parts=[];let length=1024,index=0;
  function add(name,bytes,mode,type='0'){
    const padding=(512-bytes.length%512)%512;
    length+=512+bytes.length+padding;if(length>MAX_TAR_BYTES)fail('ARCHIVE_SIZE_LIMIT');
    parts.push(tarHeader(name,bytes.length,mode,type),bytes,Buffer.alloc(padding));
  }
  for(const entry of files){
    const bytes=read(packageRoot,entry.path),fullName=rootName+'/'+entry.path;
    tarPath(fullName); // Deliberately retain the bounded path contract even with PAX metadata.
    if(/[^\x20-\x7e]/.test(fullName)){
      // PAX path values are UTF-8 by definition. Bare USTAR UTF-8 names are decoded as
      // OEM/ANSI by some Windows readers, corrupting otherwise byte-valid file names.
      const body='path='+fullName+'\n';let size=Buffer.byteLength(body)+3,record;
      for(;;){record=Buffer.from(size+' '+body,'utf8');if(record.length===size)break;size=record.length;}
      add(rootName+'/PaxHeaders/'+index,record,0o644,'x');
      add(rootName+'/PaxFiles/'+index,bytes,entry.mode==='100755'?0o755:0o644);
    }else add(fullName,bytes,entry.mode==='100755'?0o755:0o644);
    index++;
  }
  parts.push(Buffer.alloc(1024));return Buffer.concat(parts);
}
function notes(tag,commit,manifestSha256){return `# Synaptic ${tag} — release candidate\n\nThis is a prerelease candidate, not a stable integration claim.\n\n- Work-item routing keeps tasks, proposals, context and completion evidence together.\n- Optional Cortex tools read current files and provide lexical search; your Markdown brain remains the record.\n- VS Code setup uses explicit working profiles and reviewable, recoverable project wiring. Installing files alone does not prove loading, capture or tool connection.\n\nUpgrade from the attached **synaptic-${tag.slice(1)}.tar.gz** asset, which includes generated source receipts and the complete migration package. GitHub's automatic Source code archives are not that prepared package. Follow UPGRADING.md inside it, preserve your existing brain, and review the bounded diff before applying.\n\nNative capture, automatic model-curation and the real VS Code migration still require their own scoped acceptance evidence; a flag or synthetic test is not live proof.\n\nExact source: ${commit}.\n\nTrusted package digest, also recorded in PREPARED-RELEASE.json: \`manifestSha256\`: \`${manifestSha256}\`. Check the extracted package against it before running anything from it: \`node <package>/tools/package-release.js --verify <package> --sha256 ${manifestSha256}\`.\n`;}
function sums(root,archive){return [archive,'PREPARED-RELEASE.json','RELEASE-NOTES.md'].map(ref=>`${hash(read(root,ref))}  ${ref}\n`).join('');}
function preparedMetadata(input){
  const root=fs.realpathSync(path.resolve(input));if(!fs.statSync(root).isDirectory())fail('HANDOFF_DIRECTORY_REQUIRED');
  let metadata;try{metadata=JSON.parse(read(root,'PREPARED-RELEASE.json').toString('utf8'));}catch(_){fail('INVALID_HANDOFF_METADATA');}
  if(!metadata || metadata.format!=='synaptic-owner-rc-handoff-v1' || !RC.test(metadata.tag) || metadata.engineVersion!==metadata.tag.slice(1) || !/^[a-f0-9]{40}$/.test(metadata.sourceCommit) || metadata.archive!==`synaptic-${metadata.engineVersion}.tar.gz` || metadata.archiveRoot!==`synaptic-${metadata.engineVersion}` || !/^[a-f0-9]{64}$/.test(metadata.archiveSha256) || !/^[a-f0-9]{64}$/.test(metadata.manifestSha256))fail('INVALID_HANDOFF_METADATA');
  return {root,metadata};
}
// Finds one regular entry in an archive written by tarPackage (USTAR, ASCII name).
function tarEntry(tar,wanted){
  for(let offset=0;offset+512<=tar.length;){
    const header=tar.subarray(offset,offset+512);if(header.every(b=>b===0))break;
    const field=(start,length)=>{const raw=header.subarray(start,start+length),end=raw.indexOf(0);return raw.subarray(0,end<0?length:end).toString('utf8');};
    const size=parseInt(field(124,12).trim() || '0',8),start=offset+512;
    if(!Number.isSafeInteger(size) || size<0 || start+size>tar.length)fail('INVALID_ARCHIVE');
    const prefix=field(345,155),name=(prefix?prefix+'/':'')+field(0,100);
    if(['0',''].includes(field(156,1)) && name===wanted)return tar.subarray(start,start+size);
    offset=start+Math.ceil(size/512)*512;
  }
  fail('ARCHIVE_MANIFEST_MISSING');
}
// The four files a release page carries, without the expanded package/ directory.
function verifyAssets(input){
  const {root,metadata}=preparedMetadata(input);
  const expected=[metadata.archive,'PREPARED-RELEASE.json','RELEASE-NOTES.md','SHA256SUMS'].sort();
  if(JSON.stringify(fs.readdirSync(root).sort())!==JSON.stringify(expected))fail('ASSET_INVENTORY_MISMATCH');
  const archive=read(root,metadata.archive);
  if(hash(archive)!==metadata.archiveSha256)fail('ARCHIVE_DIGEST_MISMATCH');
  if(read(root,'SHA256SUMS').toString('utf8')!==sums(root,metadata.archive))fail('HANDOFF_DIGEST_MISMATCH');
  let unpacked;try{unpacked=zlib.gunzipSync(archive,{maxOutputLength:MAX_TAR_BYTES});}catch(_){fail('INVALID_ARCHIVE');}
  if(hash(tarEntry(unpacked,metadata.archiveRoot+'/'+MANIFEST))!==metadata.manifestSha256)fail('RELEASE_MANIFEST_HASH_MISMATCH');
  return {operation:'release-assets-verify',sourceCommit:metadata.sourceCommit,tag:metadata.tag,archive:metadata.archive,archiveSha256:metadata.archiveSha256,manifestSha256:metadata.manifestSha256,status:'assets-verified',packageContent:'not-checked; extract and run package-release.js --verify <package> --sha256 <manifestSha256>'};
}
function verifyPrepared(input){
  const {root,metadata}=preparedMetadata(input);
  const expected=['package',metadata.archive,'PREPARED-RELEASE.json','RELEASE-NOTES.md','SHA256SUMS'].sort();
  if(JSON.stringify(fs.readdirSync(root).sort())!==JSON.stringify(expected))fail('HANDOFF_INVENTORY_MISMATCH');
  if(fs.lstatSync(path.join(root,'package')).isSymbolicLink())fail('SYMLINK_HANDOFF_ENTRY');
  const report=verifyPackage(path.join(root,'package'),metadata.manifestSha256);
  if(report.source.commit!==metadata.sourceCommit || report.engineVersion!==metadata.engineVersion)fail('HANDOFF_SOURCE_VERSION_MISMATCH');
  const archive=read(root,metadata.archive);
  if(hash(archive)!==metadata.archiveSha256)fail('ARCHIVE_DIGEST_MISMATCH');
  let unpacked;try{unpacked=zlib.gunzipSync(archive,{maxOutputLength:MAX_TAR_BYTES});}catch(_){fail('INVALID_ARCHIVE');}
  if(!unpacked.equals(tarPackage(path.join(root,'package'),metadata.archiveRoot)))fail('ARCHIVE_PAYLOAD_MISMATCH');
  if(read(root,'SHA256SUMS').toString('utf8')!==sums(root,metadata.archive))fail('HANDOFF_DIGEST_MISMATCH');
  return {operation:'owner-release-verify',sourceCommit:metadata.sourceCommit,tag:metadata.tag,engineVersion:metadata.engineVersion,archive:metadata.archive,archiveSha256:metadata.archiveSha256,manifestSha256:metadata.manifestSha256,checksumsSha256:hash(read(root,'SHA256SUMS')),status:'local-content-verified',published:false};
}
function prepare(repoArg,commit,tag,outArg){
  if(typeof commit!=='string' || !/^[a-f0-9]{40}$/.test(commit))fail('EXACT_40_CHARACTER_COMMIT_REQUIRED');
  if(!RC.test(tag || ''))fail('EXPLICIT_RC_TAG_REQUIRED');
  const repo=path.resolve(repoArg),resolved=git(repo,['rev-parse','--verify','--end-of-options',commit+'^{commit}']).trim();
  if(resolved!==commit)fail('SOURCE_COMMIT_MISMATCH');
  const skill=git(repo,['show',commit+':standalone/synaptic/SKILL.md']);
  const match=skill.match(/(?:^|\n)version:\s*["']?([^\s#"']+)/);
  if(!match || match[1]!==tag.slice(1))fail(`ENGINE_VERSION_MISMATCH: committed=${match?match[1]:'missing'} requested=${tag.slice(1)}; prepare and commit the source version explicitly, then use that new exact commit`);
  const out=path.resolve(outArg);if(exists(out))fail('OUTPUT_ALREADY_EXISTS');
  const parent=path.dirname(out);if(!fs.existsSync(parent) || !fs.statSync(parent).isDirectory())fail('OUTPUT_PARENT_REQUIRED');
  const stage=fs.mkdtempSync(path.join(parent,'.synaptic-rc-'));
  try{
    const packageRoot=path.join(stage,'package'),report=build(repo,commit,packageRoot);
    if(report.engineVersion!==tag.slice(1))fail('ENGINE_VERSION_MISMATCH');
    const archiveRoot=`synaptic-${report.engineVersion}`,archiveName=archiveRoot+'.tar.gz';
    // USTAR/PAX timestamps/owners are fixed. No live paths or timestamps enter the archive.
    const archive=zlib.gzipSync(tarPackage(packageRoot,archiveRoot),{level:9,mtime:0});
    fs.writeFileSync(path.join(stage,archiveName),archive,{flag:'wx'});
    fs.writeFileSync(path.join(stage,'PREPARED-RELEASE.json'),json({format:'synaptic-owner-rc-handoff-v1',tag,engineVersion:report.engineVersion,sourceCommit:commit,archive:archiveName,archiveRoot,archiveSha256:hash(archive),manifestSha256:report.manifestSha256,publication:'not-published',releaseMode:'owner-reviewed-draft-prerelease'}),{flag:'wx'});
    fs.writeFileSync(path.join(stage,'RELEASE-NOTES.md'),notes(tag,commit,report.manifestSha256),{flag:'wx'});
    fs.writeFileSync(path.join(stage,'SHA256SUMS'),sums(stage,archiveName),{flag:'wx'});
    verifyPrepared(stage);const publication=publishNewDirectory(stage,out);
    return {...verifyPrepared(out),operation:'owner-release-prepare',path:out,publicationAttempts:publication.attempts};
  }catch(e){e.stagingPath=stage;throw e;}
}
function main(args){
  if(args.length===2 && args[0]==='--verify')return verifyPrepared(args[1]);
  if(args.length===2 && args[0]==='--verify-assets')return verifyAssets(args[1]);
  const options={};for(let i=0;i<args.length;i++){
    if(!['--repo','--ref','--version','--out'].includes(args[i]) || options[args[i]]!==undefined || !args[i+1] || args[i+1].startsWith('--'))fail('INVALID_ARGUMENTS');options[args[i]]=args[++i];
  }
  if(!options['--ref'] || !options['--version'] || !options['--out'])fail('Usage: node tools/prepare-release.js --ref <exact-40-character-commit> --version <vX.Y.Z-rc.N> --out <NEW-directory> [--repo <checkout>] | --verify <prepared-directory> | --verify-assets <downloaded-assets-directory>');
  return prepare(options['--repo'] || path.resolve(__dirname,'..'),options['--ref'],options['--version'],options['--out']);
}
if(require.main===module){try{process.stdout.write(JSON.stringify(main(process.argv.slice(2)))+'\n');}catch(e){process.stderr.write(JSON.stringify({error:e.message,...(e.stagingPath?{stagingPath:e.stagingPath}:{})})+'\n');process.exitCode=1;}}
module.exports={prepare,verifyPrepared,verifyAssets,tarPath,tarHeader};
