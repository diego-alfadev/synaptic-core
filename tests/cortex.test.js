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
  test('bad notes are skipped by name; search and status keep serving the valid notes',()=>{
    const mixed=path.join(temp,'mixed brain é');const add=(r,t)=>{const p=path.join(mixed,r);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,t);};
    add('BRAIN.md','---\nschema_version: 1.0\n---\n# Mixed\n');add('knowledge/INDEX.md','[[alpha]] [[gamma]]');
    add('knowledge/a/alpha.md','Alpha telescope\n');add('knowledge/c/gamma.md','Gamma telescope\n');
    add('knowledge/b/alpha.md','Duplicate telescope\n');
    add('knowledge/bad/utf16.md',Buffer.concat([Buffer.from([0xff,0xfe]),Buffer.from('UTF-16 telescope\n','utf16le')]));
    add('knowledge/bad/invalid.md',Buffer.from([0x74,0x65,0x6c,0x65,0x73,0x63,0x6f,0x70,0x65,0x20,0xe9]));
    add('knowledge/bad/big.md','telescope '+'x'.repeat(1024*1024));
    add('knowledge/SCRATCH/x.md','Scratch telescope\n');
    const external=path.join(temp,'external-corpus');add('../external-corpus/secret.md','Outside telescope\n');fs.symlinkSync(external,path.join(mixed,'knowledge','link'),'junction');
    const expected=[['knowledge/SCRATCH','EXCLUDED_SCRATCH'],['knowledge/b/alpha.md','DUPLICATE_NODE_ID'],['knowledge/bad/big.md','DOCUMENT_TOO_LARGE'],
      ['knowledge/bad/invalid.md','DOCUMENT_INVALID_ENCODING'],['knowledge/bad/utf16.md','DOCUMENT_INVALID_ENCODING'],['knowledge/link','SYMLINK_REF']].map(([ref,reason])=>({ref,reason}));
    for(const options of [{},{sqlite:false}]){
      const p=createRetrieval(mixed,options);ports.push(p);
      const r=p.search('telescope');assert.deepEqual(r.hits.map(h=>h.ref).sort(),['knowledge/a/alpha.md','knowledge/c/gamma.md']);
      assert(r.hits.every(h=>h.constructor===Object));assert.deepEqual(r.skipped,expected);assert.match(r.degraded,/documents-skipped/);
      const s=p.status();assert.equal(s.nodeCount,2);assert.deepEqual(s.skipped,expected);assert.match(s.degraded,/documents-skipped/);
      if(options.sqlite===false)assert.equal(s.degraded,'sqlite-disabled,documents-skipped');
      assert(!JSON.stringify([r,s]).includes(temp));
    }
    const plain=createRetrieval(brain,{sqlite:false});ports.push(plain);assert.deepEqual(plain.search('comet').skipped,[]);assert.equal(plain.status().degraded,'sqlite-disabled');
    const p=createRetrieval(mixed,{sqlite:false});ports.push(p);
    assert.throws(()=>p.read('knowledge/SCRATCH/x.md'),/INVALID_REF/);assert.throws(()=>p.read('knowledge/link/secret.md'),/SYMLINK_REF/);
    const cli=path.resolve(__dirname,'../tools/cortex.js');
    const bad=spawnSync(process.execPath,[cli,mixed,'read','knowledge/bad/invalid.md','--no-sqlite'],{encoding:'utf8'});
    assert.equal(bad.status,1);assert.equal(bad.stderr,'DOCUMENT_INVALID_ENCODING: knowledge/bad/invalid.md\n');
    const ok=spawnSync(process.execPath,[cli,mixed,'status','--no-sqlite'],{encoding:'utf8'});assert.equal(ok.status,0,ok.stderr);assert.equal(JSON.parse(ok.stdout).skipped.length,6);
  });
  console.log(`1..${count}`);
}finally{for(const p of ports){try{p.close();}catch(_){}}fs.rmSync(temp,{recursive:true,force:true});}
