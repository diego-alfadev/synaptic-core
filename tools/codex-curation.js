#!/usr/bin/env node
'use strict';
const {stop,status,archive,recoverLock}=require('./lib/curation-stop');
function options(args){
  const op=args.shift(),out={profile:'assisted',sources:[]};
  if(!['stop','status','archive','recover-lock'].includes(op))throw Error('Use stop|status|archive|recover-lock --brain <project-brain> [--workspace <root>] [--profile assisted|native] [--source <relative-md>]');
  while(args.length){const key=args.shift(),value=args.shift();if(!value || value.startsWith('--'))throw Error('MISSING_OPTION_VALUE');if(key==='--source')out.sources.push(value);else if(['--brain','--workspace','--profile','--request','--reason','--lock','--expected-sha256','--confirm-owner-stopped'].includes(key))out[key.slice(2)]=value;else throw Error('UNKNOWN_OPTION');}
  if(!out.brain)throw Error('BRAIN_REQUIRED');if(!out.sources.length)delete out.sources;
  return {op,out};
}
async function main(){
  const {op,out}=options(process.argv.slice(2));
  if(op==='recover-lock'){process.stdout.write(JSON.stringify(recoverLock(out,out.lock,out['expected-sha256'],out['confirm-owner-stopped']))+'\n');return;}
  if(op==='archive'){process.stdout.write(JSON.stringify(archive(out,out.request,out.reason))+'\n');return;}
  if(op==='status'){process.stdout.write(JSON.stringify(status(out))+'\n');return;}
  let size=0;const chunks=[];
  for await(const chunk of process.stdin){size+=chunk.length;if(size>131072)throw Error('STOP_INPUT_LIMIT');chunks.push(chunk);}
  const result=stop(out,JSON.parse(Buffer.concat(chunks).toString('utf8')));
  process.stdout.write(JSON.stringify(result.hook)+'\n');
}
if(require.main===module)main().catch(e=>{
  const message=e.code || e.message || 'OPERATION_FAILED';
  if(process.argv[2]==='stop'){
    process.stdout.write(JSON.stringify({systemMessage:`Synaptic curation pending: ${message}. No continuation requested; inspect configuration/permissions and retained work.`})+'\n');
    process.stderr.write(`Synaptic curation pending: ${message}\n`);
  }else{process.stderr.write(message+'\n');process.exitCode=1;}
});
module.exports={options};
