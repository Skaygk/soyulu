const MAX_UPLOAD = 5 * 1024 * 1024;
const MAX_UPLOADS_PER_PERIOD = 3;
const COOLDOWN_MS = 15 * 60 * 1000;

const spamCache = new Map();

export default {
  async fetch(request, env) {
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const now = Date.now();
    let record = spamCache.get(ip) || { count: 0, lastTime: 0 };

    if (request.method === 'GET') {
      const html = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Subir archivo</title>
          <style>
            body { font-family: Arial; background:#000; color:#fff; text-align:center; padding:20px; }
            input[type=file] { margin-bottom:10px; }
            button { padding:10px 20px; background:#b84cff; color:#000; border:none; font-weight:bold; cursor:pointer; }
            button:hover { background:#9400D3; }
            #status { margin-top:15px; word-break:break-all; }
          </style>
        </head>
        <body>
          <h1>Subir imagen o video</h1>
          <input type="file" id="fileInput" accept="image/*,video/*"><br>
          <button id="uploadBtn">Subir</button>
          <p id="status"></p>
          <script>
            const btn = document.getElementById('uploadBtn');
            const input = document.getElementById('fileInput');
            const status = document.getElementById('status');

            btn.onclick = async () => {
              const file = input.files[0];
              if(!file){ status.textContent='Selecciona un archivo'; return; }
              const formData = new FormData();
              formData.append('file', file);
              status.textContent='Subiendo...';

              try {
                const res = await fetch('', { method:'POST', body: formData });
                const data = await res.json();
                if(data.ok){
                  status.innerHTML = 'Archivo subido: <a href="'+data.url+'" target="_blank">'+data.url+'</a>';
                  input.value='';
                } else {
                  status.textContent='Error: '+data.error;
                }
              } catch(e){ status.textContent='Error al subir'; console.error(e); }
            }
          </script>
        </body>
        </html>
      `;
      return new Response(html, { headers: { 'Content-Type': 'text/html' } });
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ ok:false, error:'Método no permitido' }), {
        status: 405, headers: { 'Content-Type':'application/json' }
      });
    }

    if (now - record.lastTime > COOLDOWN_MS) {
      record.count = 0;
      record.lastTime = now;
    }

    if (record.count >= MAX_UPLOADS_PER_PERIOD) {
      return new Response(JSON.stringify({
        ok:false,
        error:`Demasiadas subidas, espera ${Math.ceil((COOLDOWN_MS - (now - record.lastTime))/60000)} minutos`
      }), { status:429, headers:{'Content-Type':'application/json'} });
    }

    record.count++;
    record.lastTime = now;
    spamCache.set(ip, record);

    const formData = await request.formData();
    const file = formData.get('file');

    if(!file){
      return new Response(JSON.stringify({ ok:false, error:'Archivo no recibido' }), { status:400, headers:{'Content-Type':'application/json'} });
    }

    if(file.size > MAX_UPLOAD){
      return new Response(JSON.stringify({ ok:false, error:'Archivo supera 5MB' }), { status:400, headers:{'Content-Type':'application/json'} });
    }

    if(!file.type.startsWith('image/') && !file.type.startsWith('video/')){
      return new Response(JSON.stringify({ ok:false, error:'Solo se permiten imágenes o videos' }), { status:400, headers:{'Content-Type':'application/json'} });
    }

    const key = crypto.randomUUID() + '-' + file.name;
    await env.MI_BUCKET.put(key, file.stream(), { httpMetadata:{ contentType:file.type } });

    const url = `https://${env.MI_BUCKET.name}.r2.cloudflarestorage.com/${key}`;
    return new Response(JSON.stringify({ ok:true, url }), { headers:{'Content-Type':'application/json'} });
  }
};
