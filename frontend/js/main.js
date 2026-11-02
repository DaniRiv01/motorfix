function mostrarAlerta(mensaje, tipo = 'success') {
    const alerta = document.getElementById('mensajeAlerta');
    if (!alerta) return;
    alerta.textContent = mensaje;
    alerta.className = 'alert show ' + (tipo === 'error' ? 'alert-error' : 'alert-success');
}

function ocultarAlerta() {
    const alerta = document.getElementById('mensajeAlerta');
    if (!alerta) return;
    alerta.textContent = '';
    alerta.className = 'alert';
}

