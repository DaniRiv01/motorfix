<?php

require_once __DIR__ . '/Conexion.php';
require_once __DIR__ . '/Vehiculo.php';

class Cliente {
    private $id_cliente;
    private $id_usuario;
    private $dni;
    private $nombre;
    private $apellidos;
    private $telefono;
    private $direccion;

    public function __construct(
        $id_cliente = null,
        $id_usuario = null,
        $dni = null,
        $nombre = null,
        $apellidos = null,
        $telefono = null,
        $direccion = null
    ) {
        $this->id_cliente = $id_cliente;
        $this->id_usuario = $id_usuario;
        $this->dni = $dni;
        $this->nombre = $nombre;
        $this->apellidos = $apellidos;
        $this->telefono = $telefono;
        $this->direccion = $direccion;
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

    public function getVehiculos(): array {
        if (empty($this->id_cliente)) {
            return [];
        }
        return Vehiculo::getPorCliente($this->id_cliente);
    }

    public function insert(): bool {
        $db = Conexion::getConexion();
        $sql = 'INSERT INTO cliente (id_usuario, dni, nombre, apellidos, telefono, direccion)
                VALUES (:id_usuario, :dni, :nombre, :apellidos, :telefono, :direccion)';
        $stmt = $db->prepare($sql);
        $stmt->bindValue(':id_usuario', $this->id_usuario, PDO::PARAM_INT);
        $stmt->bindValue(':dni', $this->dni);
        $stmt->bindValue(':nombre', $this->nombre);
        $stmt->bindValue(':apellidos', $this->apellidos);
        $stmt->bindValue(':telefono', $this->telefono);
        $stmt->bindValue(':direccion', $this->direccion);

        $ok = $stmt->execute();
        if ($ok) {
            $this->id_cliente = (int)$db->lastInsertId();
        }
        return $ok;
    }

    public function update(): bool {
        $db = Conexion::getConexion();
        $sql = 'UPDATE cliente
                SET id_usuario = :id_usuario,
                    dni = :dni,
                    nombre = :nombre,
                    apellidos = :apellidos,
                    telefono = :telefono,
                    direccion = :direccion
                WHERE id_cliente = :id_cliente';
        $stmt = $db->prepare($sql);
        $stmt->bindValue(':id_usuario', $this->id_usuario, PDO::PARAM_INT);
        $stmt->bindValue(':dni', $this->dni);
        $stmt->bindValue(':nombre', $this->nombre);
        $stmt->bindValue(':apellidos', $this->apellidos);
        $stmt->bindValue(':telefono', $this->telefono);
        $stmt->bindValue(':direccion', $this->direccion);
        $stmt->bindValue(':id_cliente', $this->id_cliente, PDO::PARAM_INT);

        return $stmt->execute();
    }

    public function delete(): bool {
        $db = Conexion::getConexion();
        $stmt = $db->prepare('DELETE FROM cliente WHERE id_cliente = :id_cliente');
        $stmt->bindValue(':id_cliente', $this->id_cliente, PDO::PARAM_INT);
        return $stmt->execute();
    }

    public function selectAll(): array {
        $db = Conexion::getConexion();
        $stmt = $db->prepare('SELECT * FROM cliente ORDER BY id_cliente ASC');
        $stmt->execute();
        $clientes = [];
        while ($row = $stmt->fetch()) {
            $c = new Cliente(
                (int)$row['id_cliente'],
                (int)$row['id_usuario'],
                $row['dni'],
                $row['nombre'],
                $row['apellidos'],
                $row['telefono'],
                $row['direccion']
            );
            $clientes[] = $c->getArray();
        }
        return $clientes;
    }

    public static function selectById($id_cliente): ?Cliente {
        $db = Conexion::getConexion();
        $stmt = $db->prepare('SELECT * FROM cliente WHERE id_cliente = :id_cliente LIMIT 1');
        $stmt->bindValue(':id_cliente', $id_cliente, PDO::PARAM_INT);
        $stmt->execute();
        $row = $stmt->fetch();
        if (!$row) {
            return null;
        }
        return new Cliente(
            (int)$row['id_cliente'],
            (int)$row['id_usuario'],
            $row['dni'],
            $row['nombre'],
            $row['apellidos'],
            $row['telefono'],
            $row['direccion']
        );
    }

    public static function getPorUsuario($id_usuario): ?Cliente {
        $db = Conexion::getConexion();
        $stmt = $db->prepare('SELECT * FROM cliente WHERE id_usuario = :id_usuario LIMIT 1');
        $stmt->bindValue(':id_usuario', $id_usuario, PDO::PARAM_INT);
        $stmt->execute();
        $row = $stmt->fetch();
        if (!$row) {
            return null;
        }
        return new Cliente(
            (int)$row['id_cliente'],
            (int)$row['id_usuario'],
            $row['dni'],
            $row['nombre'],
            $row['apellidos'],
            $row['telefono'],
            $row['direccion']
        );
    }

    public function getArray(): array {
        return [
            'id_cliente' => $this->id_cliente !== null ? (int)$this->id_cliente : null,
            'id_usuario' => $this->id_usuario !== null ? (int)$this->id_usuario : null,
            'dni'        => $this->dni,
            'nombre'     => $this->nombre,
            'apellidos'  => $this->apellidos,
            'telefono'   => $this->telefono,
            'direccion'  => $this->direccion
        ];
    }
}

