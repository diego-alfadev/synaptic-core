#!/usr/bin/env node
'use strict';
// Optional explicit setup utility. Inspection never applies configuration.
const fs=require('node:fs'),path=require('node:path');
const inspection=require('./lib/setup-inspection');
const {validateContext,validateIntent,configuredTarget}=require('./lib/setup-policy');
const adapters=require('./lib/setup-adapter');
const {decorateObservations}=require('./lib/setup-observations');
const fail=code=>{throw Object.assign(new Error(code),{code});};
function readJSON(file){
  const resolved=path.resolve(file),st=fs.lstatSync(resolved);
  if(st.isSymbolicLink() || !st.isFile() || st.size>2*1024*1024)fail('INVALID_INPUT_FILE');
  try{return JSON.parse(fs.readFileSync(resolved,'utf8'));}catch(_){fail('INVALID_INPUT_JSON');}
}
function prepare(input){
  // Keep raw absence at the adapter boundary: the normalised read model uses a
  // null timestamp, which is not a supplied/dated context declaration.
  const rawContext=input.context===undefined?{}:input.context;
  const context=validateContext(rawContext),intent=validateIntent(input.target),target=configuredTarget(intent);
  if(context.observedAt && Date.parse(context.observedAt)>Date.now())fail('FUTURE_SETUP_DECLARATION');
  const workspace=inspection.workspaceRoot(input.workspace),prior=inspection.loadIntent(workspace,input.harness,context);
  if(prior.state==='historical' || prior.state==='unknown')fail('SETUP_INTENT_REVIEW_REQUIRED');
  if(prior.state==='recorded' && prior.intent.decisions.some(d=>d.state==='declined' && intent.selected[d.capability]) && input.reopenDeclines!==true)fail('EXPLICIT_DECLINE_REOPEN_REQUIRED');
  if(!target.skill || target.commands || target.mcp)fail('TARGET_REQUIRES_ANOTHER_ADAPTER');
  const native=target.capture || target.curation;
  if(native && (input.harness!=='copilot' || context.permissions.node!=='allowed' || context.permissions.hooks!=='allowed'))fail('TARGET_PERMISSIONS_OR_SUPPORT_UNCONFIRMED');
  // Lazy require: read-only inspection never starts event/curation workflows.
  const result=require('./vscode-integration').prepare({workspace,harness:input.harness,package:input.package,out:input.out,
    ...(input.sha256?{sha256:input.sha256}:{}),...(native?{runtime:'node'}:{}),capture:target.capture?'counter':'off',curation:target.curation?'native':'assisted',setupIntent:intent,setupContext:rawContext,reopenDeclines:input.reopenDeclines===true});
  return {...result,target:intent.selected,configuredSubset:target,approval:'Review the staged exact plan and fresh preimages before explicitly applying with vscode-integration.js.',liveHostEvidence:'not-established'};
}
function main(args){
  const op=args.shift(),allowed={inspect:['workspace','harness','context','evidence'],recommend:['workspace','harness','context','evidence'],notify:['workspace','harness','context'],prepare:['workspace','harness','context','target','package','out','sha256','reopen-declines'], 'adapter-check':['workspace','descriptor','acceptance','targets']};
  if(!Object.hasOwn(allowed,op))fail('UNKNOWN_SETUP_OPERATION');
  const options={};
  for(let i=0;i<args.length;i+=2){const k=args[i].startsWith('--')?args[i].slice(2):'';if(!allowed[op].includes(k) || Object.hasOwn(options,k) || !args[i+1] || args[i+1].startsWith('--'))fail('INVALID_SETUP_ARGUMENTS');options[k]=args[i+1];}
  if(!options.workspace)fail('WORKSPACE_REQUIRED');
  if(op==='adapter-check'){
    if(!options.descriptor)fail('DESCRIPTOR_REQUIRED');
    const descriptor=readJSON(options.descriptor),result=adapters.validateAdapter(descriptor),workspace=inspection.workspaceRoot(options.workspace);
    return {...result,acceptance:adapters.validateAcceptance(descriptor,options.acceptance?readJSON(options.acceptance):null,workspace),...(options.targets?{targets:adapters.verifyPlanTargets(descriptor,readJSON(options.targets))}:{}),note:'Validation and a supplied receipt do not authenticate consent or approve a concrete write plan. No adapter code was executed.'};
  }
  const input={workspace:options.workspace,harness:options.harness,context:options.context?readJSON(options.context):{}};
  if(op==='inspect')return decorateObservations(inspection.inspect(input),options.evidence?readJSON(options.evidence):undefined);
  if(op==='recommend'){const result=decorateObservations(inspection.inspect(input),options.evidence?readJSON(options.evidence):undefined);return {observedAt:result.observedAt,observer:result.observer,adapter:result.adapter,scope:result.scope,declarationFreshness:result.declarationFreshness,capabilities:result.capabilities,intent:result.intent,coverage:result.coverage,observationInput:result.observationInput,recordedObservations:result.recordedObservations,writesPerformed:0};}
  if(op==='notify')return inspection.notify(input);
  if(!options.target || !options.package || !options.out || options['reopen-declines']!==undefined && options['reopen-declines']!=='yes')fail('PREPARATION_ARGUMENTS_REQUIRED');
  return prepare({...input,target:readJSON(options.target),package:options.package,out:options.out,sha256:options.sha256,reopenDeclines:options['reopen-declines']==='yes'});
}
if(require.main===module){try{process.stdout.write(JSON.stringify(main(process.argv.slice(2)),null,2)+'\n');}catch(e){process.stderr.write((e.code || 'SETUP_OPERATION_FAILED')+'\n');process.exitCode=1;}}
module.exports={prepare,main};
