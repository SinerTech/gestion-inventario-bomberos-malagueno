# Backend — Bomberos de Malagueño

## Backend del sistema de gestión de inventario interno del Cuartel de Bomberos Voluntarios de Malagueño.

Este módulo contiene la lógica de negocio, expone la API REST y administra el acceso a los datos mediante Django ORM.

## Tecnologías

* Python
* Django
* Django REST Framework
* Django ORM
* MySQL

## Requisitos previos

* Python
* MySQL Server
* Un cliente para administrar la base de datos, como MySQL Workbench.

Para comprobar que Python está instalado, ejecutá:

**python --version**

## Instalación

Ubicate en la carpeta del backend:

**cd backend**

Creá un entorno virtual:

**python -m venv env**

Activá el entorno virtual.

Windows (CMD):

**env\Scripts\activate**

Windows (PowerShell):

**.\env\Scripts\Activate.ps1**

Linux:

**source env/bin/activate**

## Instalá las dependencias del proyecto.

Ejecutá:

**pip install -r requirements.txt**

## Configuración de la base de datos

### El backend utiliza MySQL como motor de base de datos.

* Iniciá el servicio de MySQL.

* Creá la base de datos bomberos_malagueno y sus tablas ejecutando el DDL del proyecto.

* Ejecutá el DML correspondiente para cargar los datos base.

* Configurá en Django los parámetros de conexión a MySQL en el archivo .env: motor, nombre de la base de datos, usuario, contraseña, host y puerto.

* La configuración de conexión se encuentra en config/settings.py. Se importa con el modulo decouple y su metodo config()

**Importante:** no subas contraseñas ni otras credenciales al repositorio. Utilizá una configuración local para el entorno de desarrollo.

## Migraciones

* Django utiliza migraciones para administrar los cambios en el esquema de la base de datos.

Para aplicar migraciones, utilizá:

**python manage.py makemigrations**
**python manage.py migrate**

Si las tablas ya existen porque se crearon previamente mediante el DDL, verificá el estado de las migraciones antes de ejecutarlas. En ese caso, puede ser necesario utilizar migrate --fake-initial, siempre que las tablas existentes coincidan con las migraciones iniciales.

## Ejecución en desarrollo

Con el entorno virtual activado, ejecutá:

**python manage.py runserver**

El servidor estará disponible en:

http://localhost:8000/

La API se encuentra disponible mediante las rutas definidas en el proyecto.

## Verificación

Para comprobar que Django reconoce la configuración del proyecto:

**python manage.py check**

Para consultar las rutas disponibles, revisá los archivos urls.py del proyecto y de sus aplicaciones.

## Consideraciones

* El entorno virtual env/ no debe subirse al repositorio.

* La base de datos local y las credenciales deben mantenerse fuera del control de versiones cuando corresponda.

* El frontend y el backend se ejecutan por separado durante el desarrollo.
