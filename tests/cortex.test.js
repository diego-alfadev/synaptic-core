'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');const os=require('node:os');
const {spawnSync}=require('node:child_process');const {createRetrieval}=require('../tools/lib/retrieval-port');
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'syn-cortex-'));
const brain=path.join(temp,'brain é [shared]');fs.mkdirSync(path.join(brain,'knowledge','notes'),{recursive:true});
const put=(r,t)=>{const p=path.join(brain,r);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,t);};
put('BRAIN.md','---\nschema_version: 1.0\n---\n# Synthetic brain\n');put('knowledge/INDEX.md','[[résumé]]');
put('knowledge/notes/résumé.md','---\nstatus: active\n---\nRésumé café telescope\n');
let count=0;function test(n,f){f();console.log(`ok ${++count} - ${n}`);}
const ports=[];
try{
  const cache=path.join(temp,'cache');fs.mkdirSync(cache);
  const port=createRetrieval(brain,{cacheDir:cache});ports.push(port);
  test('SQLite/FTS5 capability is executed and ranked, without a model',()=>{const r=port.search('café');assert.equal(r.backend,'sqlite-fts5');assert.equal(r.hits[0].ref,'knowledge/notes/résumé.md');assert.equal(r.capabilities.needsModel,false);assert.equal(typeof r.hits[0].score,'number');});
  test('one live port refreshes edited, new, renamed and deleted documents',()=>{
    put('knowledge/notes/résumé.md','Comet orbit');assert.equal(port.search('café').hits.length,0);
    put('knowledge/notes/new.md','café returned');assert.equal(port.search('café').hits[0].ref,'knowledge/notes/new.md');
    fs.renameSync(path.join(brain,'knowledge/notes/new.md'),path.join(brain,'knowledge/notes/renamed.md'));
    assert.equal(port.search('café').hits[0].ref,'knowledge/notes/renamed.md');
    fs.unlinkSync(path.join(brain,'knowledge/notes/renamed.md'));assert.equal(port.search('café').hits.length,0);
  });
  test('absent SQLite uses current-file fallback with lower capability',()=>{
    const fallback=createRetrieval(brain,{sqlite:false});ports.push(fallback);const r=fallback.search('comet');
    assert.equal(r.backend,'file-lexical');assert.equal(r.capabilities.ranked,false);assert(!('score' in r.hits[0]));
  });
  test('queries are inert values and invalid input is rejected',()=>{
    assert.equal(port.search('comet " OR DROP TABLE cortex_docs --').hits.length,0);
    for(const q of ['', '""', 'x'.repeat(1025),null]) assert.throws(()=>port.search(q),/INVALID_QUERY/);
    assert.throws(()=>port.search('comet',{limit:101}),/INVALID_LIMIT/);
    assert.equal(port.search('comet').hits.length,1);
  });
  test('compatibility Unicode normalization agrees with direct-file lexical matching',()=>{
    put('knowledge/notes/compatibility.md','ＡＬＰＨＡ oﬃce');
    const fallback=createRetrieval(brain,{sqlite:false});ports.push(fallback);
    for(const query of ['alpha','office']){
      assert.equal(port.search(query).hits[0].ref,'knowledge/notes/compatibility.md');
      assert.deepEqual(port.search(query).hits.map(h=>h.ref),fallback.search(query).hits.map(h=>h.ref));
    }
  });
  test('Turkish dotted-I uses exactly the same token boundaries in both providers',()=>{
    put('knowledge/notes/turkish.md','İSTANBUL');
    const fallback=createRetrieval(brain,{sqlite:false});ports.push(fallback);
    for(const query of ['İSTANBUL','i stanbul']) {
      const actual=port.search(query);
      assert.equal(actual.backend,'sqlite-fts5');
      assert.deepEqual(actual.hits.map(h=>h.ref),['knowledge/notes/turkish.md']);
      assert.deepEqual(actual.hits.map(h=>h.ref),fallback.search(query).hits.map(h=>h.ref));
    }
  });
  test('underscore token has no false-positive decoys before SQL candidate LIMIT',()=>{
    for(let i=0;i<12;i++) put(`knowledge/notes/a${i}.md`,'foo-bar');
    put('knowledge/notes/z.md','foo_bar');
    const fallback=createRetrieval(brain,{sqlite:false});ports.push(fallback);
    const actual=port.search('foo_bar');
    assert.equal(actual.backend,'sqlite-fts5');
    assert.deepEqual(actual.hits.map(h=>h.ref),['knowledge/notes/z.md']);
    assert.deepEqual(actual.hits.map(h=>h.ref),fallback.search('foo_bar').hits.map(h=>h.ref));
    assert.deepEqual(port.search('foo_bar',{limit:1}).hits.map(h=>h.ref),['knowledge/notes/z.md']);
  });
  test('corrupt persistent cache degrades and does not destroy source files',()=>{
    port.close();const file=path.join(cache,fs.readdirSync(cache).find(f=>f.endsWith('.sqlite')));fs.writeFileSync(file,'not SQLite');
    const bad=createRetrieval(brain,{cacheDir:cache});ports.push(bad);assert.equal(bad.search('comet').backend,'file-lexical');assert.equal(bad.read('knowledge/notes/résumé.md').text,'Comet orbit');
  });
  test('unavailable cache degrades; an unknown path is not created',()=>{
    const missing=path.join(temp,'not-created');const bad=createRetrieval(brain,{cacheDir:missing});ports.push(bad);
    assert.equal(bad.search('comet').backend,'file-lexical');assert.equal(fs.existsSync(missing),false);
  });
  test('CLI emits machine-readable output and rejects unknown/traversal arguments',()=>{
    const cli=path.resolve(__dirname,'../tools/cortex.js');
    const run=args=>spawnSync(process.execPath,[cli,...args],{encoding:'utf8'});
    const r=run([brain,'search','comet','--no-sqlite']);assert.equal(r.status,0,r.stderr);assert.equal(JSON.parse(r.stdout).hits.length,1);
    for(const args of [[brain,'read','../secret.md'],[brain,'status','extra'],[brain,'status','--wat'],[brain,'status','--cache-dir']]) assert.equal(run(args).status,1);
  });
  console.log(`1..${count}`);
}finally{for(const p of ports){try{p.close();}catch(_){}}fs.rmSync(temp,{recursive:true,force:true});}
