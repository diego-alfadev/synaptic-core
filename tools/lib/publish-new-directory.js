'use strict';
// Publish a private staged directory to an absent destination. Windows may report
// transient sharing/permission errors on rename even after all our handles close.
// Retry the same operation briefly; never chmod, delete, replace, or elevate.
const fs=require('node:fs');
const path=require('node:path');
const DELAYS=[25,50,100,200,200]; // At most 575ms waiting, six rename attempts.
function destinationExists(file){try{fs.lstatSync(file);return true;}catch(e){if(e.code==='ENOENT')return false;throw e;}}
function existsError(){const e=Error('OUTPUT_ALREADY_EXISTS');e.code='OUTPUT_ALREADY_EXISTS';return e;}
function pause(ms){Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,ms);}
function publishNewDirectory(source,destination,operations={}){
  const from=path.resolve(source),to=path.resolve(destination);
  const sourceStat=fs.lstatSync(from);
  if(from===to || sourceStat.isSymbolicLink() || !sourceStat.isDirectory())throw Error('STAGING_DIRECTORY_REQUIRED');
  if(path.dirname(from)!==path.dirname(to))throw Error('SIBLING_DESTINATION_REQUIRED');
  const rename=operations.rename || fs.renameSync;
  const wait=operations.wait || pause;
  const platform=operations.platform || process.platform;
  for(let attempt=0;;attempt++){
    // lstat sees dangling links too. Re-check on every retry, not only preflight.
    if(destinationExists(to))throw existsError();
    try{rename(from,to);return {attempts:attempt+1};}
    catch(error){
      if(destinationExists(to))throw existsError();
      if(platform!=='win32' || !['EPERM','EACCES','EBUSY'].includes(error.code) || attempt>=DELAYS.length)throw error;
      wait(DELAYS[attempt]);
    }
  }
}
module.exports={publishNewDirectory,destinationExists};
