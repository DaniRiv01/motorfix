<?php

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../model/Conexion.php';
require_once __DIR__ . '/../model/Usuario.php';
require_once __DIR__ . '/../model/Cliente.php';
require_once __DIR__ . '/../model/Vehiculo.php';
require_once __DIR__ . '/../model/Cita.php';
require_once __DIR__ . '/../model/Factura.php';

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
                $citas = Cita::getPorCliente($clienteActual->id_cliente);
                $facturas = Factura::getPorCliente($clienteActual->id_cliente);
                responderJson(true, 'Citas y facturas obtenidas.', [
                    'citas'    => $citas,
                    'facturas' => $facturas
                ]);
            } elseif ($usuario->rol === 'mecanico') {
                $citas = Cita::getPorMecanico($usuario->id_usuario);
                responderJson(true, 'Hoja de trabajo obtenida.', [
                    'citas' => $citas
                ]);
            } else {
                $modeloCita = new Cita();
                $modeloFactura = new Factura();
                responderJson(true, 'Listado general de citas y facturas obtenido.', [
                    'citas'    => $modeloCita->selectAll(),
                    'facturas' => $modeloFactura->selectAll()
                ]);
            }
            break;
        }

        case 'crear': {
            $idVehiculo = (int)($input['id_vehiculo'] ?? 0);
            $fechaCita = trim((string)($input['fecha_cita'] ?? ''));
            $motivo = trim((string)($input['motivo'] ?? ''));

            if ($idVehiculo <= 0 || $fechaCita === '' || $motivo === '') {
                responderJson(false, 'Debe seleccionar un vehículo, fecha/hora y describir el motivo de la cita.');
            }

            $vehiculo = Vehiculo::selectById($idVehiculo);
            if (!$vehiculo) {
                responderJson(false, 'El vehículo seleccionado no existe.', [], 404);
            }

            if ($usuario->rol === 'cliente') {
                if (!$clienteActual || (int)$vehiculo->id_cliente !== (int)$clienteActual->id_cliente) {
                    responderJson(false, 'El vehículo seleccionado no pertenece a su cuenta.', [], 403);
                }
            }

            $cita = new Cita(
                null,
                $idVehiculo,
                null,
                null,
                $fechaCita,
                $motivo,
                'pendiente',
                0.00,
                45.00,
                null,
                0.00
            );

            if (!$cita->insert()) {
                responderJson(false, 'No se pudo registrar la solicitud de cita.');
            }

            responderJson(true, 'Cita solicitada correctamente.', $cita->getArray());
            break;
        }

        case 'cancelar': {
            $idCita = (int)($input['id_cita'] ?? 0);
            $cita = Cita::selectById($idCita);
            if (!$cita) {
                responderJson(false, 'Cita no encontrada.', [], 404);
            }

            $vehiculo = Vehiculo::selectById($cita->id_vehiculo);
            if ($usuario->rol === 'cliente') {
                if (!$clienteActual || !$vehiculo || (int)$vehiculo->id_cliente !== (int)$clienteActual->id_cliente) {
                    responderJson(false, 'No tiene permiso para cancelar esta cita.', [], 403);
                }
                if ($cita->estado !== 'pendiente') {
                    responderJson(false, 'Solo se pueden cancelar citas que aún estén en estado pendiente.');
                }
            }

            $cita->estado = 'cancelada';
            if (!$cita->update()) {
                responderJson(false, 'No se pudo cancelar la cita.');
            }

            responderJson(true, 'Cita cancelada correctamente.', $cita->getArray());
            break;
        }

        case 'actualizar': {
            if (!in_array($usuario->rol, ['admin', 'oficina', 'mecanico'], true)) {
                responderJson(false, 'No tiene permisos para actualizar citas de taller.', [], 403);
            }

            $idCita = (int)($input['id_cita'] ?? 0);
            $cita = Cita::selectById($idCita);
            if (!$cita) {
                responderJson(false, 'Cita no encontrada.', [], 404);
            }

            if (array_key_exists('id_mecanico', $input)) {
                $cita->id_mecanico = $input['id_mecanico'] !== null && $input['id_mecanico'] !== '' ? (int)$input['id_mecanico'] : null;
            }
            if (!empty($input['fecha_cita'])) {
                $cita->fecha_cita = trim((string)$input['fecha_cita']);
            }
            if (!empty($input['motivo'])) {
                $cita->motivo = trim((string)$input['motivo']);
            }
            if (!empty($input['estado'])) {
                $cita->estado = trim((string)$input['estado']);
            }
            if (array_key_exists('horas_trabajo', $input)) {
                $cita->horas_trabajo = max(0, (float)$input['horas_trabajo']);
            }
            if (array_key_exists('coste_hora', $input)) {
                $cita->coste_hora = max(0, (float)$input['coste_hora']);
            }
            if (array_key_exists('materiales_usados', $input)) {
                $mat = trim((string)$input['materiales_usados']);
                $cita->materiales_usados = $mat !== '' ? $mat : null;
            }
            if (array_key_exists('coste_materiales', $input)) {
                $cita->coste_materiales = max(0, (float)$input['coste_materiales']);
            }

            if (!$cita->update()) {
                responderJson(false, 'No se pudo actualizar la cita.');
            }

            responderJson(true, 'Cita actualizada correctamente.', $cita->getArray());
            break;
        }

        default:
            responderJson(false, 'Acción no reconocida en cita_sw.', [], 400);
    }
} catch (Throwable $e) {
    responderJson(false, 'Error en el servidor: ' . $e->getMessage(), [], 500);
}
