#!/usr/bin/env node
'use strict';
// Optional Node accelerator. CORE equivalent: references/audit.md / contract.md.
const {createRetrieval}=require('./lib/retrieval-port');
function main(args) {
  const positional=[];const options={};
  for(let i=0;i<args.length;i++) {
    if(args[i]==='--no-sqlite') options.sqlite=false;
    else if(args[i]==='--cache-dir') {if(!args[i+1] || args[i+1].startsWith('--')) throw Error('MISSING_CACHE_DIR');options.cacheDir=args[++i];}
    else if(args[i].startsWith('--')) throw Error('UNKNOWN_OPTION');
    else positional.push(args[i]);
  }
  const [root,op,...values]=positional;
  if(!root || !['status','search','read'].includes(op)) throw Error('Usage: node tools/cortex.js <brain> status|search|read [query/ref] [--no-sqlite] [--cache-dir <existing-private-directory>]');
  if((op==='status' && values.length) || (op==='read' && values.length!==1) || (op==='search' && !values.length)) throw Error('INVALID_ARGUMENTS');
  const port=createRetrieval(root,options);
  try {
    const result=op==='status'?port.status():op==='read'?port.read(values[0]):port.search(values.join(' '));
    process.stdout.write(JSON.stringify(result)+'\n');
  } finally {port.close();}
}
if(require.main===module) {try{main(process.argv.slice(2));}catch(e){process.stderr.write(String(e.message)+(e.ref?': '+e.ref:'')+'\n');process.exitCode=1;}}
module.exports={main};
