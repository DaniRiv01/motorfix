<?php

require_once __DIR__ . '/Conexion.php';

class Factura {
    private $id_factura;
    private $id_cita;
    private $numero_factura;
    private $fecha_emision;
    private $importe_mano_obra;
    private $importe_repuestos;
    private $subtotal;
    private $iva;
    private $total;
    private $pagada;

    public function __construct(
        $id_factura = null,
        $id_cita = null,
        $numero_factura = null,
        $fecha_emision = null,
        $importe_mano_obra = 0.00,
        $importe_repuestos = 0.00,
        $subtotal = 0.00,
        $iva = 0.00,
        $total = 0.00,
        $pagada = 0
    ) {
        $this->id_factura = $id_factura;
        $this->id_cita = $id_cita;
        $this->numero_factura = $numero_factura;
        $this->fecha_emision = $fecha_emision;
        $this->importe_mano_obra = $importe_mano_obra;
        $this->importe_repuestos = $importe_repuestos;
        $this->subtotal = $subtotal;
        $this->iva = $iva;
        $this->total = $total;
        $this->pagada = $pagada;
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

    public function calcularImportes(float $horas_trabajo, float $coste_hora, float $coste_materiales, float $porcentajeIva = 0.21): void {
        $this->importe_mano_obra = round($horas_trabajo * $coste_hora, 2);
        $this->importe_repuestos = round($coste_materiales, 2);
        $this->subtotal = round($this->importe_mano_obra + $this->importe_repuestos, 2);
        $this->iva = round($this->subtotal * $porcentajeIva, 2);
        $this->total = round($this->subtotal + $this->iva, 2);
    }

    public static function generarNumeroFactura(): string {
        $db = Conexion::getConexion();
        $anio = date('Y');
        $stmt = $db->prepare('SELECT COUNT(*) AS total FROM factura WHERE YEAR(fecha_emision) = :anio');
        $stmt->bindValue(':anio', (int)$anio, PDO::PARAM_INT);
        $stmt->execute();
        $row = $stmt->fetch();
        $correlativo = ((int)($row['total'] ?? 0)) + 1;
        return sprintf('MF-%s-%04d', $anio, $correlativo);
    }

    public function insert(): bool {
        $db = Conexion::getConexion();
        if (empty($this->numero_factura)) {
            $this->numero_factura = self::generarNumeroFactura();
        }

        $sql = 'INSERT INTO factura (
                    id_cita,
                    numero_factura,
                    importe_mano_obra,
                    importe_repuestos,
                    subtotal,
                    iva,
                    total,
                    pagada
                ) VALUES (
                    :id_cita,
                    :numero_factura,
                    :importe_mano_obra,
                    :importe_repuestos,
                    :subtotal,
                    :iva,
                    :total,
                    :pagada
                )';
        $stmt = $db->prepare($sql);
        $stmt->bindValue(':id_cita', (int)$this->id_cita, PDO::PARAM_INT);
        $stmt->bindValue(':numero_factura', $this->numero_factura);
        $stmt->bindValue(':importe_mano_obra', number_format((float)$this->importe_mano_obra, 2, '.', ''));
        $stmt->bindValue(':importe_repuestos', number_format((float)$this->importe_repuestos, 2, '.', ''));
        $stmt->bindValue(':subtotal', number_format((float)$this->subtotal, 2, '.', ''));
        $stmt->bindValue(':iva', number_format((float)$this->iva, 2, '.', ''));
        $stmt->bindValue(':total', number_format((float)$this->total, 2, '.', ''));
        $stmt->bindValue(':pagada', $this->pagada ? 1 : 0, PDO::PARAM_INT);

        $ok = $stmt->execute();
        if ($ok) {
            $this->id_factura = (int)$db->lastInsertId();
            if (empty($this->fecha_emision)) {
                $creada = self::selectById($this->id_factura);
                if ($creada) {
                    $this->fecha_emision = $creada->fecha_emision;
                }
            }
        }
        return $ok;
    }

    public function update(): bool {
        $db = Conexion::getConexion();
        $sql = 'UPDATE factura
                SET id_cita = :id_cita,
                    numero_factura = :numero_factura,
                    importe_mano_obra = :importe_mano_obra,
                    importe_repuestos = :importe_repuestos,
                    subtotal = :subtotal,
                    iva = :iva,
                    total = :total,
                    pagada = :pagada
                WHERE id_factura = :id_factura';
        $stmt = $db->prepare($sql);
        $stmt->bindValue(':id_cita', (int)$this->id_cita, PDO::PARAM_INT);
        $stmt->bindValue(':numero_factura', $this->numero_factura);
        $stmt->bindValue(':importe_mano_obra', number_format((float)$this->importe_mano_obra, 2, '.', ''));
        $stmt->bindValue(':importe_repuestos', number_format((float)$this->importe_repuestos, 2, '.', ''));
        $stmt->bindValue(':subtotal', number_format((float)$this->subtotal, 2, '.', ''));
        $stmt->bindValue(':iva', number_format((float)$this->iva, 2, '.', ''));
        $stmt->bindValue(':total', number_format((float)$this->total, 2, '.', ''));
        $stmt->bindValue(':pagada', $this->pagada ? 1 : 0, PDO::PARAM_INT);
        $stmt->bindValue(':id_factura', (int)$this->id_factura, PDO::PARAM_INT);

        return $stmt->execute();
    }

    public function delete(): bool {
        $db = Conexion::getConexion();
        $stmt = $db->prepare('DELETE FROM factura WHERE id_factura = :id_factura');
        $stmt->bindValue(':id_factura', (int)$this->id_factura, PDO::PARAM_INT);
        return $stmt->execute();
    }

    public function selectAll(): array {
        $db = Conexion::getConexion();
        $sql = 'SELECT f.*, c.fecha_cita, c.motivo, v.matricula, v.marca, v.modelo
                FROM factura f
                INNER JOIN cita c ON f.id_cita = c.id_cita
                INNER JOIN vehiculo v ON c.id_vehiculo = v.id_vehiculo
                ORDER BY f.fecha_emision DESC';
        $stmt = $db->prepare($sql);
        $stmt->execute();
        $facturas = [];
        while ($row = $stmt->fetch()) {
            $factura = self::fromRow($row);
            $item = $factura->getArray();
            $item['fecha_cita'] = $row['fecha_cita'];
            $item['motivo'] = $row['motivo'];
            $item['matricula'] = $row['matricula'];
            $item['marca'] = $row['marca'];
            $item['modelo'] = $row['modelo'];
            $facturas[] = $item;
        }
        return $facturas;
    }

    public static function selectById($id_factura): ?Factura {
        $db = Conexion::getConexion();
        $stmt = $db->prepare('SELECT * FROM factura WHERE id_factura = :id_factura LIMIT 1');
        $stmt->bindValue(':id_factura', (int)$id_factura, PDO::PARAM_INT);
        $stmt->execute();
        $row = $stmt->fetch();
        if (!$row) {
            return null;
        }
        return self::fromRow($row);
    }

    public static function getPorCita($id_cita): ?Factura {
        $db = Conexion::getConexion();
        $stmt = $db->prepare('SELECT * FROM factura WHERE id_cita = :id_cita LIMIT 1');
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
        $sql = 'SELECT f.*, c.fecha_cita, c.motivo, v.matricula, v.marca, v.modelo
                FROM factura f
                INNER JOIN cita c ON f.id_cita = c.id_cita
                INNER JOIN vehiculo v ON c.id_vehiculo = v.id_vehiculo
                WHERE v.id_cliente = :id_cliente
                ORDER BY f.fecha_emision DESC';
        $stmt = $db->prepare($sql);
        $stmt->bindValue(':id_cliente', (int)$id_cliente, PDO::PARAM_INT);
        $stmt->execute();
        $facturas = [];
        while ($row = $stmt->fetch()) {
            $factura = self::fromRow($row);
            $item = $factura->getArray();
            $item['fecha_cita'] = $row['fecha_cita'];
            $item['motivo'] = $row['motivo'];
            $item['matricula'] = $row['matricula'];
            $item['marca'] = $row['marca'];
            $item['modelo'] = $row['modelo'];
            $facturas[] = $item;
        }
        return $facturas;
    }

    private static function fromRow(array $row): Factura {
        return new Factura(
            (int)$row['id_factura'],
            (int)$row['id_cita'],
            $row['numero_factura'],
            $row['fecha_emision'],
            (float)$row['importe_mano_obra'],
            (float)$row['importe_repuestos'],
            (float)$row['subtotal'],
            (float)$row['iva'],
            (float)$row['total'],
            (bool)$row['pagada']
        );
    }

    public function getArray(): array {
        return [
            'id_factura'        => $this->id_factura !== null ? (int)$this->id_factura : null,
            'id_cita'           => $this->id_cita !== null ? (int)$this->id_cita : null,
            'numero_factura'    => $this->numero_factura,
            'fecha_emision'     => $this->fecha_emision,
            'importe_mano_obra' => (float)$this->importe_mano_obra,
            'importe_repuestos' => (float)$this->importe_repuestos,
            'subtotal'          => (float)$this->subtotal,
            'iva'               => (float)$this->iva,
            'total'             => (float)$this->total,
            'pagada'            => (bool)$this->pagada
        ];
    }
}
