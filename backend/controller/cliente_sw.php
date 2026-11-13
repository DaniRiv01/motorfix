<?php

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../model/Conexion.php';
require_once __DIR__ . '/../model/Usuario.php';
require_once __DIR__ . '/../model/Cliente.php';

function responderJson(bool $success, string $msg, array $data = [], int $httpCode = 200): void {
    http_response_code($httpCode);
    echo json_encode([
        'success' => $success,
        'msg'     => $msg,
        'data'    => $data
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

function obtenerTokenPeticion(array $input): string {
    if (!empty($input['auth_key'])) {
        return trim((string)$input['auth_key']);
    }
    $headers = function_exists('getallheaders') ? getallheaders() : [];
    foreach ($headers as $key => $value) {
        $lower = strtolower($key);
        if ($lower === 'x-auth-key') {
            return trim((string)$value);
        }
        if ($lower === 'authorization' && stripos($value, 'Bearer ') === 0) {
            return trim(substr($value, 7));
        }
    }
    return '';
}

$rawInput = file_get_contents('php://input');
$input = json_decode($rawInput, true);
if (!is_array($input)) {
    $input = $_POST;
}

$token = obtenerTokenPeticion($input);
$usuario = new Usuario();
if (!$usuario->validarToken($token)) {
    responderJson(false, 'Sesión no válida o expirada.', [], 401);
}

$action = trim((string)($input['action'] ?? $_GET['action'] ?? 'perfil'));

try {
    switch ($action) {
        case 'perfil': {
            $cliente = Cliente::getPorUsuario($usuario->id_usuario);
            if (!$cliente) {
                responderJson(false, 'No se encontró la ficha de cliente.', [], 404);
            }
            responderJson(true, 'Perfil de cliente obtenido.', [
                'usuario'   => $usuario->getArray(),
                'cliente'   => $cliente->getArray(),
                'vehiculos' => $cliente->getVehiculos()
            ]);
            break;
        }

        case 'listar': {
            if (!in_array($usuario->rol, ['admin', 'oficina'], true)) {
                responderJson(false, 'No tiene permisos para listar todos los clientes.', [], 403);
            }
            $modelo = new Cliente();
            responderJson(true, 'Listado de clientes obtenido.', $modelo->selectAll());
            break;
        }

        case 'actualizar': {
            if ($usuario->rol === 'cliente') {
                $cliente = Cliente::getPorUsuario($usuario->id_usuario);
            } else {
                $idCliente = (int)($input['id_cliente'] ?? 0);
                $cliente = $idCliente > 0 ? Cliente::selectById($idCliente) : Cliente::getPorUsuario($usuario->id_usuario);
            }

            if (!$cliente) {
                responderJson(false, 'Cliente no encontrado.', [], 404);
            }

            $dni = strtoupper(trim((string)($input['dni'] ?? $cliente->dni)));
            $nombre = trim((string)($input['nombre'] ?? $cliente->nombre));
            $apellidos = trim((string)($input['apellidos'] ?? $cliente->apellidos));
            $telefono = trim((string)($input['telefono'] ?? $cliente->telefono));
            $direccion = array_key_exists('direccion', $input) ? trim((string)$input['direccion']) : (string)$cliente->direccion;

            if ($dni === '' || $nombre === '' || $apellidos === '' || $telefono === '') {
                responderJson(false, 'DNI, nombre, apellidos y teléfono son obligatorios.');
            }

            $db = Conexion::getConexion();
            $stmtDni = $db->prepare('SELECT id_cliente FROM cliente WHERE dni = :dni AND id_cliente != :id_cliente LIMIT 1');
            $stmtDni->bindValue(':dni', $dni);
            $stmtDni->bindValue(':id_cliente', $cliente->id_cliente, PDO::PARAM_INT);
            $stmtDni->execute();
            if ($stmtDni->fetch()) {
                responderJson(false, 'Ya existe otro cliente con ese DNI.');
            }

            $cliente->dni = $dni;
            $cliente->nombre = $nombre;
            $cliente->apellidos = $apellidos;
            $cliente->telefono = $telefono;
            $cliente->direccion = $direccion !== '' ? $direccion : null;

            if (!$cliente->update()) {
                responderJson(false, 'No se pudieron actualizar los datos del cliente.');
            }

            responderJson(true, 'Datos del cliente actualizados correctamente.', [
                'cliente' => $cliente->getArray()
            ]);
            break;
        }

        case 'eliminar': {
            if (!in_array($usuario->rol, ['admin', 'oficina'], true)) {
                responderJson(false, 'No tiene permisos para eliminar clientes.', [], 403);
            }
            $idCliente = (int)($input['id_cliente'] ?? 0);
            $cliente = Cliente::selectById($idCliente);
            if (!$cliente) {
                responderJson(false, 'Cliente no encontrado.', [], 404);
            }
            if (!$cliente->delete()) {
                responderJson(false, 'No se pudo eliminar el cliente.');
            }
            responderJson(true, 'Cliente eliminado correctamente.', []);
            break;
        }

        default:
            responderJson(false, 'Acción no reconocida en cliente_sw.', [], 400);
    }
} catch (Throwable $e) {
    responderJson(false, 'Error en el servidor: ' . $e->getMessage(), [], 500);
}
