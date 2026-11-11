'use strict';
// Isolated fixture adapter tests: fake event + hand-authored model-result fixture.
// These are not evidence of native event firing or model execution in Codex.
const assert=require('node:assert/strict');
const fs=require('node:fs');const os=require('node:os');const path=require('node:path');
const {spawnSync,spawn}=require('node:child_process');
const {stop,status,archive,recoverLock,sha,OBSERVER_LOCK_ID}=require('../tools/lib/curation-stop');
// Real path: macOS temp roots are symlinks and the adapter compares canonical paths.
const base=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'syn-curation-')));
let count=0;
function fixture(){
  const workspace=fs.mkdtempSync(path.join(base,'workspace é ')),brain=path.join(workspace,'.synaptic');
  function put(ref,value){const file=path.join(brain,ref);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,value);}
  put('BRAIN.md','---\nschema_version: 1.0\n---\n# Synthetic\n');
  put('journal/_current.md','# Resume\nDecision: Keep the synthetic archive offline. Next: test the restore path.\n');
  put('knowledge/INDEX.md','[[archive-policy]]');
  put('knowledge/archive-policy.md','# Existing policy\nThe archive is local.\n');
  put('harness/guardrails.md','# Guardrails\nApproval remains required.\n');
  const config={brain,workspace,profile:'native'};
  const event=(turn='original',active=false,session='synthetic-session')=>({hook_event_name:'Stop',cwd:workspace,session_id:session,turn_id:turn,stop_hook_active:active,last_assistant_message:'RAW_TRANSCRIPT_SENTINEL_MUST_NOT_PERSIST'});
  return {workspace,brain,put,config,event};
}
function request(f,result){return JSON.parse(fs.readFileSync(path.join(f.brain,'playgrounds/curation',result.status.requestId,'request.json'),'utf8'));}
function complete(f,r,outcome='curated-draft'){
  const q=request(f,r);
  const artifact=['# Curation result',`Request: ${q.requestId}`,'','## Curated notes',
    outcome==='no-durable-change'?'The saved source repeats the existing offline archive decision. No additional durable fact is supported; retain the restore-path task without inventing another policy.':'The saved decision keeps the synthetic archive offline. The next recorded action is to test restoration; this draft preserves that distinction without claiming the restore was tested.',
    '','## Provenance',...q.sources.map(s=>`- [${s.ref}](${s.link}) ${s.ref} sha256:${s.sha256}`),'','## Limitations','This fixture validates persisted structure only; semantic review and live model execution are unproven.',''].join('\n');
  f.put(q.artifactRef,artifact);
  f.put(q.receiptRef,JSON.stringify({requestId:q.requestId,artifactKind:'curated-draft',promotionState:'not_promoted',sourceHashes:q.sources.map(s=>({ref:s.ref,sha256:s.sha256})),artifactSha256:sha(Buffer.from(artifact)),outcome}));
  return q;
}
function test(name,fn){fn();console.log(`ok ${++count} - ${name}`);}
try{
  test('assisted default is honestly off and creates no curation state',()=>{
    const f=fixture();const c={brain:f.brain,workspace:f.workspace};assert.deepEqual(stop(c,{}).hook,{});assert.equal(status(c).capability,'assisted');assert.equal(status(c).state,'missing');assert(!fs.existsSync(path.join(f.brain,'.curation-state')));
  });
  test('one native continuation; different continuation turn id verifies persisted draft',()=>{
    const f=fixture(),r=stop(f.config,f.event());assert.equal(r.hook.decision,'block');
    const q=complete(f,r);const done=stop(f.config,f.event('new-continuation-turn',true));
    assert.equal(done.hook.decision,undefined);assert.equal(done.status.state,'structurally_checked');assert.equal(done.status.promotionState,'not_promoted');assert.equal(done.status.nativeTrigger,'unproven_by_adapter');assert.equal(done.status.semanticQuality,'not_checked');
    assert.equal(status(f.config).artifactRef,q.artifactRef);assert.equal(status(f.config).state,'structurally_checked');
  });
  test('self-report without real artifact stays visibly pending and never loops',()=>{
    const f=fixture(),r=stop(f.config,f.event());const q=request(f,r);
    f.put(q.receiptRef,JSON.stringify({requestId:q.requestId,outcome:'curated-draft',artifactSha256:'fake'}));
    for(const e of [f.event('continued',true),f.event('later-original',false)]){
      const result=stop(f.config,e);assert.equal(result.hook.decision,undefined);assert.equal(result.status.state,'pending');assert.match(result.hook.systemMessage,/pending/);
    }
    assert.equal(fs.readdirSync(path.join(f.brain,'.curation-state','requests')).length,1);
  });
  test('changed source invalidates; explicit archive retains work and permits only a later original turn',()=>{
    const f=fixture(),r=stop(f.config,f.event());complete(f,r);f.put('journal/_current.md','# New decision\nThe archive policy needs owner review.\n');
    assert.equal(stop(f.config,f.event('continued',true)).status.reason,'SOURCE_CHANGED');
    const saved=archive(f.config,r.status.requestId,'Owner abandons stale input; retain its evidence.');assert.equal(saved.state,'archived_pending');
    assert.equal(stop(f.config,f.event('original',true)).hook.decision,undefined);
    const next=stop(f.config,f.event('new-original',false));assert.equal(next.hook.decision,'block');assert.notEqual(next.status.requestId,r.status.requestId);
    assert.equal(fs.readdirSync(path.join(f.brain,'.curation-state','requests')).length,2);assert(fs.existsSync(path.join(f.brain,r.status.artifactRef)));
  });
  test('unchanged handled sources are a no-op in the same or a fresh session',()=>{
    const f=fixture(),r=stop(f.config,f.event());complete(f,r);stop(f.config,f.event('continuation',true));
    for(const e of [f.event('next-original'),f.event('fresh-original',false,'another-session')]){const next=stop(f.config,e);assert.deepEqual(next.hook,{});assert.equal(next.status.unchanged,true);}
    assert.equal(fs.readdirSync(path.join(f.brain,'.curation-state','requests')).length,1);
  });
  test('no-durable-change and approval-needed remain distinct outcomes',()=>{
    for(const [outcome,state] of [['no-durable-change','no_change'],['approval-needed','pending']]){const f=fixture(),r=stop(f.config,f.event());complete(f,r,outcome);const result=stop(f.config,f.event('continued',true));assert.equal(result.status.state,state);assert.equal(result.hook.decision,undefined);}
  });
  test('older pending work remains discoverable after another session completes',()=>{
    const f=fixture(),older=stop(f.config,f.event());
    const newer=stop(f.config,f.event('original-b',false,'session-b'));complete(f,newer);stop(f.config,f.event('continued-b',true,'session-b'));
    const observed=status(f.config);assert.equal(observed.state,'structurally_checked');assert.equal(observed.unresolvedCount,1);
    assert(observed.retainedWork.some(r=>r.requestId===older.status.requestId && r.recordedState==='pending'));
  });
  test('protected knowledge/harness edits invalidate the draft without reverting or deleting evidence',()=>{
    const f=fixture(),r=stop(f.config,f.event());complete(f,r);f.put('harness/guardrails.md','# Changed unexpectedly\n');
    const result=stop(f.config,f.event('continued',true));assert.equal(result.status.reason,'PROTECTED_SCOPE_CHANGED');assert(fs.existsSync(path.join(f.brain,r.status.artifactRef)));
  });
  test('unselected authoritative files are also protected during the curation pass',()=>{
    const f=fixture(),r=stop(f.config,f.event());complete(f,r);f.put('registries/owner-record.md','# Unauthorised addition\n');
    assert.equal(stop(f.config,f.event('continued',true)).status.reason,'PROTECTED_SCOPE_CHANGED');
  });
  test('Copilot instruction and selected hook changes invalidate pending model work',()=>{
    for(const ref of ['.github/copilot-instructions.md','.github/hooks/synaptic-vscode.json']){
      const f=fixture(),file=path.join(f.workspace,ref);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,'Original project configuration\n');
      const r=stop(f.config,f.event());complete(f,r);fs.writeFileSync(file,'Changed project configuration\n');
      assert.equal(stop(f.config,f.event('continued',true)).status.reason,'PROTECTED_SCOPE_CHANGED');
    }
  });
  test('cross-session pointer forgery and orphan continuation are rejected',()=>{
    const f=fixture(),r=stop(f.config,f.event());complete(f,r);
    const other=sha('another-session');f.put(`.curation-state/sessions/${other}.json`,JSON.stringify({id:r.status.requestId}));
    assert.throws(()=>stop(f.config,f.event('continued',true,'another-session')),/INVALID_SESSION_STATE/);
    const g=fixture();assert.equal(stop(g.config,g.event('continued',true)).status.reason,'ORPHAN_CONTINUATION');
  });
  test('artifact/hash/request/source bindings are checked, not receipt status alone',()=>{
    const f=fixture(),r=stop(f.config,f.event());const q=complete(f,r);f.put(q.artifactRef,'# Replaced artifact\n');
    assert.equal(stop(f.config,f.event('continued',true)).status.reason,'OUTPUT_PROOF_MISMATCH');
    const file=path.join(f.brain,'.curation-state','requests',r.status.requestId+'.json');const record=JSON.parse(fs.readFileSync(file));record.sources[0].sha256='0'.repeat(64);fs.writeFileSync(file,JSON.stringify(record));
    assert.equal(status(f.config).reason,'INVALID_REQUEST_STATE');
  });
  test('out-of-order, duplicate or empty curated sections cannot borrow long metadata as content',()=>{
    for(const mode of ['out-of-order','duplicate','empty']){
      const f=fixture(),r=stop(f.config,f.event()),q=complete(f,r);
      const file=path.join(f.brain,q.artifactRef);let body=fs.readFileSync(file,'utf8');
      if(mode==='out-of-order')body=body.replace('## Curated notes','## Temporary').replace('## Provenance','## Curated notes').replace('## Temporary','## Provenance');
      else if(mode==='duplicate')body=body.replace('## Curated notes','## Curated notes\n## Curated notes');
      else body=body.replace(/## Curated notes[\s\S]*?## Provenance/,'## Curated notes\n\n## Provenance');
      f.put(q.artifactRef,body);const receipt=JSON.parse(fs.readFileSync(path.join(f.brain,q.receiptRef)));receipt.artifactSha256=sha(Buffer.from(body));f.put(q.receiptRef,JSON.stringify(receipt));
      const observed=stop(f.config,f.event('continued',true));assert.equal(observed.status.state,'pending');assert(['OUTPUT_STRUCTURE_INVALID','CURATION_CONTENT_REQUIRED'].includes(observed.status.reason));
    }
  });
  test('raw event text is not persisted; selected source coverage is explicit',()=>{
    const f=fixture();stop(f.config,f.event());let all='';
    function walk(p){for(const e of fs.readdirSync(p,{withFileTypes:true})){const q=path.join(p,e.name);if(e.isDirectory())walk(q);else all+=fs.readFileSync(q,'utf8');}}
    walk(f.brain);assert(!all.includes('RAW_TRANSCRIPT_SENTINEL'));assert(!all.includes('last_assistant_message'));
    assert.throws(()=>stop({...f.config,sources:['../outside.md']},f.event()),/INVALID_SOURCE_REF/);
    const g=fixture();g.put('journal/large.md','x'.repeat(32769));assert.throws(()=>stop({...g.config,sources:['journal/large.md']},g.event('large')),/SOURCE_LIMIT/);
  });
  test('symlink/junction destinations and dangling leaf links cannot cause arbitrary writes',()=>{
    const f=fixture(),outside=path.join(f.workspace,'outside');fs.mkdirSync(outside);
    fs.symlinkSync(outside,path.join(f.brain,'.curation-state'),'junction');assert.throws(()=>stop(f.config,f.event()),/UNSAFE_PATH/);assert.deepEqual(fs.readdirSync(outside),[]);
    const g=fixture();const r=stop(g.config,g.event());complete(g,r);stop(g.config,g.event('continued',true));
    const latest=path.join(g.brain,'.curation-state','latest.json');fs.unlinkSync(latest);const target=path.join(g.workspace,'not-created.json');
    try{fs.symlinkSync(target,latest,'file');}catch(e){if(e.code==='EPERM'){console.log('# file symlink creation requires OS privilege; junction boundary exercised');return;}throw e;}
    g.put('journal/_current.md','# Changed source\nAnother explicit decision requires a new draft.\n');
    assert.throws(()=>stop(g.config,g.event('new-session-original',false,'third-session')),/UNSAFE_PATH/);assert(!fs.existsSync(target));
  });
  test('killed-observer lock has explicit hash-pinned recovery, never automatic active-lock removal',()=>{
    const f=fixture(),r=stop(f.config,f.event());
    const id=OBSERVER_LOCK_ID,ref=`.curation-state/locks/${id}.lock`;
    f.put(ref,JSON.stringify({pid:process.pid}));assert.equal(stop(f.config,f.event('continued',true)).status.reason,'OBSERVER_BUSY');
    let lock=status(f.config).retainedLocks[0];assert.throws(()=>recoverLock(f.config,id,lock.sha256,'yes'),/LOCK_OWNER_STILL_RUNNING|LOCK_OWNER_UNVERIFIED/);
    assert(fs.existsSync(path.join(f.brain,ref)));
    const originalKill=process.kill;
    try{
      process.kill=()=>{const e=new Error('permission denied');e.code='EPERM';throw e;};
      assert.throws(()=>recoverLock(f.config,id,lock.sha256,'yes'),/LOCK_OWNER_UNVERIFIED/);
      assert(fs.existsSync(path.join(f.brain,ref)));
    }finally{process.kill=originalKill;}
    f.put(ref,'interrupted observer metadata');lock=status(f.config).retainedLocks[0];
    assert.throws(()=>recoverLock(f.config,id,'0'.repeat(64),'yes'),/LOCK_CHANGED/);
    assert.equal(recoverLock(f.config,id,lock.sha256,'yes').workRetained,true);
    assert(fs.existsSync(path.join(f.brain,'.curation-state/requests',r.status.requestId+'.json')));
  });
  test('corrupt latest pointer is pending, not missing, and does not hide retained work',()=>{
    const f=fixture(),r=stop(f.config,f.event());f.put('.curation-state/latest.json','{"id":');
    const observed=status(f.config);assert.equal(observed.state,'pending');assert.equal(observed.reason,'STATE_UNREADABLE');assert(observed.retainedWork.some(q=>q.requestId===r.status.requestId));
  });
  test('request capacity is explicit and exhaustion never discards prior requests',()=>{
    const f=fixture(),r=stop(f.config,f.event());
    const original=JSON.parse(fs.readFileSync(path.join(f.brain,'.curation-state/requests',r.status.requestId+'.json')));
    for(let i=1;i<128;i++){
      const record={...original,turn:sha('synthetic-original-'+i),state:'archived'};
      record.id=sha(JSON.stringify({session:record.session,turn:record.turn,sources:record.sources,protected:record.protected}));
      record.artifactRef=`playgrounds/curation/${record.id}/artifact.md`;record.receiptRef=`playgrounds/curation/${record.id}/receipt.json`;
      f.put(`.curation-state/requests/${record.id}.json`,JSON.stringify(record));
    }
    assert.equal(status(f.config).capacity.state,'exhausted');
    assert.throws(()=>stop(f.config,f.event('new-original',false,'new-session')),/REQUEST_LIMIT/);
    assert.equal(fs.readdirSync(path.join(f.brain,'.curation-state/requests')).length,128);
  });
  test('legacy overflow is explicit and the 129th retained request is not hidden',()=>{
    const f=fixture(),r=stop(f.config,f.event());
    const original=JSON.parse(fs.readFileSync(path.join(f.brain,'.curation-state/requests',r.status.requestId+'.json')));
    let lastId;
    for(let i=1;i<129;i++){
      const record={...original,turn:sha('legacy-overflow-'+i),state:'archived'};
      record.id=sha(JSON.stringify({session:record.session,turn:record.turn,sources:record.sources,protected:record.protected}));
      record.artifactRef=`playgrounds/curation/${record.id}/artifact.md`;record.receiptRef=`playgrounds/curation/${record.id}/receipt.json`;
      f.put(`.curation-state/requests/${record.id}.json`,JSON.stringify(record));lastId=record.id;
    }
    const observed=status(f.config);assert.equal(observed.state,'pending');assert.equal(observed.reason,'REQUEST_INVENTORY_OVERFLOW');
    assert.equal(observed.capacity.retainedRequests,129);assert.equal(observed.capacity.state,'overflow');assert.equal(observed.inventoryTruncated,false);
    assert.equal(observed.retainedWork.length,129);assert(observed.retainedWork.some(q=>q.requestId===lastId));
  });
  test('two real processes cannot race the shared 127-to-128 admission boundary',()=>{
    const f=fixture(),r=stop(f.config,f.event());
    const original=JSON.parse(fs.readFileSync(path.join(f.brain,'.curation-state/requests',r.status.requestId+'.json')));
    for(let i=1;i<127;i++){
      const record={...original,turn:sha('before-race-'+i),state:'archived'};
      record.id=sha(JSON.stringify({session:record.session,turn:record.turn,sources:record.sources,protected:record.protected}));
      record.artifactRef=`playgrounds/curation/${record.id}/artifact.md`;record.receiptRef=`playgrounds/curation/${record.id}/receipt.json`;
      f.put(`.curation-state/requests/${record.id}.json`,JSON.stringify(record));
    }
    const barrier=path.join(f.workspace,'admission-paused'),release=path.join(f.workspace,'release-admission'),resultFile=path.join(f.workspace,'observer-result.json');
    const modulePath=path.resolve(__dirname,'../tools/lib/curation-stop.js');
    const childScript=`
      const fs=require('node:fs'),path=require('node:path');
      const [mod,configText,eventText,barrier,release,resultFile]=process.argv.slice(1);
      const config=JSON.parse(configText),event=JSON.parse(eventText),requests=path.join(config.brain,'.curation-state','requests');
      const original=fs.readdirSync;let paused=false;
      fs.readdirSync=function(dir,...args){const entries=original.call(fs,dir,...args);
        if(!paused && path.resolve(dir)===requests){paused=true;fs.writeFileSync(barrier,'paused');const end=Date.now()+10000;
          while(!fs.existsSync(release)){if(Date.now()>end)throw Error('BARRIER_TIMEOUT');Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,10);}}
        return entries;};
      try{const result=require(mod).stop(config,event);fs.writeFileSync(resultFile,JSON.stringify(result));}
      catch(e){fs.writeFileSync(resultFile,JSON.stringify({error:e.code||e.message}));process.exitCode=1;}
    `;
    const child=spawn(process.execPath,['-e',childScript,modulePath,JSON.stringify(f.config),JSON.stringify(f.event('process-a',false,'session-a')),barrier,release,resultFile],{stdio:'ignore'});
    function wait(file){const end=Date.now()+12000;while(!fs.existsSync(file)){if(Date.now()>end)throw Error('Child barrier timeout');Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,10);}}
    try{
      wait(barrier);
      const cli=path.resolve(__dirname,'../tools/codex-curation.js');
      const b=spawnSync(process.execPath,[cli,'stop','--brain',f.brain,'--workspace',f.workspace,'--profile','native'],{input:JSON.stringify(f.event('process-b',false,'session-b')),encoding:'utf8',timeout:10000});
      assert.equal(b.status,0,b.stderr);const blocked=JSON.parse(b.stdout);assert.equal(blocked.decision,undefined);assert.match(blocked.systemMessage,/another observer/);
      assert.equal(fs.readdirSync(path.join(f.brain,'.curation-state/requests')).length,127);
      fs.writeFileSync(release,'release');wait(resultFile);const a=JSON.parse(fs.readFileSync(resultFile,'utf8'));
      assert.equal(a.hook.decision,'block',JSON.stringify(a));
      assert.equal(fs.readdirSync(path.join(f.brain,'.curation-state/requests')).length,128);
      assert.throws(()=>stop(f.config,f.event('process-b-later',false,'session-b')),/REQUEST_LIMIT/);
      assert.equal(fs.readdirSync(path.join(f.brain,'.curation-state/requests')).length,128);
    }finally{child.kill();}
  });
  test('denied lock writes retain the permission error rather than pretending another observer exists',()=>{
    const f=fixture(),originalOpen=fs.openSync;
    try{
      fs.openSync=function(file,flags,...rest){
        if(flags==='wx' && String(file).endsWith('.lock')){const e=new Error('permission denied');e.code='EACCES';throw e;}
        return originalOpen.call(fs,file,flags,...rest);
      };
      assert.throws(()=>stop(f.config,f.event()),e=>e.code==='EACCES');
      assert.equal(status(f.config).state,'pending');
      assert(!fs.existsSync(path.join(f.brain,'playgrounds/curation')));
    }finally{fs.openSync=originalOpen;}
  });
  test('CLI emits valid hook JSON on invalid input and status remains unproven',()=>{
    const f=fixture(),cli=path.resolve(__dirname,'../tools/codex-curation.js');
    const args=['--brain',f.brain,'--workspace',f.workspace,'--profile','native'];
    const r=spawnSync(process.execPath,[cli,'stop',...args],{input:'not-json',encoding:'utf8'});assert.equal(r.status,0);assert.match(JSON.parse(r.stdout).systemMessage,/pending/);assert(!JSON.parse(r.stdout).decision);
    const s=spawnSync(process.execPath,[cli,'status',...args],{encoding:'utf8'});assert.equal(s.status,0);const value=JSON.parse(s.stdout);assert.equal(value.state,'missing');assert.equal(value.nativeTrigger,'unproven_by_adapter');
  });
  test('capture-floor marker and appended source lines do not invalidate a pending draft',()=>{
    const marker=fixture(),r1=stop(marker.config,marker.event());complete(marker,r1);
    marker.put('journal/_activity/2026-11-11.log','stop 12:00 session-a\n');fs.appendFileSync(path.join(marker.brain,'journal/_activity/2026-11-11.log'),'stop 12:01 session-a\n');
    assert.equal(stop(marker.config,marker.event('continued',true)).status.state,'structurally_checked');
    const grown=fixture(),r2=stop(grown.config,grown.event());complete(grown,r2);
    fs.appendFileSync(path.join(grown.brain,'journal/_current.md'),'- 12:02 breadcrumb: edited app.txt\n');
    assert.equal(stop(grown.config,grown.event('continued',true)).status.state,'structurally_checked');
    const edited=fixture(),r3=stop(edited.config,edited.event());complete(edited,r3);
    const file=path.join(edited.brain,'journal/_current.md'),bytes=fs.readFileSync(file);bytes[2]=bytes[2]===0x52?0x72:0x52;fs.writeFileSync(file,Buffer.concat([bytes,Buffer.from('appended\n')]));
    assert.equal(stop(edited.config,edited.event('continued',true)).status.reason,'SOURCE_CHANGED');
    const knowledge=fixture(),r4=stop(knowledge.config,knowledge.event());complete(knowledge,r4);
    knowledge.put('journal/_activity/x.log','marker\n');knowledge.put('knowledge/archive-policy.md','# Changed policy\n');
    assert.equal(stop(knowledge.config,knowledge.event('continued',true)).status.reason,'PROTECTED_SCOPE_CHANGED');
  });
  test('a large playgrounds/archive is one protected entry; additions there still invalidate',()=>{
    const f=fixture();
    for(let i=0;i<600;i++)f.put(`playgrounds/archive/closed-${String(i).padStart(3,'0')}/tasks.md`,`# Closed ${i}\n`);
    f.put('playgrounds/archive/big/data.md','x'.repeat(2*1024*1024));
    const r=stop(f.config,f.event());assert.equal(r.hook.decision,'block');
    const q=JSON.parse(fs.readFileSync(path.join(f.brain,'.curation-state/requests',r.status.requestId+'.json'),'utf8'));
    assert(/^[a-f0-9]{64}$/.test(q.protected['brain:playgrounds/archive']));assert(!Object.keys(q.protected).some(k=>k.startsWith('brain:playgrounds/archive/')));
    complete(f,r);f.put('playgrounds/archive/closed-600/tasks.md','# Closed later\n');
    assert.equal(stop(f.config,f.event('continued',true)).status.reason,'PROTECTED_SCOPE_CHANGED');
    if(process.platform!=='win32'){const g=fixture();g.put('playgrounds/archive/a.md','A\n');fs.symlinkSync(path.join(g.brain,'knowledge'),path.join(g.brain,'playgrounds/archive/link'));assert.throws(()=>stop(g.config,g.event()),/UNSAFE_PATH/);}
  });
  console.log(`1..${count}`);
}finally{fs.rmSync(base,{recursive:true,force:true});}
