<?php

require_once __DIR__ . '/Conexion.php';

class Usuario {
    private $id_usuario;
    private $username;
    private $email;
    private $password_hash;
    private $rol;
    private $auth_key;
    private $activo;

    public function __construct(
        $id_usuario = null,
        $username = null,
        $email = null,
        $password_hash = null,
        $rol = 'cliente',
        $auth_key = null,
        $activo = 1
    ) {
        $this->id_usuario = $id_usuario;
        $this->username = $username;
        $this->email = $email;
        $this->password_hash = $password_hash;
        $this->rol = $rol;
        $this->auth_key = $auth_key;
        $this->activo = $activo;
    }

    public function __get($propiedad) {
        if (property_exists($this, $propiedad)) {
            return $this->$propiedad;
        }
        return null;
    }

    public function __set($propiedad, $valor): void {
        if (property_exists($this, $propiedad)) {
            $this->$propiedad = $valor;
        }
    }

    public function cifrarPassword(string $passwordPlano): string {
        $this->password_hash = password_hash($passwordPlano, PASSWORD_BCRYPT);
        return $this->password_hash;
    }

    public function generarAuthKey(): string {
        $this->auth_key = bin2hex(random_bytes(32));
        if (!empty($this->id_usuario)) {
            $db = Conexion::getConexion();
            $stmt = $db->prepare('UPDATE usuario SET auth_key = :auth_key WHERE id_usuario = :id_usuario');
            $stmt->bindValue(':auth_key', $this->auth_key);
            $stmt->bindValue(':id_usuario', $this->id_usuario, PDO::PARAM_INT);
            $stmt->execute();
        }
        return $this->auth_key;
    }

    public function login($email, $password): array {
        $db = Conexion::getConexion();
        $stmt = $db->prepare('SELECT * FROM usuario WHERE email = :email LIMIT 1');
        $stmt->bindValue(':email', $email);
        $stmt->execute();
        $row = $stmt->fetch();

        if (!$row || !(bool)$row['activo']) {
            return [];
        }

        if (!password_verify($password, $row['password_hash'])) {
            return [];
        }

        $this->id_usuario = (int)$row['id_usuario'];
        $this->username = $row['username'];
        $this->email = $row['email'];
        $this->password_hash = $row['password_hash'];
        $this->rol = $row['rol'];
        $this->activo = (bool)$row['activo'];
        $this->generarAuthKey();

        return $this->getArray();
    }

    public function validarToken($auth_key): bool {
        if (empty($auth_key)) {
            return false;
        }

        $db = Conexion::getConexion();
        $stmt = $db->prepare('SELECT * FROM usuario WHERE auth_key = :auth_key AND activo = 1 LIMIT 1');
        $stmt->bindValue(':auth_key', $auth_key);
        $stmt->execute();
        $row = $stmt->fetch();

        if (!$row) {
            return false;
        }

        $this->id_usuario = (int)$row['id_usuario'];
        $this->username = $row['username'];
        $this->email = $row['email'];
        $this->password_hash = $row['password_hash'];
        $this->rol = $row['rol'];
        $this->auth_key = $row['auth_key'];
        $this->activo = (bool)$row['activo'];

        return true;
    }

    public function insert(): bool {
        $db = Conexion::getConexion();
        if (!empty($this->password_hash) && strpos($this->password_hash, '$2y$') !== 0) {
            $this->password_hash = password_hash($this->password_hash, PASSWORD_BCRYPT);
        }

        $sql = 'INSERT INTO usuario (username, email, password_hash, rol, auth_key, activo)
                VALUES (:username, :email, :password_hash, :rol, :auth_key, :activo)';
        $stmt = $db->prepare($sql);
        $stmt->bindValue(':username', $this->username);
        $stmt->bindValue(':email', $this->email);
        $stmt->bindValue(':password_hash', $this->password_hash);
        $stmt->bindValue(':rol', $this->rol ?? 'cliente');
        $stmt->bindValue(':auth_key', $this->auth_key);
        $stmt->bindValue(':activo', $this->activo !== null ? (int)$this->activo : 1, PDO::PARAM_INT);

        $ok = $stmt->execute();
        if ($ok) {
            $this->id_usuario = (int)$db->lastInsertId();
        }
        return $ok;
    }

    public function update(): bool {
        $db = Conexion::getConexion();
        if (!empty($this->password_hash) && strpos($this->password_hash, '$2y$') !== 0) {
            $this->password_hash = password_hash($this->password_hash, PASSWORD_BCRYPT);
        }

        $sql = 'UPDATE usuario
                SET username = :username,
                    email = :email,
                    password_hash = :password_hash,
                    rol = :rol,
                    auth_key = :auth_key,
                    activo = :activo
                WHERE id_usuario = :id_usuario';
        $stmt = $db->prepare($sql);
        $stmt->bindValue(':username', $this->username);
        $stmt->bindValue(':email', $this->email);
        $stmt->bindValue(':password_hash', $this->password_hash);
        $stmt->bindValue(':rol', $this->rol);
        $stmt->bindValue(':auth_key', $this->auth_key);
        $stmt->bindValue(':activo', (int)$this->activo, PDO::PARAM_INT);
        $stmt->bindValue(':id_usuario', $this->id_usuario, PDO::PARAM_INT);

        return $stmt->execute();
    }

    public function delete(): bool {
        $db = Conexion::getConexion();
        $stmt = $db->prepare('DELETE FROM usuario WHERE id_usuario = :id_usuario');
        $stmt->bindValue(':id_usuario', $this->id_usuario, PDO::PARAM_INT);
        return $stmt->execute();
    }

    public function selectAll(): array {
        $db = Conexion::getConexion();
        $stmt = $db->prepare('SELECT * FROM usuario ORDER BY id_usuario ASC');
        $stmt->execute();
        $usuarios = [];
        while ($row = $stmt->fetch()) {
            $u = new Usuario(
                (int)$row['id_usuario'],
                $row['username'],
                $row['email'],
                $row['password_hash'],
                $row['rol'],
                $row['auth_key'],
                (bool)$row['activo']
            );
            $usuarios[] = $u->getArray();
        }
        return $usuarios;
    }

    public static function selectById($id_usuario): ?Usuario {
        $db = Conexion::getConexion();
        $stmt = $db->prepare('SELECT * FROM usuario WHERE id_usuario = :id_usuario LIMIT 1');
        $stmt->bindValue(':id_usuario', $id_usuario, PDO::PARAM_INT);
        $stmt->execute();
        $row = $stmt->fetch();
        if (!$row) {
            return null;
        }
        return new Usuario(
            (int)$row['id_usuario'],
            $row['username'],
            $row['email'],
            $row['password_hash'],
            $row['rol'],
            $row['auth_key'],
            (bool)$row['activo']
        );
    }

    public function getArray(): array {
        return [
            'id_usuario' => $this->id_usuario !== null ? (int)$this->id_usuario : null,
            'username'   => $this->username,
            'email'      => $this->email,
            'rol'        => $this->rol,
            'auth_key'   => $this->auth_key,
            'activo'     => (bool)$this->activo
        ];
    }
}
