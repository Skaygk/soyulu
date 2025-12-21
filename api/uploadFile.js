import { R2 } from '@cloudflare/workers-types';
import { v4 as uuidv4 } from 'uuid';

const BUCKET = process.env.R2_BUCKET;
const ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
const ACCESS_KEY = process.env.R2_ACCESS_KEY_ID;
const SECRET_KEY = process.env.R2_SECRET_ACCESS_KEY;

const MAX_UPLOAD = 5*1024*1024; // 5 MB
const spamCache = new Map();

export default async function handler(req, res){
  if(req.method!=='POST') return res.status(405).json({ok:false,error:'Método no permitido'});

  try{
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';

    const now = Date.now();
    const record = spamCache.get(ip)||{count:0,lastTime:0};
    if(now-record.lastTime<15*60*1000 && record.count>=3) return res.status(429).json({ok:false,error:'Demasiadas subidas, espera 15 minutos'});
    if(now-record.lastTime>15*60*1000) { record.count=0; record.lastTime=now; }
    record.count++;
    record.lastTime=now;
    spamCache.set(ip,record);

    const file = req.body.get('file');
    if(!file) return res.status(400).json({ok:false,error:'Archivo no recibido'});
    if(file.size>MAX_UPLOAD) return res.status(400).json({ok:false,error:'Archivo supera 5MB'});

    const filename = uuidv4()+'-'+file.name;
    const r2Url = `https://${BUCKET}.r2.cloudflarestorage.com/${filename}`;

    const response = await fetch(r2Url, {
      method:'PUT',
      headers:{ 'Authorization':'Bearer '+process.env.R2_TOKEN },
      body:file
    });

    if(!response.ok) return res.status(500).json({ok:false,error:'Error al subir :c'});

    return res.status(200).json({ok:true,url:r2Url});
  }catch(e){
    console.error(e);
    return res.status(500).json({ok:false,error:e.message});
  }
}
