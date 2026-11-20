const {createServer}=require('./serve_web.cjs');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const dir=path.resolve('tmp/web-server-test');fs.mkdirSync(dir,{recursive:true});
 fs.writeFileSync(path.join(dir,'index.html'),'<!doctype html><title>HTTP test fixture</title>');fs.writeFileSync(path.join(dir,'app.js'),'console.log("test");');
 const server=createServer(dir);await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{
  const origin='http://127.0.0.1:'+server.address().port;
  const page=await fetch(origin);assert.equal(page.status,200);assert.match(await page.text(),/HTTP test fixture/);
  const js=await fetch(origin+'/app.js');assert.match(js.headers.get('content-type'),/javascript/);assert.equal(js.headers.get('cache-control'),'no-store');
  assert.equal((await fetch(origin+'/missing.png')).status,404);assert.equal((await fetch(origin+'/app.js',{method:'POST'})).status,405);
  assert.equal((await fetch(origin+'/%2e%2e%2fREADME.md')).status,403);
  assert.equal((await fetch(origin+'/app.js',{method:'HEAD'})).status,200);
  assert.equal((await fetch(origin+'/bad%zz')).status,400);
  console.log('PASS local server: HTML, JavaScript MIME, no stale cache, HEAD, missing assets, method guard, traversal guard, invalid URI.');
 }finally{await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
