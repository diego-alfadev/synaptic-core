'use strict';
// Optional conformance checks for reviewable CORE procedures. This module never
// loads adapter code, reads a file, applies a plan or grants write permission.
// An acceptance receipt records supplied owner intent; it is not authentication
// or a security boundary against the agent that can write that receipt.
const crypto=require('node:crypto');
const path=require('node:path');
const OPERATIONS=['inspect','capabilities','plan','apply','verify','rollback'];
const DESCRIPTOR_KEYS=['format','id','revision','origin','scope','hosts','readPaths','writePaths','operations','limitations'];
const ACCEPTANCE_KEYS=['format','descriptorSha256','acceptedBy','acceptedAt','workspace'];
function fail(code){const e=new Error(code);e.code=code;throw e;}
function record(value,keys,code){
  if(value===null || typeof value!=='object' || Array.isArray(value) || ![Object.prototype,null].includes(Object.getPrototypeOf(value)))fail(code);
  const descriptors=Object.getOwnPropertyDescriptors(value),own=Object.keys(descriptors);
  if(Reflect.ownKeys(value).length!==own.length || own.length!==keys.length || own.some(key=>!keys.includes(key)) || own.some(key=>!Object.hasOwn(descriptors[key],'value')))fail(code);
}
function text(value,max=1024){return typeof value==='string' && value.trim().length>0 && value.length<=max && !/[\u0000-\u001f\u007f-\u009f]/.test(value);}
function exactPath(value){
  if(!text(value,1024) || value!==value.normalize('NFC') || /[\\:*?"<>|]/.test(value) || value.startsWith('/'))fail('INVALID_ADAPTER_PATH');
  const components=value.split('/');
  if(components.some(part=>!part || part==='.' || part==='..' || /[. ]$/.test(part) || /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(part)) || components[0].toLowerCase()==='.git')fail('INVALID_ADAPTER_PATH');
  return value;
}
function paths(values){
  if(!Array.isArray(values) || values.length>128)fail('INVALID_ADAPTER_PATHS');
  const result=Array.from(values,exactPath),keys=result.map(value=>value.toLowerCase());
  if(new Set(keys).size!==keys.length)fail('ADAPTER_PATH_COLLISION');
  return result.slice().sort();
}
function strings(values,maxCount,maxLength){
  if(!Array.isArray(values) || values.length>maxCount || Array.from(values).some(value=>!text(value,maxLength)))fail('INVALID_ADAPTER_LIMITATIONS');
  return values.slice();
}
function stable(value){
  if(Array.isArray(value))return '['+value.map(stable).join(',')+']';
  if(value && typeof value==='object')return '{'+Object.keys(value).sort().map(key=>JSON.stringify(key)+':'+stable(value[key])).join(',')+'}';
  return JSON.stringify(value);
}
function validateAdapter(input){
  record(input,DESCRIPTOR_KEYS,'INVALID_ADAPTER_DESCRIPTOR');
  if(input.format!=='synaptic-setup-adapter-v1' || typeof input.id!=='string' || !/^[a-z][a-z0-9-]{0,63}$/.test(input.id) || !text(input.revision,64) || !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(input.revision) || !['official','user','agent'].includes(input.origin) || input.scope!=='project')fail('INVALID_ADAPTER_DESCRIPTOR');
  if(!Array.isArray(input.hosts) || !input.hosts.length || input.hosts.length>16)fail('INVALID_ADAPTER_HOSTS');
  const hosts=Array.from(input.hosts,host=>{
    record(host,['host','harness'],'INVALID_ADAPTER_HOSTS');
    if(typeof host.host!=='string' || typeof host.harness!=='string' || !/^[a-z][a-z0-9-]{0,63}$/.test(host.host) || !/^[a-z][a-z0-9-]{0,63}$/.test(host.harness))fail('INVALID_ADAPTER_HOSTS');
    return {host:host.host,harness:host.harness};
  }).sort((a,b)=>stable(a).localeCompare(stable(b),'en'));
  if(new Set(hosts.map(stable)).size!==hosts.length)fail('INVALID_ADAPTER_HOSTS');
  record(input.operations,OPERATIONS,'INVALID_ADAPTER_OPERATIONS');
  const operations={};
  for(const key of OPERATIONS){
    // Procedures may have paragraphs/newlines; all other controls are rejected.
    const body=input.operations[key];
    if(typeof body!=='string' || !body.trim() || body.length>12000 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f]/.test(body))fail('INVALID_ADAPTER_OPERATIONS');
    operations[key]=body;
  }
  const descriptor={format:input.format,id:input.id,revision:input.revision,origin:input.origin,scope:input.scope,hosts,readPaths:paths(input.readPaths),writePaths:paths(input.writePaths),operations,limitations:strings(input.limitations,32,2048)};
  // A file cannot also be a parent directory. Read/write overlap for the same
  // exact file is expected (fresh preimages); parent/child collisions are not.
  const spellings=new Map();
  for(const item of [...descriptor.readPaths,...descriptor.writePaths]){
    const key=item.toLowerCase();if(spellings.has(key) && spellings.get(key)!==item)fail('ADAPTER_PATH_COLLISION');spellings.set(key,item);
  }
  const all=[...spellings.keys()];
  for(const item of all)if(all.some(other=>other!==item && other.startsWith(item+'/')))fail('ADAPTER_PATH_COLLISION');
  const descriptorSha256=crypto.createHash('sha256').update(stable(descriptor),'utf8').digest('hex');
  return {validation:'contract-valid',descriptorSha256,descriptor,writesAuthorised:false,limitations:['Procedure semantics and real-host behaviour require review; schema validity is not acceptance.']};
}
function isoDate(value){
  if(typeof value!=='string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value))return false;
  const date=new Date(value);
  return Number.isFinite(date.getTime()) && date.toISOString()===value.replace(/(?<!\.\d{3})Z$/,'.000Z');
}
function workspaceIdentity(value){
  // The caller supplies a realpath-resolved identity after inspecting scope.
  // Equality here deliberately does not guess path case, symlinks or profiles.
  return text(value,4096) && (path.isAbsolute(value) || path.win32.isAbsolute(value));
}
function validateAcceptance(input,acceptance,scope){
  const validated=validateAdapter(input);
  if(!workspaceIdentity(scope))fail('INVALID_ADAPTER_ACCEPTANCE_SCOPE');
  if(acceptance===undefined || acceptance===null)return {accepted:false,reason:'acceptance-not-supplied',descriptorSha256:validated.descriptorSha256,writesAuthorised:false};
  record(acceptance,ACCEPTANCE_KEYS,'INVALID_ADAPTER_ACCEPTANCE');
  if(acceptance.format!=='synaptic-setup-adapter-acceptance-v1' || acceptance.acceptedBy!=='owner' || !isoDate(acceptance.acceptedAt) || !/^[a-f0-9]{64}$/.test(acceptance.descriptorSha256) || !workspaceIdentity(acceptance.workspace))fail('INVALID_ADAPTER_ACCEPTANCE');
  if(acceptance.descriptorSha256!==validated.descriptorSha256)fail('ADAPTER_ACCEPTANCE_REVISION_MISMATCH');
  if(acceptance.workspace!==scope)fail('ADAPTER_ACCEPTANCE_SCOPE_MISMATCH');
  return {accepted:true,acceptance:'owner-declared-local',descriptorSha256:validated.descriptorSha256,workspace:scope,acceptedAt:acceptance.acceptedAt,writesAuthorised:false,note:'Supplied intent only. A separate exact plan, fresh preimages and owner approval remain required.'};
}
function verifyPlanTargets(input,targets){
  const validated=validateAdapter(input),checked=paths(targets);
  if(checked.some(target=>!validated.descriptor.writePaths.includes(target)))fail('ADAPTER_PLAN_TARGET_NOT_ALLOWED');
  return {validation:'targets-within-declared-allowlist',descriptorSha256:validated.descriptorSha256,targets:checked,writesAuthorised:false,note:'Caller must check actual filesystem confinement, symlinks, owned regions, preimage drift and concrete-plan approval.'};
}
module.exports={validateAdapter,validateAcceptance,verifyPlanTargets};
