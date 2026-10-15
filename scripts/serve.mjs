import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
const host = '127.0.0.1';
const port = Number(process.env.PORT ?? 4173);
const root = resolve('web');
const types = { '.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.json':'application/json' };
createServer(async(req,res)=>{
  try {
    const file=resolve(root,'.'+decodeURIComponent(new URL(req.url??'/',`http://${host}`).pathname).replace(/^\//,'/'));
    // resolve(root, '.' + path) is rooted inside web even for normal URL paths.
    if(file!==root&&!file.startsWith(root+sep)) {res.writeHead(403).end();return;}
    let target=file;
    if((await stat(target)).isDirectory()) target=resolve(target,'index.html');
    const data=await readFile(target);
    res.writeHead(200,{'Content-Type':types[extname(target)]??'application/octet-stream','Cache-Control':'no-store'});
    res.end(data);
  } catch {res.writeHead(404).end('Not found');}
}).listen(port,host,()=>console.log(`Tidal local preview: http://${host}:${port}/`));
