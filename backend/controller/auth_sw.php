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

$action = trim((string)($input['action'] ?? $_GET['action'] ?? ''));

if ($action === '') {
    responderJson(false, 'Acción no especificada.', [], 400);
}

try {
    switch ($action) {
        case 'login': {
            $email = trim((string)($input['email'] ?? ''));
            $password = (string)($input['password'] ?? '');

            if ($email === '' || $password === '') {
                responderJson(false, 'Debe introducir el correo electrónico y la contraseña.');
            }

            $usuario = new Usuario();
            $datosUsuario = $usuario->login($email, $password);

            if (empty($datosUsuario)) {
                responderJson(false, 'Correo electrónico o contraseña incorrectos.');
            }

            $cliente = Cliente::getPorUsuario($usuario->id_usuario);

            responderJson(true, 'Inicio de sesión correcto.', [
                'usuario' => $datosUsuario,
                'cliente' => $cliente ? $cliente->getArray() : null
            ]);
            break;
        }

        case 'register': {
            $username = trim((string)($input['username'] ?? ''));
            $email = trim((string)($input['email'] ?? ''));
            $password = (string)($input['password'] ?? '');
            $dni = strtoupper(trim((string)($input['dni'] ?? '')));
            $telefono = trim((string)($input['telefono'] ?? ''));
            $nombre = trim((string)($input['nombre'] ?? ''));
            $apellidos = trim((string)($input['apellidos'] ?? ''));
            $direccion = trim((string)($input['direccion'] ?? ''));

            if (
                $username === '' ||
                $email === '' ||
                $password === '' ||
                $dni === '' ||
                $telefono === '' ||
                $nombre === '' ||
                $apellidos === ''
            ) {
                responderJson(false, 'Todos los campos obligatorios deben estar completos.');
            }

            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                responderJson(false, 'El formato del correo electrónico no es válido.');
            }

            $db = Conexion::getConexion();
            $stmtCheck = $db->prepare('SELECT id_usuario, username, email FROM usuario WHERE username = :username OR email = :email LIMIT 1');
            $stmtCheck->bindValue(':username', $username);
            $stmtCheck->bindValue(':email', $email);
            $stmtCheck->execute();
            $existente = $stmtCheck->fetch();
            if ($existente) {
                if (strcasecmp($existente['email'], $email) === 0) {
                    responderJson(false, 'Ya existe una cuenta registrada con ese correo electrónico.');
                }
                responderJson(false, 'El nombre de usuario ya está en uso.');
            }

            $stmtDni = $db->prepare('SELECT id_cliente FROM cliente WHERE dni = :dni LIMIT 1');
            $stmtDni->bindValue(':dni', $dni);
            $stmtDni->execute();
            if ($stmtDni->fetch()) {
                responderJson(false, 'Ya existe un cliente registrado con ese DNI.');
            }

            $db->beginTransaction();
            try {
                $usuario = new Usuario(null, $username, $email, null, 'cliente', null, 1);
                $usuario->cifrarPassword($password);
                if (!$usuario->insert()) {
                    throw new Exception('No se pudo crear el usuario.');
                }
                $usuario->generarAuthKey();

                $cliente = new Cliente(
                    null,
                    $usuario->id_usuario,
                    $dni,
                    $nombre,
                    $apellidos,
                    $telefono,
                    $direccion !== '' ? $direccion : null
                );
                if (!$cliente->insert()) {
                    throw new Exception('No se pudo crear la ficha de cliente.');
                }

                $db->commit();
            } catch ( Throwable $txError ) {
                if ($db->inTransaction()) {
                    $db->rollBack();
                }
                throw $txError;
            }

            responderJson(true, 'Registro completado con éxito.', [
                'usuario' => $usuario->getArray(),
                'cliente' => $cliente->getArray()
            ]);
            break;
        }

        case 'validar_token': {
            $token = obtenerTokenPeticion($input);
            $usuario = new Usuario();
            if (!$usuario->validarToken($token)) {
                responderJson(false, 'Sesión no válida o expirada.', [], 401);
            }

            $cliente = Cliente::getPorUsuario($usuario->id_usuario);

            responderJson(true, 'Sesión válida.', [
                'usuario' => $usuario->getArray(),
                'cliente' => $cliente ? $cliente->getArray() : null
            ]);
            break;
        }

        case 'logout': {
            $token = obtenerTokenPeticion($input);
            $usuario = new Usuario();
            if ($usuario->validarToken($token)) {
                $db = Conexion::getConexion();
                $stmt = $db->prepare('UPDATE usuario SET auth_key = NULL WHERE id_usuario = :id_usuario');
                $stmt->bindValue(':id_usuario', $usuario->id_usuario, PDO::PARAM_INT);
                $stmt->execute();
            }
            responderJson(true, 'Sesión cerrada correctamente.', []);
            break;
        }

        case 'actualizar_perfil': {
            $token = obtenerTokenPeticion($input);
            $usuario = new Usuario();
            if (!$usuario->validarToken($token)) {
                responderJson(false, 'Sesión no válida o expirada.', [], 401);
            }

            $username = trim((string)($input['username'] ?? $usuario->username));
            $email = trim((string)($input['email'] ?? $usuario->email));
            $password = (string)($input['password'] ?? '');
            $dni = strtoupper(trim((string)($input['dni'] ?? '')));
            $telefono = trim((string)($input['telefono'] ?? ''));
            $nombre = trim((string)($input['nombre'] ?? ''));
            $apellidos = trim((string)($input['apellidos'] ?? ''));
            $direccion = trim((string)($input['direccion'] ?? ''));

            if ($username === '' || $email === '') {
                responderJson(false, 'El nombre de usuario y el correo electrónico son obligatorios.');
            }

            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                responderJson(false, 'El formato del correo electrónico no es válido.');
            }

            $db = Conexion::getConexion();
            $stmtCheck = $db->prepare('SELECT id_usuario FROM usuario WHERE (username = :username OR email = :email) AND id_usuario != :id_usuario LIMIT 1');
            $stmtCheck->bindValue(':username', $username);
            $stmtCheck->bindValue(':email', $email);
            $stmtCheck->bindValue(':id_usuario', $usuario->id_usuario, PDO::PARAM_INT);
            $stmtCheck->execute();
            if ($stmtCheck->fetch()) {
                responderJson(false, 'El nombre de usuario o correo electrónico ya está en uso por otra cuenta.');
            }

            $db->beginTransaction();
            try {
                $usuario->username = $username;
                $usuario->email = $email;
                if ($password !== '') {
                    $usuario->cifrarPassword($password);
                }
                if (!$usuario->update()) {
                    throw new Exception('Error al actualizar los datos de usuario.');
                }

                $cliente = Cliente::getPorUsuario($usuario->id_usuario);
                if ($cliente) {
                    if ($dni !== '') {
                        $stmtDni = $db->prepare('SELECT id_cliente FROM cliente WHERE dni = :dni AND id_cliente != :id_cliente LIMIT 1');
                        $stmtDni->bindValue(':dni', $dni);
                        $stmtDni->bindValue(':id_cliente', $cliente->id_cliente, PDO::PARAM_INT);
                        $stmtDni->execute();
                        if ($stmtDni->fetch()) {
                            $db->rollBack();
                            responderJson(false, 'El DNI indicado ya pertenece a otro cliente.');
                        }
                        $cliente->dni = $dni;
                    }
                    if ($nombre !== '') {
                        $cliente->nombre = $nombre;
                    }
                    if ($apellidos !== '') {
                        $cliente->apellidos = $apellidos;
                    }
                    if ($telefono !== '') {
                        $cliente->telefono = $telefono;
                    }
                    $cliente->direccion = $direccion !== '' ? $direccion : null;
                    if (!$cliente->update()) {
                        throw new Exception('Error al actualizar la ficha de cliente.');
                    }
                }

                $db->commit();
            } catch (Throwable $txError) {
                if ($db->inTransaction()) {
                    $db->rollBack();
                }
                throw $txError;
            }

            responderJson(true, 'Configuración de usuario actualizada correctamente.', [
                'usuario' => $usuario->getArray(),
                'cliente' => $cliente ? $cliente->getArray() : null
            ]);
            break;
        }

        default:
            responderJson(false, 'Acción no reconocida.', [], 400);
    }
} catch (Throwable $e) {
    responderJson(false, 'Error interno del servidor: ' . $e->getMessage(), [], 500);
}
