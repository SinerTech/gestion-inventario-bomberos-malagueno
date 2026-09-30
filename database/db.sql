-- =====================================================================
-- BASE DE DATOS: Sistema de Gestión de Inventario
-- Cuartel de Bomberos Voluntarios Malagueño
-- Motor: MySQL 8 / InnoDB / utf8mb4
-- =====================================================================

CREATE DATABASE IF NOT EXISTS bomberos_malagueno
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE bomberos_malagueno;

-- =====================================================================
-- 1. categoria
-- =====================================================================
CREATE TABLE categoria (
  id_categoria     INT AUTO_INCREMENT PRIMARY KEY,
  nombre_categoria VARCHAR(50) NOT NULL
) ENGINE=InnoDB;

-- =====================================================================
-- 2. area
-- =====================================================================
CREATE TABLE area (
  id_area     INT AUTO_INCREMENT PRIMARY KEY,
  nombre_area VARCHAR(50) NOT NULL
) ENGINE=InnoDB;

-- =====================================================================
-- 3. tipo_material
-- =====================================================================
CREATE TABLE tipo_material (
  id_tipo_material      INT AUTO_INCREMENT PRIMARY KEY,
  nombre_tipo_material   VARCHAR(50) NOT NULL
) ENGINE=InnoDB;

-- =====================================================================
-- 4. area_categoria (tabla intermedia N:M — area / categoria)
-- =====================================================================
CREATE TABLE area_categoria (
  id_area_categoria INT AUTO_INCREMENT PRIMARY KEY,
  id_area           INT NOT NULL,
  id_categoria      INT NOT NULL,
  CONSTRAINT fk_areacategoria_area
    FOREIGN KEY (id_area) REFERENCES area(id_area)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_areacategoria_categoria
    FOREIGN KEY (id_categoria) REFERENCES categoria(id_categoria)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT uq_area_categoria UNIQUE (id_area, id_categoria)
) ENGINE=InnoDB;

-- =====================================================================
-- 5. tipo_movimiento
-- =====================================================================
CREATE TABLE tipo_movimiento (
  id_tipo_movimiento     INT AUTO_INCREMENT PRIMARY KEY,
  nombre_tipo_movimiento VARCHAR(50) NOT NULL
) ENGINE=InnoDB;

-- =====================================================================
-- 6. motivo
-- =====================================================================
CREATE TABLE motivo (
  id_motivo     INT AUTO_INCREMENT PRIMARY KEY,
  nombre_motivo VARCHAR(50) NOT NULL
) ENGINE=InnoDB;

-- =====================================================================
-- 7. rol
-- =====================================================================
CREATE TABLE rol (
  id_rol     INT AUTO_INCREMENT PRIMARY KEY,
  nombre_rol VARCHAR(50) NOT NULL
) ENGINE=InnoDB;

-- =====================================================================
-- 8. recurso
-- =====================================================================
CREATE TABLE recurso (
  id_recurso     INT AUTO_INCREMENT PRIMARY KEY,
  nombre_recurso VARCHAR(60) NOT NULL,
  id_categoria   INT NOT NULL,
  CONSTRAINT fk_recurso_categoria
    FOREIGN KEY (id_categoria) REFERENCES categoria(id_categoria)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE INDEX idx_recurso_nombre ON recurso(nombre_recurso);
CREATE INDEX idx_recurso_categoria ON recurso(id_categoria);

-- =====================================================================
-- 9. recurso_tipo_material (tabla intermedia N:M — recurso / tipo_material)
-- =====================================================================
CREATE TABLE recurso_tipo_material (
  id_recurso_tipo_material INT AUTO_INCREMENT PRIMARY KEY,
  id_recurso               INT NOT NULL,
  id_tipo_material         INT NOT NULL,
  CONSTRAINT fk_recursotipo_recurso
    FOREIGN KEY (id_recurso) REFERENCES recurso(id_recurso)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_recursotipo_tipomaterial
    FOREIGN KEY (id_tipo_material) REFERENCES tipo_material(id_tipo_material)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT uq_recurso_tipo_material UNIQUE (id_recurso, id_tipo_material)
) ENGINE=InnoDB;

-- =====================================================================
-- 10. proveedor
-- =====================================================================
CREATE TABLE proveedor (
  id_proveedor       INT AUTO_INCREMENT PRIMARY KEY,
  razon_social       VARCHAR(100) NOT NULL,
  CUIT               VARCHAR(20) NOT NULL,
  telefono_proveedor VARCHAR(20),
  email_proveedor    VARCHAR(100),
  CONSTRAINT uq_proveedor_cuit UNIQUE (CUIT)
) ENGINE=InnoDB;

CREATE INDEX idx_proveedor_razonsocial ON proveedor(razon_social);

-- =====================================================================
-- 11. usuario
-- =====================================================================
CREATE TABLE usuario (
  id_usuario     INT AUTO_INCREMENT PRIMARY KEY,
  nombre_usuario VARCHAR(50) NOT NULL,
  id_rol         INT NOT NULL,
  id_area        INT NOT NULL,
  email_usuario  VARCHAR(100) NOT NULL,
  password       VARCHAR(128) NOT NULL,
  activo         BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT fk_usuario_rol
    FOREIGN KEY (id_rol) REFERENCES rol(id_rol)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_usuario_area
    FOREIGN KEY (id_area) REFERENCES area(id_area)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT uq_usuario_email UNIQUE (email_usuario)
) ENGINE=InnoDB;

CREATE INDEX idx_usuario_nombre ON usuario(nombre_usuario);
CREATE INDEX idx_usuario_area ON usuario(id_area);
CREATE INDEX idx_usuario_activo ON usuario(activo);

-- =====================================================================
-- 12. unidad_recurso
-- =====================================================================
CREATE TABLE unidad_recurso (
  id_unidad_recurso       INT AUTO_INCREMENT PRIMARY KEY,
  codigo_interno          VARCHAR(100) NOT NULL,
  id_recurso              INT NOT NULL,
  medida                  VARCHAR(60),
  marca                   VARCHAR(100),
  numero_serie_fabricante VARCHAR(100),
  fecha_alta              DATETIME NOT NULL,
  valor                   DECIMAL(12,2),
  fondo                   ENUM('Propio','Donado','Subsidio Nacional','Subsidio Provincial','Subsidio Especifico PPMF')
                            NOT NULL DEFAULT 'Propio',
  id_proveedor            INT NOT NULL,
  estado                  ENUM('Op-Bueno','Op-Regular','Op-Malo','NoOp-Bueno','NoOp-Regular','NoOp-Malo')
                            NOT NULL DEFAULT 'Op-Bueno',
  disponibilidad          ENUM('Disponible','En Uso','De Baja') NOT NULL DEFAULT 'Disponible',
  id_usuario_asignado     INT NULL,
  observaciones           TEXT,
  CONSTRAINT fk_unidadrecurso_recurso
    FOREIGN KEY (id_recurso) REFERENCES recurso(id_recurso)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_unidadrecurso_proveedor
    FOREIGN KEY (id_proveedor) REFERENCES proveedor(id_proveedor)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_unidadrecurso_usuario
    FOREIGN KEY (id_usuario_asignado) REFERENCES usuario(id_usuario)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT uq_unidadrecurso_codigo UNIQUE (codigo_interno)
) ENGINE=InnoDB;

CREATE INDEX idx_unidadrecurso_recurso ON unidad_recurso(id_recurso);
CREATE INDEX idx_unidadrecurso_disponibilidad ON unidad_recurso(disponibilidad);
CREATE INDEX idx_unidadrecurso_estado ON unidad_recurso(estado);
CREATE INDEX idx_unidadrecurso_usuarioasignado ON unidad_recurso(id_usuario_asignado);

-- =====================================================================
-- 13. movimiento_inventario
-- =====================================================================
CREATE TABLE movimiento_inventario (
  id_movimiento          INT AUTO_INCREMENT PRIMARY KEY,
  id_recurso             INT NOT NULL,
  id_unidad_recurso      INT NOT NULL,
  id_usuario_asignado    INT NOT NULL,
  id_usuario_registra    INT NOT NULL,
  id_proveedor           INT NULL,
  id_motivo              INT NULL,
  id_tipo_movimiento     INT NOT NULL,
  estado_al_retirar      ENUM('Op-Bueno','Op-Regular','Op-Malo','NoOp-Bueno','NoOp-Regular','NoOp-Malo') NULL,
  estado_al_devolver     ENUM('Op-Bueno','Op-Regular','Op-Malo','NoOp-Bueno','NoOp-Regular','NoOp-Malo') NULL,
  fecha_hora_movimiento  DATETIME NOT NULL,
  fecha_hora_devolucion  DATETIME NULL,
  numero_lote_factura    VARCHAR(100),
  observaciones          TEXT,
  CONSTRAINT fk_movimiento_recurso
    FOREIGN KEY (id_recurso) REFERENCES recurso(id_recurso)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_movimiento_unidadrecurso
    FOREIGN KEY (id_unidad_recurso) REFERENCES unidad_recurso(id_unidad_recurso)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_movimiento_usuarioasignado
    FOREIGN KEY (id_usuario_asignado) REFERENCES usuario(id_usuario)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_movimiento_usuarioregistra
    FOREIGN KEY (id_usuario_registra) REFERENCES usuario(id_usuario)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_movimiento_proveedor
    FOREIGN KEY (id_proveedor) REFERENCES proveedor(id_proveedor)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_movimiento_motivo
    FOREIGN KEY (id_motivo) REFERENCES motivo(id_motivo)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_movimiento_tipomovimiento
    FOREIGN KEY (id_tipo_movimiento) REFERENCES tipo_movimiento(id_tipo_movimiento)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE INDEX idx_movimiento_unidadrecurso ON movimiento_inventario(id_unidad_recurso);
CREATE INDEX idx_movimiento_usuarioasignado ON movimiento_inventario(id_usuario_asignado);
CREATE INDEX idx_movimiento_tipo ON movimiento_inventario(id_tipo_movimiento);
CREATE INDEX idx_movimiento_fecha ON movimiento_inventario(fecha_hora_movimiento);
CREATE INDEX idx_movimiento_devolucion_pendiente
  ON movimiento_inventario(id_unidad_recurso, fecha_hora_devolucion);

-- =====================================================================
-- 14. alerta
-- =====================================================================
CREATE TABLE alerta (
  id_alerta            INT AUTO_INCREMENT PRIMARY KEY,
  id_unidad_recurso    INT NOT NULL,
  origen               ENUM('Manual','Automatica') NOT NULL,
  id_movimiento        INT NULL,
  id_usuario_reporta   INT NULL,
  fecha_generada       DATETIME NOT NULL,
  observaciones        TEXT,
  estado_alerta        ENUM('Pendiente','Atendida') NOT NULL DEFAULT 'Pendiente',
  id_usuario_gestiona  INT NULL,
  fecha_gestionada     DATETIME NULL,
  CONSTRAINT fk_alerta_unidadrecurso
    FOREIGN KEY (id_unidad_recurso) REFERENCES unidad_recurso(id_unidad_recurso)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_alerta_movimiento
    FOREIGN KEY (id_movimiento) REFERENCES movimiento_inventario(id_movimiento)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_alerta_usuarioreporta
    FOREIGN KEY (id_usuario_reporta) REFERENCES usuario(id_usuario)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_alerta_usuariogestiona
    FOREIGN KEY (id_usuario_gestiona) REFERENCES usuario(id_usuario)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE INDEX idx_alerta_unidadrecurso ON alerta(id_unidad_recurso);
CREATE INDEX idx_alerta_estado ON alerta(estado_alerta);
CREATE INDEX idx_alerta_fecha ON alerta(fecha_generada);
