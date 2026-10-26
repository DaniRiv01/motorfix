DROP DATABASE IF EXISTS motorfix;
CREATE DATABASE motorfix CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE motorfix;

CREATE TABLE usuario (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    rol ENUM('admin', 'oficina', 'mecanico', 'cliente') NOT NULL DEFAULT 'cliente',
    auth_key VARCHAR(128) DEFAULT NULL UNIQUE,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE cliente (
    id_cliente INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL UNIQUE,
    dni VARCHAR(15) NOT NULL UNIQUE,
    nombre VARCHAR(80) NOT NULL,
    apellidos VARCHAR(120) NOT NULL,
    telefono VARCHAR(20) NOT NULL,
    direccion VARCHAR(255) DEFAULT NULL,
    CONSTRAINT fk_cliente_usuario
        FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE vehiculo (
    id_vehiculo INT AUTO_INCREMENT PRIMARY KEY,
    id_cliente INT NOT NULL,
    matricula VARCHAR(15) NOT NULL UNIQUE,
    marca VARCHAR(60) NOT NULL,
    modelo VARCHAR(80) NOT NULL,
    anio INT NOT NULL,
    kilometraje INT NOT NULL DEFAULT 0,
    CONSTRAINT fk_vehiculo_cliente
        FOREIGN KEY (id_cliente) REFERENCES cliente(id_cliente)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE cita (
    id_cita INT AUTO_INCREMENT PRIMARY KEY,
    id_vehiculo INT NOT NULL,
    id_mecanico INT DEFAULT NULL,
    fecha_solicitud DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_cita DATETIME NOT NULL,
    motivo VARCHAR(255) NOT NULL,
    estado ENUM('pendiente', 'confirmada', 'en_proceso', 'finalizada', 'cancelada') NOT NULL DEFAULT 'pendiente',
    horas_trabajo DECIMAL(6,2) NOT NULL DEFAULT 0.00,
    coste_hora DECIMAL(8,2) NOT NULL DEFAULT 45.00,
    materiales_usados TEXT DEFAULT NULL,
    coste_materiales DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    CONSTRAINT fk_cita_vehiculo
        FOREIGN KEY (id_vehiculo) REFERENCES vehiculo(id_vehiculo)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_cita_mecanico
        FOREIGN KEY (id_mecanico) REFERENCES usuario(id_usuario)
        ON DELETE SET NULL
        ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE factura (
    id_factura INT AUTO_INCREMENT PRIMARY KEY,
    id_cita INT NOT NULL UNIQUE,
    numero_factura VARCHAR(30) NOT NULL UNIQUE,
    fecha_emision DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    importe_mano_obra DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    importe_repuestos DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    iva DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    pagada TINYINT(1) NOT NULL DEFAULT 0,
    CONSTRAINT fk_factura_cita
        FOREIGN KEY (id_cita) REFERENCES cita(id_cita)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE=InnoDB;

INSERT INTO usuario (id_usuario, username, email, password_hash, rol, activo) VALUES
(1, 'admin',      'admin@motorfix.es',   '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin',    1),
(2, 'recepcion',  'oficina@motorfix.es', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'oficina',  1),
(3, 'carlos_mec', 'carlos@motorfix.es',  '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'mecanico', 1),
(4, 'laura_cli',  'laura@cliente.es',    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'cliente',  1),
(5, 'pedro_cli',  'pedro@cliente.es',    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'cliente',  1);

INSERT INTO cliente (id_cliente, id_usuario, dni, nombre, apellidos, telefono, direccion) VALUES
(1, 4, '48123456A', 'Laura', 'Gómez Martínez', '611223344', 'Av. de la Libertad 14, Elche'),
(2, 5, '74987654B', 'Pedro', 'Sánchez Ruiz',   '699887766', 'Calle Mayor 28, Orihuela');

INSERT INTO vehiculo (id_vehiculo, id_cliente, matricula, marca, modelo, anio, kilometraje) VALUES
(1, 1, '1234LGM', 'Seat',   'León 1.5 TSI', 2020, 62400),
(2, 1, '5678KRT', 'Toyota', 'Yaris Hybrid', 2018, 89100),
(3, 2, '9012MNP', 'Ford',   'Focus ST-Line', 2022, 31500);

INSERT INTO cita (id_cita, id_vehiculo, id_mecanico, fecha_solicitud, fecha_cita, motivo, estado, horas_trabajo, coste_hora, materiales_usados, coste_materiales) VALUES
(1, 1, 3, '2026-10-20 09:15:00', '2026-10-22 10:00:00', 'Revisión de los 60.000 km y cambio de aceite + filtros', 'finalizada', 2.50, 45.00, 'Aceite 5W30 Castrol 5L, Filtro de aceite, Filtro de aire', 78.50),
(2, 2, 3, '2026-10-25 11:30:00', '2026-10-27 09:00:00', 'Ruido al frenar en tren delantero', 'en_proceso', 1.00, 45.00, 'Juego de pastillas de freno delanteras Bosch', 54.00),
(3, 3, NULL, '2026-10-26 16:00:00', '2026-10-30 11:00:00', 'Alineación de dirección y revisión de neumáticos', 'pendiente', 0.00, 45.00, NULL, 0.00);

INSERT INTO factura (id_factura, id_cita, numero_factura, fecha_emision, importe_mano_obra, importe_repuestos, subtotal, iva, total, pagada) VALUES
(1, 1, 'MF-2026-0001', '2026-10-22 17:30:00', 112.50, 78.50, 191.00, 40.11, 231.11, 1);
