'use strict';
// Test fixture byte copy, independent of fs.cpSync's native recursive implementation.
// Official Node 22.23.4 on Windows was observed to crash on Unicode-path cpSync
// fixtures; keep those Unicode cases and their negative assertions intact.
const fs=require('node:fs');
const path=require('node:path');
function copyFixtureTree(source,destination){
  const from=path.resolve(source),to=path.resolve(destination);
  const relative=path.relative(from,to);
  if(relative==='' || (!path.isAbsolute(relative) && relative!=='..' && !relative.startsWith('..'+path.sep)))throw Error('FIXTURE_COPY_OVERLAP');
  function copy(current,target){
    const stat=fs.lstatSync(current);
    if(stat.isSymbolicLink())throw Error('FIXTURE_COPY_SYMLINK');
    if(stat.isDirectory()){
      fs.mkdirSync(target,{mode:stat.mode&0o777}); // New destination only; never merge/replace.
      for(const name of fs.readdirSync(current).sort())copy(path.join(current,name),path.join(target,name));
    }else if(stat.isFile()){
      const bytes=fs.readFileSync(current);
      fs.writeFileSync(target,bytes,{flag:'wx',mode:stat.mode&0o777});
      if(!fs.readFileSync(target).equals(bytes))throw Error('FIXTURE_COPY_BYTE_MISMATCH');
    }else throw Error('FIXTURE_COPY_UNSUPPORTED_ENTRY');
  }
  if(!fs.lstatSync(from).isDirectory())throw Error('FIXTURE_COPY_DIRECTORY_REQUIRED');
  copy(from,to);return to;
}
module.exports={copyFixtureTree};
