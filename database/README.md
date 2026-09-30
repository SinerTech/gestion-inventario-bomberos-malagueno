# Base de Datos — Sistema de Gestión de Inventario, Cuartel de Bomberos Malagueño

## ⚠️ Este archivo es documentación de referencia
El esquema de base de datos se gestiona mediante las migraciones de Django, 
ubicadas en `backend/app/migrations/`. **No es necesario ejecutar `db.sql` 
manualmente** para levantar el proyecto.

`db.sql` se mantiene en el repositorio como documentación técnica del DDL 
original, útil para revisar el diseño de la base de datos de forma directa 
y legible, o para portar el esquema a otra tecnología en el futuro.

## Setup para desarrollo local
1. Crear una base de datos vacía en MySQL: `CREATE DATABASE bomberos_malagueno;`
2. Configurar las credenciales en `backend/.env` (ver `.env.example`)
3. Desde `backend/`: `python manage.py migrate`
