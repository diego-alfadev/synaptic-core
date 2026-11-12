#!/usr/bin/env node
'use strict';
// Minimal read-only MCP stdio delivery adapter. Domain behaviour stays in core-lib/port.
// Protocol scope: initialize, ping, tools/list/call, resources/list/read; no write/sampling tools.
const {StringDecoder}=require('node:string_decoder');
const {createRetrieval}=require('../lib/retrieval-port');
const VERSION='2025-11-25';
const MAX_MESSAGE_BYTES=1024*1024;
const PROCEDURES=Object.freeze({brain_status:'references/audit.md',brain_search:'references/audit.md',brain_read:'references/contract.md'});
const TOOLS=[
  {name:'brain_status',description:'Inspect current brain files and topology. CORE equivalent: references/audit.md.',inputSchema:{type:'object',properties:{},additionalProperties:false}},
  {name:'brain_search',description:'Find lexical matches in current knowledge files; inspect capabilities and verify source refs. CORE equivalent: references/audit.md file search.',inputSchema:{type:'object',properties:{query:{type:'string',minLength:1,maxLength:1024},limit:{type:'integer',minimum:1,maximum:100}},required:['query'],additionalProperties:false}},
  {name:'brain_read',description:'Read a current UTF-8 Markdown file within this brain. CORE equivalent: references/contract.md direct source reading.',inputSchema:{type:'object',properties:{ref:{type:'string',minLength:1,maxLength:4096}},required:['ref'],additionalProperties:false}}
].map(tool=>({...tool,annotations:{readOnlyHint:true,destructiveHint:false,idempotentHint:true,openWorldHint:false},_meta:{coreProcedure:PROCEDURES[tool.name]}}));
const plain=value=>value!==null && typeof value==='object' && !Array.isArray(value);
const keys=(value,allowed)=>plain(value) && Object.keys(value).every(k=>allowed.includes(k));
function resourceUri(ref){return 'synaptic:///'+ref.split('/').map(encodeURIComponent).join('/');}
function resourceRef(uri){
  if(typeof uri!=='string' || !uri.startsWith('synaptic:///') || uri.includes('?') || uri.includes('#')) throw Error('INVALID_RESOURCE_URI');
  // Deliberately do not use URL path normalization before confinement validation.
  try{return decodeURIComponent(uri.slice('synaptic:///'.length));}catch(_){throw Error('INVALID_RESOURCE_URI');}
}
function serve(root,options={}) {
  const port=createRetrieval(root,options);
  let initialized=false,ready=false,stopped=false;
  let pending='';const decoder=new StringDecoder('utf8');
  const send=message=>process.stdout.write(JSON.stringify(message)+'\n');
  const error=(id,code,message)=>send({jsonrpc:'2.0',id,error:{code,message}});
  function receive(message) {
    const request=plain(message) && message.jsonrpc==='2.0' && typeof message.method==='string';
    const hasId=plain(message) && Object.hasOwn(message,'id');
    const id=hasId ? message.id : null;
    if(!request || (hasId && !(typeof id==='string' || (typeof id==='number' && Number.isInteger(id))))) {error(null,-32600,'Invalid request');return;}
    if(!hasId) {
      if(message.method==='notifications/initialized' && initialized) ready=true;
      return; // Notifications never receive a response, including unsupported notifications.
    }
    const p=message.params;
    const reply=result=>send({jsonrpc:'2.0',id,result});
    if(message.method==='ping') {reply({});return;}
    if(message.method==='initialize') {
      if(initialized) {error(id,-32600,'Already initialized');return;}
      if(!plain(p) || typeof p.protocolVersion!=='string' || !plain(p.capabilities) || !plain(p.clientInfo) || typeof p.clientInfo.name!=='string' || typeof p.clientInfo.version!=='string') {error(id,-32602,'Invalid initialize parameters');return;}
      initialized=true;
      reply({protocolVersion:VERSION,capabilities:{tools:{},resources:{}},serverInfo:{name:'synaptic-cortex-local',version:'0.0.0-local'},instructions:'Optional accelerator. Current brain files remain authoritative; follow CORE prose if this process stops.'});return;
    }
    if(!ready) {error(id,-32002,'Client initialization required');return;}
    if(message.method==='tools/list') {
      if(p!==undefined && !keys(p,[])){error(id,-32602,'Invalid parameters');return;}
      reply({tools:TOOLS});return;
    }
    if(message.method==='resources/list') {
      if(p!==undefined && !keys(p,[])){error(id,-32602,'Invalid parameters');return;}
      try{reply({resources:port.resources().map(ref=>({uri:resourceUri(ref),name:ref,mimeType:'text/markdown'}))});}
      catch(_){error(id,-32000,'Resource corpus unavailable');}return;
    }
    if(message.method==='resources/read') {
      if(!keys(p,['uri']) || typeof p.uri!=='string') {error(id,-32602,'Invalid parameters');return;}
      try{const doc=port.read(resourceRef(p.uri));reply({contents:[{uri:p.uri,mimeType:'text/markdown',text:doc.text}]});}
      catch(_){error(id,-32002,'Resource unavailable');}return;
    }
    if(message.method==='tools/call') {
      if(!keys(p,['name','arguments']) || typeof p.name!=='string' || !TOOLS.some(t=>t.name===p.name)) {error(id,-32602,'Unknown tool or invalid parameters');return;}
      const a=p.arguments===undefined?{}:p.arguments;
      const valid=p.name==='brain_status'?keys(a,[]):p.name==='brain_read'?
        keys(a,['ref']) && typeof a.ref==='string' && a.ref.length>0 && a.ref.length<=4096:
        keys(a,['query','limit']) && typeof a.query==='string' && a.query.length>0 && a.query.length<=1024 && (a.limit===undefined || Number.isInteger(a.limit) && a.limit>=1 && a.limit<=100);
      if(!valid) {error(id,-32602,'Invalid tool arguments');return;}
      try{const result=p.name==='brain_status'?port.status():p.name==='brain_read'?port.read(a.ref):port.search(a.query,{limit:a.limit});reply({content:[{type:'text',text:JSON.stringify(result)}],isError:false});}
      catch(e){reply({content:[{type:'text',text:e.code?e.code+(e.ref?': '+e.ref:''):'Operation unavailable'}],isError:true});}return;
    }
    error(id,-32601,'Method not found');
  }
  function line(text) {
    if(!text.trim()) return;
    try{receive(JSON.parse(text));}catch(_){error(null,-32700,'Parse error');}
  }
  function close(){if(!stopped){stopped=true;port.close();}}
  process.stdin.on('data',chunk=>{
    if(stopped)return;
    pending+=decoder.write(chunk);
    let index;
    while((index=pending.indexOf('\n'))>=0) {
      const message=pending.slice(0,index);pending=pending.slice(index+1);
      if(Buffer.byteLength(message)>MAX_MESSAGE_BYTES) {error(null,-32600,'Message too large');close();process.stdin.pause();process.exitCode=1;return;}
      line(message);
    }
    if(Buffer.byteLength(pending)>MAX_MESSAGE_BYTES){error(null,-32600,'Message too large');close();process.stdin.pause();process.exitCode=1;}
  });
  process.stdin.on('end',()=>{if(!stopped){pending+=decoder.end();if(pending.trim())line(pending);close();}});
  process.stdin.on('error',close);
  process.once('SIGTERM',()=>{close();process.exit(0);});
  process.once('SIGINT',()=>{close();process.exit(0);});
}
if(require.main===module) {
  try{
    const args=process.argv.slice(2);const root=args.shift();const options={};
    for(let i=0;i<args.length;i++) {
      if(args[i]==='--no-sqlite') options.sqlite=false;
      else if(args[i]==='--cache-dir' && args[i+1] && !args[i+1].startsWith('--')) options.cacheDir=args[++i];
      else throw Error('INVALID_ARGUMENTS');
    }
    if(!root)throw Error('Usage: node tools/mcp/server.js <brain> [--no-sqlite] [--cache-dir <directory>]');
    serve(root,options);
  }catch(e){process.stderr.write((e.code || e.message)+'\n');process.exitCode=1;}
}
module.exports={serve,TOOLS,PROCEDURES,resourceUri,resourceRef,MAX_MESSAGE_BYTES};
