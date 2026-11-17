'use strict';
// Shared setup intent and passive notices. Pure data validation, never consent or host proof.
const CAPABILITIES=['files','skill','commands','capture','curation','mcp'];
const plain=v=>v!==null && typeof v==='object' && !Array.isArray(v) && [Object.prototype,null].includes(Object.getPrototypeOf(v));
const fail=code=>{throw Object.assign(new Error(code),{code});};
const text=v=>typeof v==='string' && v.length>0 && v.length<=512 && !/[\u0000-\u001f\u007f]/.test(v);
const date=v=>typeof v==='string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{3})?Z$/.test(v) && Number.isFinite(Date.parse(v)) && new Date(v).toISOString().replace('.000Z','Z')===v.replace('.000Z','Z');
function keys(v,allowed){return plain(v) && Reflect.ownKeys(v).every(k=>typeof k==='string' && allowed.includes(k) && Object.hasOwn(Object.getOwnPropertyDescriptor(v,k),'value'));}
function validateContext(v={}){
  if(!keys(v,['format','source','observedAt','hostVersion','harnessVersion','profile','session','permissions']))fail('INVALID_SETUP_CONTEXT');
  if(Object.keys(v).length===0)return {format:'synaptic-setup-context-v1',source:'not-supplied',observedAt:null,permissions:{node:'unknown',hooks:'unknown'}};
  if(!keys(v,['format','source','observedAt','hostVersion','harnessVersion','profile','session','permissions']) || v.format!=='synaptic-setup-context-v1' || !text(v.source) || !date(v.observedAt))fail('INVALID_SETUP_CONTEXT');
  for(const k of ['hostVersion','harnessVersion','profile','session'])if(v[k]!==undefined && !text(v[k]))fail('INVALID_SETUP_CONTEXT');
  if(v.permissions!==undefined && (!keys(v.permissions,['node','hooks']) || Object.values(v.permissions).some(x=>!['allowed','denied','unknown'].includes(x))))fail('INVALID_SETUP_CONTEXT');
  return {...v,permissions:{node:'unknown',hooks:'unknown',...v.permissions}};
}
function validateIntent(v){
  if(!keys(v,['format','selected','decisions']) || v.format!=='synaptic-setup-intent-v1' || !keys(v.selected,CAPABILITIES) || CAPABILITIES.some(k=>typeof v.selected[k]!=='boolean') || v.selected.files!==true)fail('INVALID_SETUP_INTENT');
  const decisions=v.decisions===undefined?[]:v.decisions;
  if(!Array.isArray(decisions) || decisions.length>CAPABILITIES.length)fail('INVALID_SETUP_INTENT');
  const seen=new Set();
  for(const d of decisions){
    if(!keys(d,['capability','state','at','reason','revisitOn']) || !CAPABILITIES.includes(d.capability) || seen.has(d.capability) || !['not-offered','deferred','declined'].includes(d.state) || !date(d.at) || !text(d.reason) || d.revisitOn!==undefined && !['permission-change','adapter-change','explicit-request'].includes(d.revisitOn))fail('INVALID_SETUP_INTENT');
    if(d.state==='declined' && v.selected[d.capability])fail('DECLINED_TARGET_CONFLICT');
    seen.add(d.capability);
  }
  return JSON.parse(JSON.stringify({format:v.format,selected:v.selected,decisions}));
}
function configuredTarget(intent){
  const v=validateIntent(intent),result={...v.selected};
  for(const d of v.decisions)if(['deferred','declined','not-offered'].includes(d.state))result[d.capability]=false;
  return result;
}
function reconcileIntent(previous,next,reopenDeclines=false){
  const target=validateIntent(next);
  if(!previous)return target;
  const prior=validateIntent(previous);
  for(const decision of prior.decisions){
    if(decision.state!=='declined')continue;
    const incoming=target.decisions.find(d=>d.capability===decision.capability);
    if(target.selected[decision.capability] || incoming && incoming.state!=='declined'){
      if(!reopenDeclines)fail('EXPLICIT_DECLINE_REOPEN_REQUIRED');
    }else if(!incoming)target.decisions.push(decision);
  }
  return validateIntent(target);
}
function passiveNotices(intent,configured){
  const v=validateIntent(intent);
  if(!keys(configured,CAPABILITIES) || CAPABILITIES.some(k=>typeof configured[k]!=='boolean'))fail('INVALID_CONFIGURED_SNAPSHOT');
  return CAPABILITIES.filter(k=>v.selected[k] && !configured[k]).map(capability=>{
    const d=v.decisions.find(x=>x.capability===capability);
    return {capability,state:d?d.state:'pending',reason:d?d.reason:'Selected target was not configured at the recorded setup.',nextAction:'Request setup completion when ready; no action was started.'};
  });
}
function offerEligibility(decision,event){
  if(!keys(event,['type','reopenDecline','relevantChange','alreadyOffered']) || ['reopenDecline','relevantChange','alreadyOffered'].some(k=>event[k]!==undefined && typeof event[k]!=='boolean'))fail('INVALID_SETUP_EVENT');
  if(!['boot','consolidate','explicit-request','upgrade-review','permission-change','adapter-change'].includes(event.type))fail('INVALID_SETUP_EVENT');
  if(['boot','consolidate'].includes(event.type))return {eligible:false,reason:'passive-only'};
  if(decision && decision.state==='declined')return {eligible:event.type==='explicit-request' && event.reopenDecline===true,reason:'explicit-reopening-required'};
  if(event.type==='explicit-request')return {eligible:true,reason:'owner-request'};
  if(event.relevantChange!==true)return {eligible:false,reason:'no-relevant-change'};
  if(event.alreadyOffered===true)return {eligible:false,reason:'already-offered-for-event'};
  if(decision && decision.state==='deferred' && decision.revisitOn && decision.revisitOn!==event.type)return {eligible:false,reason:'waiting-for-revisit-event'};
  return {eligible:true,reason:'relevant-explicit-review'};
}
module.exports={CAPABILITIES,validateContext,validateIntent,configuredTarget,reconcileIntent,passiveNotices,offerEligibility,validInstant:date};
