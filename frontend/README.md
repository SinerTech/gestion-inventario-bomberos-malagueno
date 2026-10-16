# Frontend — Bomberos de Malagueño

Aplicación web del sistema de gestión de inventario interno del Cuartel de Bomberos Voluntarios de Malagueño.

## Tecnologías

* Angular 22
* TypeScript
* Bootstrap
* Bootstrap Icons
* Angular Router
* HttpClient

## Requisitos previos

* Node.js y npm
* Angular CLI

Para comprobar que están instalados, ejecutá:

**node -v**
**npm -v**
**ng version**

## Instalación

Ubicate en la carpeta del frontend:

**cd frontend**

Instalá las dependencias del proyecto:

**npm install**

## Configuración del backend

El frontend consume la API REST desarrollada con Django. Antes de probar las funcionalidades que requieren acceso a datos, verificá que el backend esté iniciado y que la configuración de conexión de la API coincida con la dirección donde se ejecuta.

En el entorno de desarrollo, el frontend utiliza http://localhost:4200/ y el backend utiliza http://localhost:8000/, salvo que se haya configurado otra dirección.

## Ejecución en desarrollo

Desde la carpeta frontend, ejecutá:

**ng serve**

Abrí http://localhost:4200/ en el navegador.

La aplicación se recargará automáticamente cuando se detecten cambios en los archivos fuente.

También podés ejecutar:

**ng serve -o**

para abrir el navegador automáticamente.

## Compilación

Para compilar el proyecto:

**ng build**

Los archivos generados se almacenan en la carpeta dist/.
