export interface UsuarioEditado {
    nombreUsuario: string;
    emailUsuario: string;
    idRol: number;
    idArea: number;
    activo: boolean;
    password?: string; 
}