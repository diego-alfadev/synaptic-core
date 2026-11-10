'use strict';
// Golden facts derive from references/contract.md §§1-4 / audit.md, not a second parser.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createBrain } = require('../tools/lib/core-lib');
const { buildBrainGraph } = require('../tools/lib/brain-graph');
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'syn-core-'));
const brain = path.join(root, 'brain é [notes]');
function put(ref, text) { const p=path.join(brain,ref); fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,text); }
function node(status, body, extra = '') { return `---\ndescription: A fixture\ntype: concept\nstatus: ${status}\nupdated: 2026-11-07\nlifecycle: dormant\ntags: [fixture]\n${extra}---\n${body}`; }
let count=0;
function test(name, fn) {fn();console.log(`ok ${++count} - ${name}`);}
try {
  put('BRAIN.md','---\nschema_version: 1.0\n---\n# Synthetic brain\n');
  put('knowledge/INDEX.md','[[first]] [[second]]\n');
  put('knowledge/one/_index.md','[[first]] [[second]]\n');
  put('knowledge/one/first.md',node('active','One [[second]]\n`[[ghost]]`\n'));
  put('knowledge/one/second.md',node('archived','Second\n'));
  const b=createBrain(brain);
  test('golden graph: two non-MOC nodes, one edge, zero orphan, two MOC-reachable',()=>{
    assert.deepEqual(b.status(),{schema:'1.0',nodeCount:2,edgeCount:1,orphanCount:0,mocReachableCount:2,source:'current-files',coreProcedure:'references/audit.md'});
  });
  test('expanded golden: typed/body edges, aliases/anchors, excluded code/comments, orphan and unresolved',()=>{
    const golden=path.join(root,'golden typed and body');
    function write(ref,text){const file=path.join(golden,ref);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,text);}
    write('BRAIN.md','---\nschema_version: 1.0\n---\n# Golden contract\n');
    write('knowledge/INDEX.md','[[alpha]] [[beta]]\n');
    write('knowledge/facts/_index.md','[[alpha]] [[beta]]\n');
    write('knowledge/facts/alpha.md',node('active',[
      '[[gamma#Specific anchor|Friendly alias]]',
      '[[beta|Duplicate body edge]]',
      '`[[ghost-inline]]`',
      '```md','[[ghost-fenced]]','```',
      '<!-- [[ghost-comment]] -->',
      '<!--','[[ghost-multiline-comment]]','-->',
      '[[missing-node]]'
    ].join('\n'),'relates_to:\n  - "[[beta]]"\n'));
    write('knowledge/facts/beta.md',node('archived','Archived but linked.'));
    write('knowledge/facts/gamma.md',node('active','Alias target.'));
    write('knowledge/facts/orphan.md',node('stale','No links.'));
    // Literal oracle from the contract: four non-MOC nodes, two deduplicated undirected
    // edges, one orphan, two MOC-reachable nodes, one authored unresolved target.
    assert.deepEqual(createBrain(golden).status(),{schema:'1.0',nodeCount:4,edgeCount:2,orphanCount:1,mocReachableCount:2,source:'current-files',coreProcedure:'references/audit.md'});
    const g=buildBrainGraph(golden);
    assert.equal(g.unresolvedCount,1);
    assert.deepEqual(g.edgeList.sort((a,b)=>a.b.localeCompare(b.b)),[
      {a:'alpha',b:'beta',type:'relates_to'},
      {a:'alpha',b:'gamma',type:'wikilink'}
    ]);
    assert.deepEqual({...g.degreeOf},{alpha:2,beta:1,gamma:1,orphan:0});
  });
  test('status/lifecycle label never hides archived or dormant knowledge',()=>{
    assert.equal(b.documents().length,2);assert.equal(b.documents()[1].metadata.status,'archived');
  });
  test('resource read is current-file faithful, including CRLF',()=>{
    put('journal/_current.md','# Resume\r\nnext step\r\n');
    assert.equal(b.read('journal/_current.md').text,'# Resume\r\nnext step\r\n');
  });
  test('UTF-8 BOM is preserved and malformed UTF-8 is rejected rather than replaced',()=>{
    put('journal/bom.md','\ufeff# Byte faithful\r\n');
    assert.equal(b.read('journal/bom.md').text,'\ufeff# Byte faithful\r\n');
    fs.writeFileSync(path.join(brain,'journal/invalid.md'),Buffer.from([0x63,0x61,0x66,0xe9]));
    assert.throws(()=>b.read('journal/invalid.md'),/DOCUMENT_INVALID_ENCODING/);
  });
  test('current graph reflects add, rename, deletion without restarting facade',()=>{
    put('knowledge/one/third.md',node('active','Third'));
    assert.equal(b.status().nodeCount,3);
    fs.renameSync(path.join(brain,'knowledge/one/third.md'),path.join(brain,'knowledge/one/fourth.md'));
    assert(b.documents().some(d=>d.id==='fourth'));
    fs.unlinkSync(path.join(brain,'knowledge/one/fourth.md'));assert.equal(b.status().nodeCount,2);
  });
  test('traversal, absolute, hidden, backslash and scratch refs rejected',()=>{
    for(const ref of ['../outside.md','/outside.md','C:/outside.md','knowledge\\first.md','.git/config.md','playgrounds/x/scratch/a.md','knowledge/one/first.md:stream.md']) assert.throws(()=>b.read(ref));
  });
  test('duplicate basename is an explicit error, not first-wins identity',()=>{
    put('knowledge/two/first.md',node('active','Collision'));
    assert.throws(()=>b.documents(),/DUPLICATE_NODE_ID/);fs.unlinkSync(path.join(brain,'knowledge/two/first.md'));
  });
  test('invalid brain fails explicitly',()=>assert.throws(()=>createBrain(root),/DOCUMENT_UNAVAILABLE/));
  test('external junction cannot be read or included in the graph',()=>{
    const external=path.join(root,'external');fs.mkdirSync(external);fs.writeFileSync(path.join(external,'secret.md'),'Do not read');
    const link=path.join(brain,'knowledge','escape');fs.symlinkSync(external,link,'junction');
    assert.throws(()=>b.read('knowledge/escape/secret.md'),/SYMLINK_REF/);
    assert.throws(()=>b.status(),/SYMLINK_REF/);fs.unlinkSync(link);
  });
  console.log(`1..${count}`);
} finally {fs.rmSync(root,{recursive:true,force:true});}
