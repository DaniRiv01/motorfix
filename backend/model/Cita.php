<?php

require_once __DIR__ . '/Conexion.php';

class Cita {
    private $id_cita;
    private $id_vehiculo;
    private $id_mecanico;
    private $fecha_solicitud;
    private $fecha_cita;
    private $motivo;
    private $estado;
    private $horas_trabajo;
    private $coste_hora;
    private $materiales_usados;
    private $coste_materiales;

    public function __construct(
        $id_cita = null,
        $id_vehiculo = null,
        $id_mecanico = null,
        $fecha_solicitud = null,
        $fecha_cita = null,
        $motivo = null,
        $estado = 'pendiente',
        $horas_trabajo = 0.00,
        $coste_hora = 45.00,
        $materiales_usados = null,
        $coste_materiales = 0.00
    ) {
        $this->id_cita = $id_cita;
        $this->id_vehiculo = $id_vehiculo;
        $this->id_mecanico = $id_mecanico;
        $this->fecha_solicitud = $fecha_solicitud;
        $this->fecha_cita = $fecha_cita;
        $this->motivo = $motivo;
        $this->estado = $estado;
        $this->horas_trabajo = $horas_trabajo;
        $this->coste_hora = $coste_hora;
        $this->materiales_usados = $materiales_usados;
        $this->coste_materiales = $coste_materiales;
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

    public function insert(): bool {
        $db = Conexion::getConexion();
        $sql = 'INSERT INTO cita (
                    id_vehiculo,
                    id_mecanico,
                    fecha_cita,
                    motivo,
                    estado,
                    horas_trabajo,
                    coste_hora,
                    materiales_usados,
                    coste_materiales
                ) VALUES (
                    :id_vehiculo,
                    :id_mecanico,
                    :fecha_cita,
                    :motivo,
                    :estado,
                    :horas_trabajo,
                    :coste_hora,
                    :materiales_usados,
                    :coste_materiales
                )';
        $stmt = $db->prepare($sql);
        $stmt->bindValue(':id_vehiculo', (int)$this->id_vehiculo, PDO::PARAM_INT);
        if ($this->id_mecanico !== null && $this->id_mecanico !== '') {
            $stmt->bindValue(':id_mecanico', (int)$this->id_mecanico, PDO::PARAM_INT);
        } else {
            $stmt->bindValue(':id_mecanico', null, PDO::PARAM_NULL);
        }
        $stmt->bindValue(':fecha_cita', $this->fecha_cita);
        $stmt->bindValue(':motivo', $this->motivo);
        $stmt->bindValue(':estado', $this->estado ?? 'pendiente');
        $stmt->bindValue(':horas_trabajo', number_format((float)($this->horas_trabajo ?? 0), 2, '.', ''));
        $stmt->bindValue(':coste_hora', number_format((float)($this->coste_hora ?? 45.00), 2, '.', ''));
        $stmt->bindValue(':materiales_usados', $this->materiales_usados);
        $stmt->bindValue(':coste_materiales', number_format((float)($this->coste_materiales ?? 0), 2, '.', ''));

        $ok = $stmt->execute();
        if ($ok) {
            $this->id_cita = (int)$db->lastInsertId();
            if (empty($this->fecha_solicitud)) {
                $creada = self::selectById($this->id_cita);
                if ($creada) {
                    $this->fecha_solicitud = $creada->fecha_solicitud;
                }
            }
        }
        return $ok;
    }

    public function update(): bool {
        $db = Conexion::getConexion();
        $sql = 'UPDATE cita
                SET id_vehiculo = :id_vehiculo,
                    id_mecanico = :id_mecanico,
                    fecha_cita = :fecha_cita,
                    motivo = :motivo,
                    estado = :estado,
                    horas_trabajo = :horas_trabajo,
                    coste_hora = :coste_hora,
                    materiales_usados = :materiales_usados,
                    coste_materiales = :coste_materiales
                WHERE id_cita = :id_cita';
        $stmt = $db->prepare($sql);
        $stmt->bindValue(':id_vehiculo', (int)$this->id_vehiculo, PDO::PARAM_INT);
        if ($this->id_mecanico !== null && $this->id_mecanico !== '') {
            $stmt->bindValue(':id_mecanico', (int)$this->id_mecanico, PDO::PARAM_INT);
        } else {
            $stmt->bindValue(':id_mecanico', null, PDO::PARAM_NULL);
        }
        $stmt->bindValue(':fecha_cita', $this->fecha_cita);
        $stmt->bindValue(':motivo', $this->motivo);
        $stmt->bindValue(':estado', $this->estado);
        $stmt->bindValue(':horas_trabajo', number_format((float)$this->horas_trabajo, 2, '.', ''));
        $stmt->bindValue(':coste_hora', number_format((float)$this->coste_hora, 2, '.', ''));
        $stmt->bindValue(':materiales_usados', $this->materiales_usados);
        $stmt->bindValue(':coste_materiales', number_format((float)$this->coste_materiales, 2, '.', ''));
        $stmt->bindValue(':id_cita', (int)$this->id_cita, PDO::PARAM_INT);

        return $stmt->execute();
    }

    public function delete(): bool {
        $db = Conexion::getConexion();
        $stmt = $db->prepare('DELETE FROM cita WHERE id_cita = :id_cita');
        $stmt->bindValue(':id_cita', (int)$this->id_cita, PDO::PARAM_INT);
        return $stmt->execute();
    }

    public function selectAll(): array {
        $db = Conexion::getConexion();
        $sql = 'SELECT c.*, v.matricula, v.marca, v.modelo, u.username AS mecanico_username
                FROM cita c
                INNER JOIN vehiculo v ON c.id_vehiculo = v.id_vehiculo
                LEFT JOIN usuario u ON c.id_mecanico = u.id_usuario
                ORDER BY c.fecha_cita DESC';
        $stmt = $db->prepare($sql);
        $stmt->execute();
        $citas = [];
        while ($row = $stmt->fetch()) {
            $cita = self::fromRow($row);
            $item = $cita->getArray();
            $item['matricula'] = $row['matricula'];
            $item['marca'] = $row['marca'];
            $item['modelo'] = $row['modelo'];
            $item['mecanico_username'] = $row['mecanico_username'] ?? null;
            $citas[] = $item;
        }
        return $citas;
    }

    public static function selectById($id_cita): ?Cita {
        $db = Conexion::getConexion();
        $stmt = $db->prepare('SELECT * FROM cita WHERE id_cita = :id_cita LIMIT 1');
        $stmt->bindValue(':id_cita', (int)$id_cita, PDO::PARAM_INT);
        $stmt->execute();
        $row = $stmt->fetch();
        if (!$row) {
            return null;
        }
        return self::fromRow($row);
    }

    public static function getPorCliente($id_cliente): array {
        $db = Conexion::getConexion();
        $sql = 'SELECT c.*, v.matricula, v.marca, v.modelo, u.username AS mecanico_username
                FROM cita c
                INNER JOIN vehiculo v ON c.id_vehiculo = v.id_vehiculo
                LEFT JOIN usuario u ON c.id_mecanico = u.id_usuario
                WHERE v.id_cliente = :id_cliente
                ORDER BY c.fecha_cita DESC';
        $stmt = $db->prepare($sql);
        $stmt->bindValue(':id_cliente', (int)$id_cliente, PDO::PARAM_INT);
        $stmt->execute();
        $citas = [];
        while ($row = $stmt->fetch()) {
            $cita = self::fromRow($row);
            $item = $cita->getArray();
            $item['matricula'] = $row['matricula'];
            $item['marca'] = $row['marca'];
            $item['modelo'] = $row['modelo'];
            $item['mecanico_username'] = $row['mecanico_username'] ?? null;
            $citas[] = $item;
        }
        return $citas;
    }

    public static function getPorVehiculo($id_vehiculo): array {
        $db = Conexion::getConexion();
        $stmt = $db->prepare('SELECT * FROM cita WHERE id_vehiculo = :id_vehiculo ORDER BY fecha_cita DESC');
        $stmt->bindValue(':id_vehiculo', (int)$id_vehiculo, PDO::PARAM_INT);
        $stmt->execute();
        $citas = [];
        while ($row = $stmt->fetch()) {
            $citas[] = self::fromRow($row)->getArray();
        }
        return $citas;
    }

    public static function getPorMecanico($id_mecanico): array {
        $db = Conexion::getConexion();
        $sql = 'SELECT c.*, v.matricula, v.marca, v.modelo
                FROM cita c
                INNER JOIN vehiculo v ON c.id_vehiculo = v.id_vehiculo
                WHERE c.id_mecanico = :id_mecanico
                ORDER BY c.fecha_cita ASC';
        $stmt = $db->prepare($sql);
        $stmt->bindValue(':id_mecanico', (int)$id_mecanico, PDO::PARAM_INT);
        $stmt->execute();
        $citas = [];
        while ($row = $stmt->fetch()) {
            $cita = self::fromRow($row);
            $item = $cita->getArray();
            $item['matricula'] = $row['matricula'];
            $item['marca'] = $row['marca'];
            $item['modelo'] = $row['modelo'];
            $citas[] = $item;
        }
        return $citas;
    }

    private static function fromRow(array $row): Cita {
        return new Cita(
            (int)$row['id_cita'],
            (int)$row['id_vehiculo'],
            $row['id_mecanico'] !== null ? (int)$row['id_mecanico'] : null,
            $row['fecha_solicitud'],
            $row['fecha_cita'],
            $row['motivo'],
            $row['estado'],
            (float)$row['horas_trabajo'],
            (float)$row['coste_hora'],
            $row['materiales_usados'],
            (float)$row['coste_materiales']
        );
    }

    public function getArray(): array {
        return [
            'id_cita'           => $this->id_cita !== null ? (int)$this->id_cita : null,
            'id_vehiculo'       => $this->id_vehiculo !== null ? (int)$this->id_vehiculo : null,
            'id_mecanico'       => $this->id_mecanico !== null ? (int)$this->id_mecanico : null,
            'fecha_solicitud'   => $this->fecha_solicitud,
            'fecha_cita'        => $this->fecha_cita,
            'motivo'            => $this->motivo,
            'estado'            => $this->estado,
            'horas_trabajo'     => (float)$this->horas_trabajo,
            'coste_hora'        => (float)$this->coste_hora,
            'materiales_usados' => $this->materiales_usados,
            'coste_materiales'  => (float)$this->coste_materiales
        ];
    }
}
