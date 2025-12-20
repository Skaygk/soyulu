async function registrarVisita() {
  try {
    const res = await fetch('/api/track', {
      method: 'POST'
    });
    const data = await res.json();
    console.log('Visita registrada:', data);
  } catch (err) {
    console.error('Error al registrar visita:', err);
  }
}

window.addEventListener('load', registrarVisita);
