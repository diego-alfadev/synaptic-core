'use strict';
// Bounded project inspector. No host process, credentials, network or writes.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {TextDecoder}=require('node:util');
const {verifySkill,validPath}=require('../package-release');
const {validateContext,validateIntent,passiveNotices,validInstant}=require('./setup-policy');
const {capabilityProgress}=require('./setup-state');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const fail=code=>{throw Object.assign(new Error(code),{code});};
const MAX=2*1024*1024;
function workspaceRoot(input){const root=fs.realpathSync(input);if(!fs.statSync(root).isDirectory())fail('WORKSPACE_DIRECTORY_REQUIRED');return root;}
function read(root,ref){
  let file=root;
  try{
    for(const part of ref.split('/')){if(!part || part==='..' || part==='.' || part.includes('\\'))fail('INVALID_INSPECTION_PATH');file=path.join(file,part);if(fs.lstatSync(file).isSymbolicLink())fail('SYMLINK_NOT_INSPECTED');}
    const fd=fs.openSync(file,'r');let bytes;
    try{const st=fs.fstatSync(fd);if(!st.isFile() || st.size>MAX)fail('INSPECTION_FILE_LIMIT');bytes=fs.readFileSync(fd);if(bytes.length>MAX)fail('INSPECTION_FILE_LIMIT');}finally{fs.closeSync(fd);}
    let text;try{text=new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}).decode(bytes);}catch(_){return {path:ref,state:'unknown',reason:'INVALID_UTF8',sha256:sha(bytes)};}
    return {path:ref,state:'read',sha256:sha(bytes),text};
  }catch(e){return {path:ref,state:e.code==='ENOENT'?'absent':'unknown',reason:e.code==='ENOENT'?'not-present':e.code || 'UNREADABLE'};}
}
function jsonFile(root,ref){const result=read(root,ref);if(result.state==='read'){try{return {...result,value:JSON.parse(result.text)};}catch(_){return {...result,state:'unknown',reason:'JSON_OR_JSONC_NOT_PARSED'};}}return result;}
function skillInventory(root,prefix){
  const found=[];let complete=true,visited=0;
  function walk(ref,depth=0){
    if(visited>=512 || depth>16){complete=false;found.push({path:ref,state:'unknown',reason:'INVENTORY_LIMIT'});return;}
    let entries;try{entries=fs.readdirSync(path.join(root,ref),{withFileTypes:true}).sort((a,b)=>a.name<b.name?-1:a.name>b.name?1:0);}catch(_){found.push({path:ref,state:'unknown',reason:'INVENTORY_UNREADABLE'});complete=false;return;}
    for(const e of entries){
      if(visited++>=512){complete=false;break;}
      const child=ref+'/'+e.name;
      if(e.isSymbolicLink()){found.push({path:child,state:'unknown',reason:'SYMLINK_NOT_INSPECTED'});complete=false;}
      else if(e.isDirectory())walk(child,depth+1);
      else found.push({path:child,state:'inventoried-not-read'});
    }
  }
  walk(prefix);return {files:found,complete};
}
function bridge(text){
  let fence=null,open=false,blocks=[],lines=[];
  for(const raw of text.split(/\r?\n/)){
    const line=raw.trim(),f=line.match(/^(`{3,}|~{3,})/);
    if(f){if(!fence)fence=f[1];else if(f[1][0]===fence[0] && f[1].length>=fence.length)fence=null;continue;}
    if(fence)continue;
    if(line==='<!-- BEGIN:SYNAPTIC -->'){if(open || blocks.length)return {state:'ambiguous'};open=true;lines=[];}
    else if(line==='<!-- END:SYNAPTIC -->'){if(!open)return {state:'ambiguous'};open=false;blocks.push(lines.join('\n'));}
    else if(open)lines.push(raw);
  }
  if(open)return {state:'ambiguous'};
  if(!blocks.length)return {state:'absent'};
  const pointers=[...blocks[0].matchAll(/`([^`\r\n]*BRAIN\.md)`/g)].map(x=>x[1]);
  return {state:pointers.length && pointers.every(p=>p==='.synaptic/BRAIN.md')?'scope-safe-candidate':'unresolved-or-private-pointer'};
}
function recommendations(harness,context){
  const native=harness==='copilot',node=context.permissions.node,hooks=context.permissions.hooks;
  const available=native && node==='allowed' && hooks==='allowed';
  return {
    adapterMaximum:{files:true,skill:true,commands:false,capture:native,curation:native,mcp:false},
    recommended:{files:true,skill:true,commands:false,capture:available,curation:available,mcp:false},
    conditional:native && !available && node!=='denied' && hooks!=='denied'?['capture','curation']:[],
    constraints:[...(!native?['Native events are not implemented for the Local harness.']:[]),...(node==='denied'?['Target Node execution is denied.']:[]),...(hooks==='denied'?['Target hooks are denied.']:[]),'This adapter does not configure command menus or MCP.','Permission/version/profile inputs are declarations, not host execution proof.'],
    capabilityReasons:{files:'File access is checked independently.',skill:'The existing helper installs a selected verified skill package.',commands:'No menu writer in this bounded helper.',capture:native?'Requires target Node and hook permission; genuine firing remains unverified.':'Not implemented by this Local adapter.',curation:native?'Bounded saved-source draft; model quality requires review.':'Not implemented by this Local adapter.',mcp:'No MCP setup writer in this adapter.'},
    recommendationBasis:'Candidate based on implemented adapter dialect and declared permissions; target host/version compatibility is not observed.'
  };
}
function loadIntent(root,harness,context){
  const result=jsonFile(root,`.synaptic/harness/setup/intent-vscode-${harness}.json`);
  if(result.state!=='read')return {state:result.state,reason:result.reason,source:result.path};
  try{
    const v=result.value;
    if(!v || Object.keys(v).some(k=>!['format','harness','profile','observedAt','intent','configured','history'].includes(k)) || v.history!==undefined && (!Array.isArray(v.history) || v.history.length>16) || v.format!=='synaptic-setup-record-v1' || v.harness!==harness || !(v.profile===null || typeof v.profile==='string' && v.profile.length>0 && v.profile.length<=512 && !/[\u0000-\u001f\u007f]/.test(v.profile)))fail('INVALID_SETUP_RECORD');
    if(v.observedAt!==null){validateContext({format:'synaptic-setup-context-v1',source:'recorded-declaration',observedAt:v.observedAt});}
    const intent=validateIntent(v.intent);
    if(v.profile!==null && v.profile!==context.profile)return {state:'historical',reason:'profile-unresolved-or-mismatched',source:result.path};
    const notices=passiveNotices(intent,v.configured);
    return {state:'recorded',intent,configured:v.configured,notices,source:result.path,observedAt:v.observedAt || null,historyEntries:v.history?.length || 0,scope:v.profile===null?'project-harness':'declared-profile'};
  }catch(e){return {state:'unknown',reason:e.code || 'INVALID_SETUP_RECORD',source:result.path};}
}
function inspect(input){
  if(!input || !['copilot','local'].includes(input.harness))fail('DECLARED_HARNESS_REQUIRED');
  const workspace=workspaceRoot(input.workspace),context=validateContext(input.context===undefined?{}:input.context),harness=input.harness;
  const now=input.now || new Date().toISOString();if(!validInstant(now))fail('INVALID_CHECK_TIME');
  const refs=['.synaptic/BRAIN.md','AGENTS.md','AGENTS.override.md','.github/copilot-instructions.md','.vscode/settings.json','.vscode/mcp.json','.github/hooks/synaptic-vscode.json',`.synaptic/harness/setup/vscode-${harness}.md`,'.github/skills/synaptic/SOURCE.json','.github/skills/synaptic/SKILL.md'];
  const files=refs.map(ref=>ref.endsWith('.json')?jsonFile(workspace,ref):read(workspace,ref));
  const get=ref=>files.find(f=>f.path===ref);
  const carriers=files.filter(f=>['AGENTS.md','AGENTS.override.md','.github/copilot-instructions.md'].includes(f.path)).map(f=>({path:f.path,state:f.state==='read'?bridge(f.text).state:f.state}));
  const candidates=carriers.filter(f=>f.state==='scope-safe-candidate');
  const brain=get('.synaptic/BRAIN.md');
  const skillPath='.github/skills/synaptic',receipt=get(skillPath+'/SOURCE.json');
  let installation={state:receipt.state==='absent'?'unknown':'unknown',provenance:'not-authenticated',reason:receipt.reason || 'receipt-not-verified'};
  const installedInventory=receipt.state==='read'?skillInventory(workspace,skillPath):{files:[],complete:false};
  if(receipt.state==='read'){
    try{
      if(!installedInventory.complete)fail('INSTALLED_INVENTORY_INCOMPLETE');
      const manifest=JSON.parse(receipt.text);
      if(!Array.isArray(manifest.files) || manifest.files.length>512)fail('INVALID_RECEIPT_INVENTORY');
      const allowed=ref=>validPath(ref) && !/(?:^|\/)(?:\.?env(?:\.|$)|auth(?:\.|$)|credentials?(?:\.|$)|secrets?(?:\.|$)|tokens?(?:\.|$))/i.test(ref) && (ref.endsWith('.md') || ['MANIFEST.txt','templates/playgrounds/.gitignore','templates/references/raw/.gitkeep'].includes(ref));
      if(manifest.files.some(f=>!f || !allowed(f.path) || !Number.isSafeInteger(f.bytes) || f.bytes<0 || f.bytes>MAX))fail('UNSAFE_RECEIPT_INVENTORY');
      const expected=manifest.files.map(f=>skillPath+'/'+f.path).concat(skillPath+'/SOURCE.json').sort();
      if(JSON.stringify(expected)!==JSON.stringify(installedInventory.files.map(f=>f.path).sort()))fail('UNEXPECTED_INSTALLED_FILES');
      // Only the bounded, permitted, complete declared inventory authorises content reads.
      installedInventory.files=installedInventory.files.map(f=>read(workspace,f.path));
      const result=verifySkill(path.join(workspace,skillPath));
      if(installedInventory.files.some(f=>f.state!=='read'))fail('INSTALLED_CONTENT_UNREADABLE');
      installation={state:'content-verified-receipt',engine:result.engineVersion,source:result.source,provenance:'self-consistency-only',reason:'No trusted external manifest digest supplied; content is not host loading proof.'};
    }
    catch(e){installation={state:'failed',provenance:'not-authenticated',reason:'INSTALLED_SKILL_CONTENT_CHECK_FAILED'};}
  }
  const declarationAge=context.observedAt===null?null:Date.parse(now)-Date.parse(context.observedAt),future=declarationAge!==null && declarationAge<0;
  const capabilities=recommendations(harness,future?{...context,permissions:{node:'unknown',hooks:'unknown'}}:context),intent=loadIntent(workspace,harness,context);
  const configuration={instructionCarrier:candidates.length===1?'scope-safe-candidate':candidates.length>1?'ambiguous':'unknown',effective:'unknown',reason:'User/profile/policy instruction sources are outside this project-only inspection.',carriers,
    capture:get('.github/hooks/synaptic-vscode.json').state==='read' && Array.isArray(get('.github/hooks/synaptic-vscode.json').value?.hooks?.agentStop) && get('.github/hooks/synaptic-vscode.json').value.hooks.agentStop.length>0 && get('.github/hooks/synaptic-vscode.json').value.hooks.agentStop.every(e=>e && e.type==='command' && typeof e.command==='string' && e.command.length>0)?'project-registration-present':'unknown',
    mcp:get('.vscode/mcp.json').state==='read' && get('.vscode/mcp.json').value && typeof get('.vscode/mcp.json').value==='object' && !Array.isArray(get('.vscode/mcp.json').value)?'project-config-present':'unknown'};
  const currentConfigured={files:brain.state==='read'?true:brain.state==='absent'?false:null,skill:installation.state==='content-verified-receipt'?true:get(skillPath+'/SKILL.md').state==='absent'?false:null,commands:null,capture:null,curation:null,mcp:null};
  const gaps=intent.state==='recorded'?Object.entries(intent.intent.selected).filter(([k,v])=>v && currentConfigured[k]!==true).map(([capability])=>({capability,state:currentConfigured[capability]===false?'missing':'needs-checking',reason:'Current execution/effective configuration is not inferred from the recorded setup.'})):[];
  return {format:'synaptic-setup-report-v1',observedAt:now,observer:'explicit-read-only-check',
    adapter:{id:'vscode-project',contract:'synaptic-setup-report-v1',revision:'1.8.0-rc.1'},
    declarationFreshness:{observedAt:context.observedAt,ageMs:future?null:declarationAge,state:future?'future-declaration':context.observedAt===null?'not-supplied':'declaration-only',freshness:'unknown',reason:'No expiry policy or authenticated host observer is assumed.'},
    scope:{workspace,host:'vscode',hostVersion:context.hostVersion || null,harness,harnessVersion:context.harnessVersion || null,profile:context.profile || null,session:context.session || null,identitySource:context.source,contextObservedAt:context.observedAt},
    coverage:{inspected:[...new Map([...files,...installedInventory.files].map(f=>[f.path,f])).values()].map(({path,state,reason,sha256})=>({path,state,...(reason?{reason}:{}),...(sha256?{sha256}:{})})),additionalChecks:receipt.state==='read'?[{path:skillPath,operation:'recursive-inventory-and-content-verification',state:installation.state,coverage:installedInventory.complete?'complete-tree':'verification-incomplete',limit:512}]:[],intentRecord:{path:intent.source,state:intent.state},excluded:['user configuration','policy configuration','other profiles','other hosts','nested instruction files','other project hooks','credential/auth files'],computerWide:false},
    baseline:{files:brain.state==='read'?'readable':'unknown',bridge:configuration.instructionCarrier,effective:'unknown'},installation,configuration,capabilities,intent,gaps,
    execution:{loading:'unknown',nativeFiring:'unknown',mcpConnectivity:'unknown',semanticQuality:'not-checked',reason:'File presence, configuration and retained metadata do not prove live execution.'},
    fingerprint:sha(JSON.stringify({files:[...files,...installedInventory.files].map(f=>[f.path,f.state,f.sha256 || null]),installation})),
    progress:Object.fromEntries(Object.keys(capabilities.adapterMaximum).map(k=>[k,capabilityProgress({supported:capabilities.adapterMaximum[k]?'yes':'no',permitted:future?'unknown':['capture','curation'].includes(k)?context.permissions.node==='denied' || context.permissions.hooks==='denied'?'no':context.permissions.node==='allowed' && context.permissions.hooks==='allowed'?'yes':'unknown':'unknown',selected:intent.state==='recorded'?intent.intent.selected[k]?'yes':'no':'unknown',configured:currentConfigured[k]===null?'unknown':currentConfigured[k]?'yes':'no',decision:intent.state==='recorded'?intent.intent.decisions.find(d=>d.capability===k)?.state || 'unknown':'unknown'})])),
    nextActions:[...(intent.state!=='recorded'?['Select an explicit capability target during setup.']:[]),...(gaps.length?['Review selected target gaps; request setup completion when ready.']:[]),'Use a separately authorised real-host observation for loading, native events or MCP connectivity.'],writesPerformed:0};
}
function notify(input){
  if(!['copilot','local'].includes(input.harness))fail('DECLARED_HARNESS_REQUIRED');
  const workspace=workspaceRoot(input.workspace),context=validateContext(input.context===undefined?{}:input.context),record=loadIntent(workspace,input.harness,context);
  return {format:'synaptic-setup-notices-v1',mode:'passive',recordState:record.state,reason:record.reason || null,source:record.source,snapshotObservedAt:record.observedAt || null,scope:record.scope || 'unresolved',profile:context.profile || null,notices:record.state==='recorded'?record.notices:[],basis:'Recorded setup snapshot only; no fresh inspection or execution claim.',nextAction:'Setup completion remains explicit; no prompt, inspection or repair was started.',writesPerformed:0};
}
module.exports={inspect,notify,read,workspaceRoot,recommendations,loadIntent};
