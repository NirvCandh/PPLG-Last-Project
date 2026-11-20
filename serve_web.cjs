// Local HTML5 preview server. No npm install required.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
function createServer(directory){
 const root=fs.realpathSync(directory);
 if(!fs.existsSync(path.join(root,'index.html')))throw new Error('Folder harus berisi index.html hasil ekspor HTML5 GDevelop.');
 const inside=file=>file===root||file.startsWith(root+path.sep);
 const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml','.woff2':'font/woff2','.woff':'font/woff','.ttf':'font/ttf','.ogg':'audio/ogg','.mp3':'audio/mpeg','.wav':'audio/wav','.wasm':'application/wasm','.css':'text/css; charset=utf-8'};
 return http.createServer((req,res)=>{
  try{
   if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
   const url=new URL(req.url,'http://localhost'),file=path.resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));
   if(!inside(file)){res.writeHead(403);res.end('Forbidden');return;}
   if(!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end('Not found');return;}
   if(!inside(fs.realpathSync(file))){res.writeHead(403);res.end('Forbidden');return;}
   res.writeHead(200,{'Content-Type':types[path.extname(file).toLowerCase()]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
   if(req.method==='HEAD')res.end();else fs.createReadStream(file).pipe(res);
  }catch(_){res.writeHead(400);res.end('Bad request');}
 });
}
if(require.main===module){
 try{
  const dir=path.resolve(process.argv[2]||'dist/web'),port=Number(process.argv[3]||8080);
  if(!Number.isInteger(port)||port<1||port>65535)throw new Error('Port tidak valid.');
  const server=createServer(dir);server.on('error',e=>{console.error(e.message);process.exitCode=1;});
  server.listen(port,'127.0.0.1',()=>console.log(`Circuit Quest: http://127.0.0.1:${port}\nFolder: ${dir}\nTekan Ctrl+C untuk berhenti.`));
 }catch(e){console.error(e.message);process.exitCode=1;}
}
module.exports={createServer};
