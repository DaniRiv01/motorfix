<?php

class Conexion {
    private static ?Conexion $instancia = null;
    private ?PDO $dbh = null;
    private string $host;
    private string $db;
    private string $user;
    private string $pass;
    private string $port;

    private function __construct() {
        $envPath = __DIR__ . '/../.env';
        if (!file_exists($envPath)) {
            throw new Exception("No se ha encontrado el archivo de configuración .env en: $envPath");
        }

        $config = parse_ini_file($envPath);
        if ($config === false) {
            throw new Exception("Error al leer el archivo de configuración .env");
        }

        $this->host = $config['DB_HOST'] ?? 'db';
        $this->db   = $config['DB_NAME'] ?? 'motorfix';
        $this->user = $config['DB_USER'] ?? 'root';
        $this->pass = $config['DB_PASS'] ?? '';
        $this->port = (string)($config['DB_PORT'] ?? '3306');

        $dsn = "mysql:host={$this->host};port={$this->port};dbname={$this->db};charset=utf8mb4";
        $opciones = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];

        try {
            $this->dbh = new PDO($dsn, $this->user, $this->pass, $opciones);
        } catch (PDOException $e) {
            throw new Exception("Error de conexión a la base de datos: " . $e->getMessage());
        }
    }

    public static function getConexion(): PDO {
        if (self::$instancia === null) {
            self::$instancia = new self();
        }
        return self::$instancia->dbh;
    }

    private function __clone() {
        throw new Exception("No se permite clonar la instancia de Conexion (Singleton).");
    }
}
