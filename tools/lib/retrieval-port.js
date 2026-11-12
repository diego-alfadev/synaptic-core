'use strict';
// Capability-based RetrievalPort. Prose equivalent: direct file search + MOC routing,
// references/audit.md and references/contract.md. Cache lifecycle is adapter-internal.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {createBrain, fault} = require('./core-lib');

// One tokenizer owns both providers. Encode its tokens as plain ASCII before FTS5:
// SQLite's Unicode tables/boundaries must not redefine underscore or combining marks.
function lexicalTokens(text) {return text.normalize('NFKC').toLowerCase().match(/[\p{L}\p{N}_]+/gu) || [];}
function indexToken(token) {return 't'+Buffer.from(token,'utf8').toString('hex');}
function tokens(query) {
  if (typeof query !== 'string' || query.length > 1024) throw fault('INVALID_QUERY');
  const result = [...new Set(lexicalTokens(query))];
  if (!result.length || result.length > 32) throw fault('INVALID_QUERY');
  return result;
}
function words(text) {return new Set(lexicalTokens(text));}
const reasons = (...values) => values.filter(Boolean).join(',') || null;
function createRetrieval(root, options = {}) {
  const brain = createBrain(root);
  let db = null;
  let backend = 'file-lexical';
  let degraded = null;
  let lastDigest = null;
  let attempted = false;
  const caps = () => ({ranked: backend === 'sqlite-fts5', addressing:'span', calibrated:false, offline:true, needsModel:false});
  function database() {
    if (attempted) return db;
    attempted = true;
    if (options.sqlite === false) {degraded='sqlite-disabled';return null;}
    try {
      const {DatabaseSync} = require('node:sqlite');
      let file = ':memory:';
      if (options.cacheDir) {
        // Cache location is explicit operator configuration, never document/row data.
        const dir = path.resolve(options.cacheDir);
        if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory() || fs.lstatSync(dir).isSymbolicLink()) throw fault('CACHE_UNAVAILABLE');
        const hash = crypto.createHash('sha256').update(fs.realpathSync(root)).digest('hex').slice(0,24);
        file = path.join(fs.realpathSync(dir),`synaptic-${hash}.sqlite`);
        if (fs.existsSync(file) && (fs.lstatSync(file).isSymbolicLink() || !fs.statSync(file).isFile())) throw fault('CACHE_UNAVAILABLE');
      }
      db = new DatabaseSync(file);
      db.exec('CREATE VIRTUAL TABLE IF NOT EXISTS cortex_docs USING fts5(ref UNINDEXED, body, tokenize="unicode61 remove_diacritics 0")');
      backend='sqlite-fts5';
      return db;
    } catch (_) {
      if(db) {try {db.close();}catch (_){} db=null;}
      degraded='sqlite-unavailable';backend='file-lexical';return null;
    }
  }
  function hit(doc, terms, score) {
    // Re-read source after candidate selection: never serve a stale indexed body.
    const current = brain.read(doc.ref);
    if (current.text !== doc.text || !terms.every(t => words(current.text).has(t))) return null;
    const lines = current.text.split('\n');
    let index = lines.findIndex(line => terms.some(t => words(line).has(t)));
    if(index<0) index=0;
    const out={ref:doc.ref,span:{startLine:index+1,endLine:index+1},snippet:lines[index].replace(/\r$/,'').slice(0,300)};
    if(score !== undefined) {out.score=score;out.why='SQLite FTS5 BM25 lexical relevance (uncalibrated)';}
    return out;
  }
  function search(query, searchOptions = {}) {
    const terms=tokens(query);
    const limit=searchOptions.limit === undefined ? 10 : searchOptions.limit;
    if(!Number.isInteger(limit) || limit<1 || limit>100) throw fault('INVALID_LIMIT');
    const {documents:docs,skipped}=brain.corpus();
    const byRef=new Map(docs.map(d=>[d.ref,d]));
    const engine=database();
    let candidates;
    if(engine) {
      try {
        const digest=crypto.createHash('sha256');
        for(const doc of docs) digest.update(JSON.stringify([doc.ref,doc.text]));
        const nextDigest=digest.digest('hex');
        // First access in each process always rebuilds: an existing DB is never trusted.
        if(nextDigest!==lastDigest) {
          engine.exec('BEGIN IMMEDIATE');
          try {
            engine.exec('DELETE FROM cortex_docs');
            const insert=engine.prepare('INSERT INTO cortex_docs(ref,body) VALUES (?,?)');
            // Preserve token multiplicity for BM25 frequency, but never ask SQLite to
            // tokenize raw Unicode. Raw source remains available for proof/snippets.
            for(const doc of docs) insert.run(doc.ref,lexicalTokens(doc.text).map(indexToken).join(' '));
            engine.exec('COMMIT');lastDigest=nextDigest;
          } catch(e) {try{engine.exec('ROLLBACK');}catch(_){}throw e;}
        }
        const expression=terms.map(t=>'"'+indexToken(t)+'"').join(' AND ');
        candidates=engine.prepare('SELECT ref, bm25(cortex_docs) AS rank FROM cortex_docs WHERE cortex_docs MATCH ? ORDER BY rank,ref LIMIT ?').all(expression,limit)
          .map(row=>({doc:byRef.get(row.ref),score:-row.rank}));
      } catch(_) {
        try{engine.close();}catch(_){}db=null;backend='file-lexical';degraded='sqlite-unavailable';
      }
    }
    if(!candidates) candidates=docs.filter(d=>terms.every(t=>words(d.text).has(t))).slice(0,limit).map(doc=>({doc}));
    const hits=[];
    for(const item of candidates) {
      if(!item.doc) continue;
      let verified;
      try {verified=hit(item.doc,terms,item.score);}
      catch(e) {if(!e.code || e.code.startsWith('E')) throw e;skipped.push({ref:item.doc.ref,reason:e.code});continue;}
      if(verified) hits.push(verified);
    }
    return {hits,skipped,capabilities:caps(),backend,degraded:reasons(degraded,skipped.length?'documents-skipped':null),coreProcedure:'references/audit.md'};
  }
  return Object.freeze({search,read:brain.read,resources:()=>['BRAIN.md',...brain.files()],
    status:()=>{database();const current=brain.status();return {...current,backend,capabilities:caps(),degraded:reasons(degraded,current.degraded)};},
    capabilities:()=>{database();return caps();},
    close:()=>{if(db){db.close();db=null;}},brain});
}
module.exports={createRetrieval,tokens};
