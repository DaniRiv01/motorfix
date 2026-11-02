<?php

require_once __DIR__ . '/Conexion.php';

class Vehiculo {
    private $id_vehiculo;
    private $id_cliente;
    private $matricula;
    private $marca;
    private $modelo;
    private $anio;
    private $kilometraje;

    public function __construct(
        $id_vehiculo = null,
        $id_cliente = null,
        $matricula = null,
        $marca = null,
        $modelo = null,
        $anio = null,
        $kilometraje = 0
    ) {
        $this->id_vehiculo = $id_vehiculo;
        $this->id_cliente = $id_cliente;
        $this->matricula = $matricula;
        $this->marca = $marca;
        $this->modelo = $modelo;
        $this->anio = $anio;
        $this->kilometraje = $kilometraje;
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

    public static function getPorCliente($id_cliente): array {
        $db = Conexion::getConexion();
        $stmt = $db->prepare('SELECT * FROM vehiculo WHERE id_cliente = :id_cliente ORDER BY id_vehiculo ASC');
        $stmt->bindValue(':id_cliente', $id_cliente, PDO::PARAM_INT);
        $stmt->execute();
        $vehiculos = [];
        while ($row = $stmt->fetch()) {
            $v = new Vehiculo(
                (int)$row['id_vehiculo'],
                (int)$row['id_cliente'],
                $row['matricula'],
                $row['marca'],
                $row['modelo'],
                (int)$row['anio'],
                (int)$row['kilometraje']
            );
            $vehiculos[] = $v->getArray();
        }
        return $vehiculos;
    }

    public function insert(): bool {
        $db = Conexion::getConexion();
        $sql = 'INSERT INTO vehiculo (id_cliente, matricula, marca, modelo, anio, kilometraje)
                VALUES (:id_cliente, :matricula, :marca, :modelo, :anio, :kilometraje)';
        $stmt = $db->prepare($sql);
        $stmt->bindValue(':id_cliente', $this->id_cliente, PDO::PARAM_INT);
        $stmt->bindValue(':matricula', strtoupper(trim((string)$this->matricula)));
        $stmt->bindValue(':marca', $this->marca);
        $stmt->bindValue(':modelo', $this->modelo);
        $stmt->bindValue(':anio', (int)$this->anio, PDO::PARAM_INT);
        $stmt->bindValue(':kilometraje', (int)$this->kilometraje, PDO::PARAM_INT);

        $ok = $stmt->execute();
        if ($ok) {
            $this->id_vehiculo = (int)$db->lastInsertId();
        }
        return $ok;
    }

    public function update(): bool {
        $db = Conexion::getConexion();
        $sql = 'UPDATE vehiculo
                SET id_cliente = :id_cliente,
                    matricula = :matricula,
                    marca = :marca,
                    modelo = :modelo,
                    anio = :anio,
                    kilometraje = :kilometraje
                WHERE id_vehiculo = :id_vehiculo';
        $stmt = $db->prepare($sql);
        $stmt->bindValue(':id_cliente', $this->id_cliente, PDO::PARAM_INT);
        $stmt->bindValue(':matricula', strtoupper(trim((string)$this->matricula)));
        $stmt->bindValue(':marca', $this->marca);
        $stmt->bindValue(':modelo', $this->modelo);
        $stmt->bindValue(':anio', (int)$this->anio, PDO::PARAM_INT);
        $stmt->bindValue(':kilometraje', (int)$this->kilometraje, PDO::PARAM_INT);
        $stmt->bindValue(':id_vehiculo', $this->id_vehiculo, PDO::PARAM_INT);

        return $stmt->execute();
    }

    public function delete(): bool {
        $db = Conexion::getConexion();
        $stmt = $db->prepare('DELETE FROM vehiculo WHERE id_vehiculo = :id_vehiculo');
        $stmt->bindValue(':id_vehiculo', $this->id_vehiculo, PDO::PARAM_INT);
        return $stmt->execute();
    }

    public function selectAll(): array {
        $db = Conexion::getConexion();
        $stmt = $db->prepare('SELECT * FROM vehiculo ORDER BY id_vehiculo ASC');
        $stmt->execute();
        $vehiculos = [];
        while ($row = $stmt->fetch()) {
            $v = new Vehiculo(
                (int)$row['id_vehiculo'],
                (int)$row['id_cliente'],
                $row['matricula'],
                $row['marca'],
                $row['modelo'],
                (int)$row['anio'],
                (int)$row['kilometraje']
            );
            $vehiculos[] = $v->getArray();
        }
        return $vehiculos;
    }

    public static function selectById($id_vehiculo): ?Vehiculo {
        $db = Conexion::getConexion();
        $stmt = $db->prepare('SELECT * FROM vehiculo WHERE id_vehiculo = :id_vehiculo LIMIT 1');
        $stmt->bindValue(':id_vehiculo', $id_vehiculo, PDO::PARAM_INT);
        $stmt->execute();
        $row = $stmt->fetch();
        if (!$row) {
            return null;
        }
        return new Vehiculo(
            (int)$row['id_vehiculo'],
            (int)$row['id_cliente'],
            $row['matricula'],
            $row['marca'],
            $row['modelo'],
            (int)$row['anio'],
            (int)$row['kilometraje']
        );
    }

    public function getArray(): array {
        return [
            'id_vehiculo' => $this->id_vehiculo !== null ? (int)$this->id_vehiculo : null,
            'id_cliente'  => $this->id_cliente !== null ? (int)$this->id_cliente : null,
            'matricula'   => $this->matricula,
            'marca'       => $this->marca,
            'modelo'      => $this->modelo,
            'anio'        => $this->anio !== null ? (int)$this->anio : null,
            'kilometraje' => $this->kilometraje !== null ? (int)$this->kilometraje : 0
        ];
    }
}
