'use strict';
const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const os=require('node:os');
const {spawnSync,spawn}=require('node:child_process');
const {createBrain}=require('../tools/lib/core-lib');const {TOOLS,PROCEDURES,MAX_MESSAGE_BYTES}=require('../tools/mcp/server');
const root=fs.mkdtempSync(path.join(os.tmpdir(),'syn-mcp-'));
const brain=path.join(root,'brain é');fs.mkdirSync(path.join(brain,'knowledge'),{recursive:true});
fs.writeFileSync(path.join(brain,'BRAIN.md'),'---\nschema_version: 1.0\n---\n# MCP fixture\r\n');
fs.writeFileSync(path.join(brain,'knowledge','INDEX.md'),'[[entry]]');fs.writeFileSync(path.join(brain,'knowledge','entry.md'),'---\nstatus: active\n---\nA telescope decision\n');
const server=path.resolve(__dirname,'../tools/mcp/server.js');
const req=(id,method,params)=>({jsonrpc:'2.0',id,method,...(params===undefined?{}:{params})});
const init=req(1,'initialize',{protocolVersion:'2025-11-25',capabilities:{},clientInfo:{name:'synthetic-test-client',version:'1'}});
const ready={jsonrpc:'2.0',method:'notifications/initialized'};
function exchange(messages){const input=messages.map(m=>typeof m==='string'?m:JSON.stringify(m)).join('\n')+'\n';const r=spawnSync(process.execPath,[server,brain,'--no-sqlite'],{input,encoding:'utf8',maxBuffer:4*1024*1024,timeout:10000});assert.equal(r.status,0,r.stderr);return r.stdout.trim().split('\n').filter(Boolean).map(s=>JSON.parse(s));}
let count=0;function test(n,f){f();console.log(`ok ${++count} - ${n}`);}
async function main(){try{
  test('actual stdio negotiates lifecycle and does not answer notifications',()=>{const r=exchange([init,ready,req(2,'ping'),req(3,'tools/list')]);assert.equal(r.length,3);assert.equal(r[0].result.protocolVersion,'2025-11-25');assert.equal(r[2].result.tools.length,3);});
  test('tools delegate to current-file operations with a linked CORE equivalent',()=>{
    const r=exchange([init,ready,req(2,'tools/call',{name:'brain_status'}),req(3,'tools/call',{name:'brain_search',arguments:{query:'telescope'}}),req(4,'tools/call',{name:'brain_read',arguments:{ref:'knowledge/entry.md'}})]);
    assert.equal(JSON.parse(r[1].result.content[0].text).nodeCount,1);assert.equal(JSON.parse(r[2].result.content[0].text).hits[0].ref,'knowledge/entry.md');assert.equal(JSON.parse(r[3].result.content[0].text).text,fs.readFileSync(path.join(brain,'knowledge/entry.md'),'utf8'));
    for(const tool of TOOLS){assert.equal(tool._meta.coreProcedure,PROCEDURES[tool.name]);assert(fs.existsSync(path.join(__dirname,'../standalone/synaptic',PROCEDURES[tool.name])));}
  });
  test('resources are current-file faithful and listed refs are usable',()=>{const r=exchange([init,ready,req(2,'resources/list'),req(3,'resources/read',{uri:'synaptic:///BRAIN.md'})]);assert(r[1].result.resources.some(x=>x.uri==='synaptic:///knowledge/entry.md'));assert.equal(r[2].result.contents[0].text,fs.readFileSync(path.join(brain,'BRAIN.md'),'utf8'));});
  test('runtime enforces argument schemas and rejects unknown tools/methods',()=>{const r=exchange([init,ready,req(2,'tools/call',{name:'brain_status',arguments:{ref:'secret'}}),req(3,'tools/call',{name:'brain_search',arguments:{query:'telescope',limit:0}}),req(4,'tools/call',{name:'brain_read',arguments:{ref:'BRAIN.md',evil:true}}),req(5,'tools/call',{name:'not_a_tool'}),req(6,'not_a_method')]);assert(r.slice(1,5).every(x=>x.error.code===-32602));assert.equal(r[5].error.code,-32601);});
  test('traversal and encoded resource traversal do not expose outside data',()=>{fs.writeFileSync(path.join(root,'outside.md'),'Outside sentinel');const r=exchange([init,ready,req(2,'tools/call',{name:'brain_read',arguments:{ref:'../outside.md'}}),req(3,'resources/read',{uri:'synaptic:///%2e%2e/outside.md'})]);assert.equal(r[1].result.isError,true);assert.equal(r[1].result.content[0].text,'INVALID_REF');assert(r[2].error);assert(!JSON.stringify(r).includes('Outside sentinel'));assert(!JSON.stringify(r).includes(root));});
  test('bad JSON, invalid ids, premature calls and malformed initialize fail without crashing',()=>{const r=exchange(['{',req(2,'tools/list'),req(3,'initialize',{}),{jsonrpc:'2.0',id:{bad:1},method:'ping'},init,ready]);assert.deepEqual(r.slice(0,4).map(x=>x.error.code),[-32700,-32002,-32602,-32600]);assert(r[4].result);});
  test('oversized stdio input is bounded and exits with an error',()=>{const r=spawnSync(process.execPath,[server,brain,'--no-sqlite'],{input:'x'.repeat(MAX_MESSAGE_BYTES+1),encoding:'utf8',maxBuffer:2*1024*1024,timeout:10000});assert.equal(r.status,1,r.stderr);assert.equal(JSON.parse(r.stdout.trim()).error.message,'Message too large');});
  test('a bad note is named and skipped; search and status still answer from the valid notes',()=>{
    const mixed=path.join(root,'mixed é');fs.mkdirSync(path.join(mixed,'knowledge'),{recursive:true});
    fs.writeFileSync(path.join(mixed,'BRAIN.md'),'---\nschema_version: 1.0\n---\n# Mixed\n');
    fs.writeFileSync(path.join(mixed,'knowledge','one.md'),'One telescope\n');fs.writeFileSync(path.join(mixed,'knowledge','two.md'),'Two telescope\n');
    fs.writeFileSync(path.join(mixed,'knowledge','bad.md'),Buffer.from([0x74,0xe9]));
    const input=[init,ready,req(2,'tools/call',{name:'brain_search',arguments:{query:'telescope'}}),req(3,'tools/call',{name:'brain_status'}),req(4,'tools/call',{name:'brain_read',arguments:{ref:'knowledge/bad.md'}})].map(m=>JSON.stringify(m)).join('\n')+'\n';
    const out=spawnSync(process.execPath,[server,mixed,'--no-sqlite'],{input,encoding:'utf8',timeout:10000});assert.equal(out.status,0,out.stderr);
    const r=out.stdout.trim().split('\n').map(s=>JSON.parse(s));const skipped=[{ref:'knowledge/bad.md',reason:'DOCUMENT_INVALID_ENCODING'}];
    const search=JSON.parse(r[1].result.content[0].text),status=JSON.parse(r[2].result.content[0].text);
    assert.deepEqual(search.hits.map(h=>h.ref).sort(),['knowledge/one.md','knowledge/two.md']);assert.deepEqual(search.skipped,skipped);
    assert.equal(status.nodeCount,2);assert.deepEqual(status.skipped,skipped);assert.match(status.degraded,/documents-skipped/);
    assert.equal(r[3].result.isError,true);assert.equal(r[3].result.content[0].text,'DOCUMENT_INVALID_ENCODING: knowledge/bad.md');
    assert(!out.stdout.includes(root));
  });
  await new Promise((resolve,reject)=>{
    const child=spawn(process.execPath,[server,brain,'--no-sqlite'],{stdio:['pipe','pipe','pipe']});
    const timeout=setTimeout(()=>{child.kill();reject(Error('MCP kill test timeout'));},10000);
    child.on('error',reject);child.stdout.once('data',()=>child.kill());child.on('exit',()=>{
      clearTimeout(timeout);try{assert(fs.readFileSync(path.join(brain,'BRAIN.md'),'utf8').includes('MCP fixture'));assert.equal(createBrain(brain).status().nodeCount,1);console.log(`ok ${++count} - killed MCP leaves direct CORE file access and core-lib usable`);resolve();}catch(e){reject(e);}
    });child.stdin.write(JSON.stringify(init)+'\n');
  });
  console.log(`1..${count}`);
}finally{fs.rmSync(root,{recursive:true,force:true});}}
main().catch(e=>{console.error(e);process.exitCode=1;});
