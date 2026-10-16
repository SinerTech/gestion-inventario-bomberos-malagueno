-- =====================================================================
-- DML BASE: Sistema de Gestión de Inventario
-- Cuartel de Bomberos Voluntarios Malagueño
-- Motor: MySQL 8 / InnoDB
-- =====================================================================

USE bomberos_malagueno;

START TRANSACTION;

-- ---------------------------------------------------------------------
-- 1. Roles
-- ---------------------------------------------------------------------
INSERT INTO rol (nombre_rol) VALUES
('administrador'),
('supervisor'),
('bombero');

-- ---------------------------------------------------------------------
-- 2. Categorías
-- ---------------------------------------------------------------------
INSERT INTO categoria (nombre_categoria) VALUES
('Equipamiento personal'),
('Herramientas'),
('Vehículos');

-- ---------------------------------------------------------------------
-- 3. Áreas
-- ---------------------------------------------------------------------
INSERT INTO area (nombre_area) VALUES
('Jefatura'),
('Capacitación y entrenamiento'),
('Rescate e incendio'),
('Parque Automotor'),
('Logística'),
('Central de Alarmas');

-- ---------------------------------------------------------------------
-- 4. Relación entre áreas y categorías
-- ---------------------------------------------------------------------
INSERT INTO area_categoria (id_area, id_categoria)
SELECT a.id_area, c.id_categoria
FROM (
    SELECT 'Jefatura' AS area, 'Equipamiento personal' AS categoria
    UNION ALL SELECT 'Jefatura', 'Herramientas'
    UNION ALL SELECT 'Capacitación y entrenamiento', 'Equipamiento personal'
    UNION ALL SELECT 'Capacitación y entrenamiento', 'Herramientas'
    UNION ALL SELECT 'Rescate e incendio', 'Equipamiento personal'
    UNION ALL SELECT 'Rescate e incendio', 'Herramientas'
    UNION ALL SELECT 'Parque Automotor', 'Herramientas'
    UNION ALL SELECT 'Parque Automotor', 'Vehículos'
    UNION ALL SELECT 'Logística', 'Equipamiento personal'
    UNION ALL SELECT 'Logística', 'Herramientas'
    UNION ALL SELECT 'Logística', 'Vehículos'
    UNION ALL SELECT 'Central de Alarmas', 'Herramientas'
) AS relaciones
INNER JOIN area a
    ON a.nombre_area = relaciones.area
INNER JOIN categoria c
    ON c.nombre_categoria = relaciones.categoria;

-- ---------------------------------------------------------------------
-- 5. Motivos
-- ---------------------------------------------------------------------
INSERT INTO motivo (nombre_motivo) VALUES
('Compra'),
('Donación'),
('Subsidio'),
('Emergencia'),
('Capacitación'),
('Guardia');

-- ---------------------------------------------------------------------
-- 6. Tipos de movimiento
-- ---------------------------------------------------------------------
INSERT INTO tipo_movimiento (nombre_tipo_movimiento) VALUES
('Ingreso'),
('Retiro');

-- ---------------------------------------------------------------------
-- 7. Proveedores
-- ---------------------------------------------------------------------
INSERT INTO proveedor
    (razon_social, CUIT, telefono_proveedor, email_proveedor)
VALUES
('Ford Argentina S.C.A.', '30-67851968-1',
 '0800-888-3673', 'ateclien@ford.com'),

('Extintores S.R.L', '30-25469878-1',
 '3516996687', 'extintores.at.cl@gmail.com'),

('Equipamientos S.A.S', '30-28989888-5',
 '3514689758', 'eq-at-cl@hotmail.com');

-- ---------------------------------------------------------------------
-- 8. Recursos
-- ---------------------------------------------------------------------
INSERT INTO recurso (nombre_recurso, id_categoria)
SELECT datos.nombre_recurso, c.id_categoria
FROM (
    SELECT 'Guante Ignifugo' AS nombre_recurso,
           'Equipamiento personal' AS categoria
    UNION ALL SELECT 'Matafuego', 'Herramientas'
    UNION ALL SELECT 'Camioneta 4x4', 'Vehículos'
    UNION ALL SELECT 'Casco', 'Equipamiento personal'
) AS datos
INNER JOIN categoria c
    ON c.nombre_categoria = datos.categoria;

-- ---------------------------------------------------------------------
-- 9. Tipos de material
-- ---------------------------------------------------------------------
INSERT INTO tipo_material (nombre_tipo_material) VALUES
('Cuero'),
('Kevlar'),
('Acero'),
('Goma');

-- ---------------------------------------------------------------------
-- 10. Relación entre recursos y materiales
-- ---------------------------------------------------------------------
INSERT INTO recurso_tipo_material (id_recurso, id_tipo_material)
SELECT r.id_recurso, tm.id_tipo_material
FROM (
    SELECT 'Guante Ignifugo' AS recurso, 'Cuero' AS material
    UNION ALL SELECT 'Guante Ignifugo', 'Kevlar'
    UNION ALL SELECT 'Matafuego', 'Acero'
    UNION ALL SELECT 'Matafuego', 'Goma'
    UNION ALL SELECT 'Camioneta 4x4', 'Acero'
    UNION ALL SELECT 'Casco', 'Kevlar'
) AS datos
INNER JOIN recurso r
    ON r.nombre_recurso = datos.recurso
INNER JOIN tipo_material tm
    ON tm.nombre_tipo_material = datos.material;

-- ---------------------------------------------------------------------
-- 11. Unidades de recurso
-- Una unidad por cada recurso base.
-- No se asignan usuarios.
-- ---------------------------------------------------------------------
INSERT INTO unidad_recurso
    (codigo_interno, id_recurso, medida, marca,
     numero_serie_fabricante, fecha_alta, valor, fondo,
     id_proveedor, estado, disponibilidad,
     id_usuario_asignado, observaciones)
SELECT
    datos.codigo_interno,
    r.id_recurso,
    datos.medida,
    datos.marca,
    NULL,
    datos.fecha_alta,
    datos.valor,
    datos.fondo,
    p.id_proveedor,
    datos.estado,
    'Disponible',
    NULL,
    datos.observaciones
FROM (
    SELECT
        'R0001-0001' AS codigo_interno,
        'Guante Ignifugo' AS recurso,
        'Talle M' AS medida,
        'Fire Safe' AS marca,
        '30-28989888-5' AS cuit,
        '2026-10-07 13:28:33' AS fecha_alta,
        45000.00 AS valor,
        'Propio' AS fondo,
        'Op-Regular' AS estado,
        'Compra inicial' AS observaciones

    UNION ALL SELECT
        'R0002-0001', 'Matafuego', '10 kg',
        'Extintores S.R.L', '30-25469878-1',
        '2026-10-07 13:28:33', 85000.00,
        'Propio', 'Op-Bueno', 'Unidad de muestra'

    UNION ALL SELECT
        'R0003-0001', 'Camioneta 4x4', 'Doble cabina 4x4',
        'Ford', '30-67851968-1',
        '2026-10-07 13:28:33', 35000000.00,
        'Donado', 'Op-Bueno', 'Unidad de muestra'

    UNION ALL SELECT
        'R0004-0001', 'Casco', 'Talle M',
        'Fire Safe', '30-28989888-5',
        '2026-10-07 13:29:06', 65000.00,
        'Propio', 'Op-Regular', 'Unidad de muestra'
) AS datos
INNER JOIN recurso r
    ON r.nombre_recurso = datos.recurso
INNER JOIN proveedor p
    ON p.CUIT = datos.cuit;

COMMIT;

-- =====================================================================
-- FIN DEL DML BASE
-- =====================================================================

