'use strict';
// Interpret explicitly supplied observation records. Never load/execute their sources,
// authenticate their observer, or turn JSON into independent live execution proof.
const {evaluateEvidence}=require('./setup-state');
const CLAIMS=['installation-integrity','configuration','file-access','loading','native-firing','mcp-connectivity','semantic-quality'];
const EXECUTION=new Set(['loading','native-firing','mcp-connectivity']);
const KEYS=['host','hostVersion','harness','harnessVersion','profile','session','workspace','fingerprint','sourceCommit','carrierDigest','adapterVersion'];
const plain=v=>v!==null && typeof v==='object' && !Array.isArray(v) && [Object.prototype,null].includes(Object.getPrototypeOf(v));
const fields=(v,allowed)=>plain(v) && Reflect.ownKeys(v).every(k=>typeof k==='string' && allowed.includes(k) && Object.hasOwn(Object.getOwnPropertyDescriptor(v,k),'value'));
const fail=code=>{throw Object.assign(new TypeError(code),{code});};
function decorateObservations(report,document){
  if(!report || report.format!=='synaptic-setup-report-v1' || !report.scope || !/^[a-f0-9]{64}$/.test(report.fingerprint))fail('INVALID_OBSERVATION_REPORT');
  if(document===undefined)return {...report,observationInput:{state:'not-supplied',reason:'No observation document was supplied; this does not establish that none exist.'},recordedObservations:[]};
  if(!fields(document,['format','observations','maxAgeMs']) || document.format!=='synaptic-setup-observations-v1' || !Array.isArray(document.observations) || document.observations.length>128 || document.maxAgeMs!==undefined && (!Number.isSafeInteger(document.maxAgeMs) || document.maxAgeMs<0))fail('INVALID_OBSERVATION_DOCUMENT');
  const carrier=report.configuration?.carriers?.filter(c=>c.state==='scope-safe-candidate') || [];
  const carrierDigest=carrier.length===1?report.coverage?.inspected?.find(f=>f.path===carrier[0].path)?.sha256 || null:null;
  const current={host:report.scope.host,hostVersion:report.scope.hostVersion,harness:report.scope.harness,harnessVersion:report.scope.harnessVersion,profile:report.scope.profile,session:report.scope.session,workspace:report.scope.workspace,fingerprint:report.fingerprint,sourceCommit:report.installation?.source?.commit || null,carrierDigest,adapterVersion:report.adapter?.revision || null};
  const recordedObservations=document.observations.map((record,index)=>{
    if(!fields(record,['claim','kind','source','observedAt','context']) || !CLAIMS.includes(record.claim) || !fields(record.context,KEYS))return {index,state:'unknown',reason:'invalid-evidence',assurance:'recorded-not-independently-verified'};
    // Missing fields in a source record must not erase known current identity.
    // Execution needs the entire known host identity; file checks retain their
    // workspace and source scope without inventing profile/session dependence.
    const required=EXECUTION.has(record.claim)?['host','harness','profile','session','fingerprint',...Object.keys(current).filter(k=>current[k]!=null)]:['fingerprint','workspace',...(['installation-integrity','semantic-quality'].includes(record.claim) && current.sourceCommit?['sourceCommit']:[])];
    const context=Object.fromEntries([...new Set([...required,...Object.keys(record.context)])].map(k=>[k,current[k] ?? null]));
    const result=evaluateEvidence(record,{claim:record.claim,context},{now:report.observedAt,...(document.maxAgeMs!==undefined?{maxAgeMs:document.maxAgeMs}:{})});
    return {index,claim:record.claim,...result};
  });
  return {...report,observationInput:{state:'supplied',count:recordedObservations.length,expiryPolicy:document.maxAgeMs===undefined?'not-supplied':'caller-supplied',reason:'Applicability evaluates supplied records only; source references were not followed and observers were not authenticated.'},recordedObservations};
}
module.exports={decorateObservations};
