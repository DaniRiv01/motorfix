function mostrarAlerta(mensaje, tipo = 'success') {
    const alerta = document.getElementById('mensajeAlerta');
    if (!alerta) return;
    alerta.textContent = mensaje;
    alerta.className = 'alert show ' + (tipo === 'error' ? 'alert-error' : 'alert-success');
    window.dispatchEvent(new CustomEvent('motorfix:alerta'));
}

function ocultarAlerta() {
    const alerta = document.getElementById('mensajeAlerta');
    if (!alerta) return;
    alerta.textContent = '';
    alerta.className = 'alert';
    window.dispatchEvent(new CustomEvent('motorfix:alerta'));
}

function guardarSesion(data, recordar = false) {
    if (!data || !data.usuario || !data.usuario.auth_key) return;
    limpiarSesion();
    const storage = recordar ? localStorage : sessionStorage;
    storage.setItem('motorfix_auth_key', data.usuario.auth_key);
    storage.setItem('motorfix_usuario', JSON.stringify(data.usuario));
    if (data.cliente) {
        storage.setItem('motorfix_cliente', JSON.stringify(data.cliente));
    }
}

function actualizarDatosSesion(data) {
    if (!data || !data.usuario) return;
    const enLocal = localStorage.getItem('motorfix_auth_key') !== null;
    const storage = enLocal ? localStorage : sessionStorage;
    if (data.usuario.auth_key) {
        storage.setItem('motorfix_auth_key', data.usuario.auth_key);
    }
    storage.setItem('motorfix_usuario', JSON.stringify(data.usuario));
    if (data.cliente) {
        storage.setItem('motorfix_cliente', JSON.stringify(data.cliente));
    }
}

function obtenerToken() {
    return localStorage.getItem('motorfix_auth_key') || sessionStorage.getItem('motorfix_auth_key') || '';
}

function obtenerUsuarioSesion() {
    const raw = localStorage.getItem('motorfix_usuario') || sessionStorage.getItem('motorfix_usuario');
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch (e) {
        return null;
    }
}

function obtenerClienteSesion() {
    const raw = localStorage.getItem('motorfix_cliente') || sessionStorage.getItem('motorfix_cliente');
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch (e) {
        return null;
    }
}

function limpiarSesion() {
    localStorage.removeItem('motorfix_auth_key');
    localStorage.removeItem('motorfix_usuario');
    localStorage.removeItem('motorfix_cliente');
    sessionStorage.removeItem('motorfix_auth_key');
    sessionStorage.removeItem('motorfix_usuario');
    sessionStorage.removeItem('motorfix_cliente');
}

function obtenerRutaPorRol(rol) {
    switch (rol) {
        case 'admin':
            return 'admin.html';
        case 'oficina':
            return 'oficina.html';
        case 'mecanico':
            return 'mecano.html';
        case 'cliente':
        default:
            return 'cliente.html';
    }
}

async function peticionSW(endpoint, payload = {}) {
    const token = obtenerToken();
    const bodyData = { ...payload };
    if (token && !bodyData.auth_key) {
        bodyData.auth_key = token;
    }

    const headers = {
        'Content-Type': 'application/json'
    };
    if (token) {
        headers['X-Auth-Key'] = token;
    }

    const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(bodyData)
    });

    const data = await response.json();
    return data;
}
