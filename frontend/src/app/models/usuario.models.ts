export interface Usuario {
    idUsuario: number;
    nombreUsuario: string;
    idRol: number;
    idArea: number;
    emailUsuario: string;
    activo: boolean;
    
    rol: {
    id_rol: number;
    nombre_rol: string;
    };
    area: {
        id_area: number;
        nombre_area: string;
    };
}
