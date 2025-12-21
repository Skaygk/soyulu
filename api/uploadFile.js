import { v4 as uuidv4 } from 'uuid';
import fetch from 'node-fetch';

const BUCKET = process.env.R2_BUCKET;
const R2_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
const R2_ACCESS_KEY = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_KEY = process.env.R2_SECRET_ACCESS_KEY;

const MAX_UPLOAD = 10 * 1024 * 1024; 
const MAX_UPLOADS_PER_PERIOD = 3;
const COOLDOWN_MS = 15 * 60 * 1000; 

const spamCache = new Map(); 

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Método no permitido' });
  }

  try {
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';

    const now = Date.now();
    const record = spamCache.get(ip) || { count: 0, lastTime: 0 };
    if (now - record.lastTime < COOLDOWN_MS && record.count >= MAX_UPLOADS_PER_PERIOD) {
      return res.status(429).json({ ok: false, error: `Demasiadas subidas, espera ${COOLDOWN_MS/60000} minutos` });
    }
    if (now - record.lastTime > COOLDOWN_MS) {
      record.count = 0;
      record.lastTime = now;
    }
    record.count++;
    record.lastTime = now;
    spamCache.set(ip, record);

    
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    if (!buffer || buffer.length === 0) {
      return res.status(400).json({ ok: false, error: 'Archivo no recibido' });
    }

    if (buffer.length > MAX_UPLOAD) {
      return res.status(400).json({ ok: false, error: 'Archivo supera 10MB' });
    }

    const filename = uuidv4() + '.bin';
    const r2Url = `https://${BUCKET}.r2.cloudflarestorage.com/${filename}`;

    const response = await fetch(r2Url, {
      method: 'PUT',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${R2_ACCESS_KEY}:${R2_SECRET_KEY}`).toString('base64'),
        'Content-Type': 'application/octet-stream'
      },
      body: buffer
    });

    if (!response.ok) {
      return res.status(500).json({ ok: false, error: 'Error al subir a R2' });
    }

    return res.status(200).json({ ok: true, url: r2Url });

  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: e.message });
  }
}
