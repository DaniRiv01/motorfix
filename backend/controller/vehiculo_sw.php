<?php

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../model/Conexion.php';
require_once __DIR__ . '/../model/Usuario.php';
require_once __DIR__ . '/../model/Cliente.php';
require_once __DIR__ . '/../model/Vehiculo.php';

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

$action = trim((string)($input['action'] ?? $_GET['action'] ?? 'listar'));
$clienteActual = Cliente::getPorUsuario($usuario->id_usuario);

try {
    switch ($action) {
        case 'listar': {
            if ($usuario->rol === 'cliente') {
                if (!$clienteActual) {
                    responderJson(false, 'No se encontró la ficha de cliente.', [], 404);
                }
                $vehiculos = Vehiculo::getPorCliente($clienteActual->id_cliente);
            } else {
                $idClienteFiltro = (int)($input['id_cliente'] ?? 0);
                if ($idClienteFiltro > 0) {
                    $vehiculos = Vehiculo::getPorCliente($idClienteFiltro);
                } else {
                    $modelo = new Vehiculo();
                    $vehiculos = $modelo->selectAll();
                }
            }

            responderJson(true, 'Vehículos obtenidos correctamente.', $vehiculos);
            break;
        }

        case 'crear': {
            $matricula = strtoupper(trim((string)($input['matricula'] ?? '')));
            $marca = trim((string)($input['marca'] ?? ''));
            $modeloNombre = trim((string)($input['modelo'] ?? ''));
            $anio = (int)($input['anio'] ?? 0);
            $kilometraje = max(0, (int)($input['kilometraje'] ?? 0));

            if ($usuario->rol === 'cliente') {
                if (!$clienteActual) {
                    responderJson(false, 'No se encontró la ficha de cliente asociada.', [], 404);
                }
                $idCliente = (int)$clienteActual->id_cliente;
            } else {
                $idCliente = (int)($input['id_cliente'] ?? ($clienteActual ? $clienteActual->id_cliente : 0));
            }

            if ($idCliente <= 0 || $matricula === '' || $marca === '' || $modeloNombre === '' || $anio < 1886 || $anio > 2026) {
                responderJson(false, 'Complete correctamente matrícula, marca, modelo y año (1886-2026).');
            }

            $db = Conexion::getConexion();
            $stmtMat = $db->prepare('SELECT id_vehiculo FROM vehiculo WHERE matricula = :matricula LIMIT 1');
            $stmtMat->bindValue(':matricula', $matricula);
            $stmtMat->execute();
            if ($stmtMat->fetch()) {
                responderJson(false, 'Ya existe un vehículo registrado con esa matrícula.');
            }

            $vehiculo = new Vehiculo(null, $idCliente, $matricula, $marca, $modeloNombre, $anio, $kilometraje);
            if (!$vehiculo->insert()) {
                responderJson(false, 'No se pudo registrar el vehículo.');
            }

            responderJson(true, 'Vehículo guardado correctamente.', $vehiculo->getArray());
            break;
        }

        case 'actualizar': {
            $idVehiculo = (int)($input['id_vehiculo'] ?? 0);
            $vehiculo = Vehiculo::selectById($idVehiculo);
            if (!$vehiculo) {
                responderJson(false, 'Vehículo no encontrado.', [], 404);
            }

            if ($usuario->rol === 'cliente') {
                if (!$clienteActual || (int)$vehiculo->id_cliente !== (int)$clienteActual->id_cliente) {
                    responderJson(false, 'No tiene permiso para modificar este vehículo.', [], 403);
                }
            }

            $matricula = strtoupper(trim((string)($input['matricula'] ?? $vehiculo->matricula)));
            $marca = trim((string)($input['marca'] ?? $vehiculo->marca));
            $modeloNombre = trim((string)($input['modelo'] ?? $vehiculo->modelo));
            $anio = (int)($input['anio'] ?? $vehiculo->anio);
            $kilometraje = max(0, (int)($input['kilometraje'] ?? $vehiculo->kilometraje));

            if ($matricula === '' || $marca === '' || $modeloNombre === '' || $anio < 1886 || $anio > 2026) {
                responderJson(false, 'Complete correctamente matrícula, marca, modelo y año (1886-2026).');
            }

            $db = Conexion::getConexion();
            $stmtMat = $db->prepare('SELECT id_vehiculo FROM vehiculo WHERE matricula = :matricula AND id_vehiculo != :id_vehiculo LIMIT 1');
            $stmtMat->bindValue(':matricula', $matricula);
            $stmtMat->bindValue(':id_vehiculo', $vehiculo->id_vehiculo, PDO::PARAM_INT);
            $stmtMat->execute();
            if ($stmtMat->fetch()) {
                responderJson(false, 'Esa matrícula ya pertenece a otro vehículo registrado.');
            }

            $vehiculo->matricula = $matricula;
            $vehiculo->marca = $marca;
            $vehiculo->modelo = $modeloNombre;
            $vehiculo->anio = $anio;
            $vehiculo->kilometraje = $kilometraje;

            if (!$vehiculo->update()) {
                responderJson(false, 'No se pudo actualizar el vehículo.');
            }

            responderJson(true, 'Vehículo actualizado correctamente.', $vehiculo->getArray());
            break;
        }

        case 'eliminar': {
            $idVehiculo = (int)($input['id_vehiculo'] ?? 0);
            $vehiculo = Vehiculo::selectById($idVehiculo);
            if (!$vehiculo) {
                responderJson(false, 'Vehículo no encontrado.', [], 404);
            }

            if ($usuario->rol === 'cliente') {
                if (!$clienteActual || (int)$vehiculo->id_cliente !== (int)$clienteActual->id_cliente) {
                    responderJson(false, 'No tiene permiso para eliminar este vehículo.', [], 403);
                }
            }

            if (!$vehiculo->delete()) {
                responderJson(false, 'No se pudo eliminar el vehículo.');
            }

            responderJson(true, 'Vehículo eliminado correctamente.', []);
            break;
        }

        default:
            responderJson(false, 'Acción no reconocida en vehiculo_sw.', [], 400);
    }
} catch (Throwable $e) {
    responderJson(false, 'Error en el servidor: ' . $e->getMessage(), [], 500);
}
