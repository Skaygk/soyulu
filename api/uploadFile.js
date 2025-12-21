const MAX_UPLOAD = 5 * 1024 * 1024;      
const MAX_UPLOADS_PER_PERIOD = 3;         
const COOLDOWN_MS = 15 * 60 * 1000;       

const spamCache = new Map();               

export default {
  async fetch(request, env) {
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ ok: false, error: 'Método no permitido' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      });
    }


    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const now = Date.now();
    let record = spamCache.get(ip) || { count: 0, lastTime: 0 };

    
    if (now - record.lastTime > COOLDOWN_MS) {
      record.count = 0;
      record.lastTime = now;
    }

    if (record.count >= MAX_UPLOADS_PER_PERIOD) {
      return new Response(JSON.stringify({
        ok: false,
        error: `Demasiadas subidas, espera ${Math.ceil((COOLDOWN_MS - (now - record.lastTime)) / 60000)} minutos`
      }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    record.count++;
    record.lastTime = now;
    spamCache.set(ip, record);


    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return new Response(JSON.stringify({ ok: false, error: 'Archivo no recibido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (file.size > MAX_UPLOAD) {
      return new Response(JSON.stringify({ ok: false, error: 'Archivo supera 5MB' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      return new Response(JSON.stringify({ ok: false, error: 'Solo se permiten imágenes o videos' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const key = crypto.randomUUID() + '-' + file.name;
    await env.MI_BUCKET.put(key, file.stream(), {
      httpMetadata: { contentType: file.type }
    });

    const url = `https://${env.MI_BUCKET.name}.r2.cloudflarestorage.com/${key}`;
    return new Response(JSON.stringify({ ok: true, url }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
