export interface NuevoIngreso {
    idRecurso: number;
    cantidad: number;
    idProveedor: number;
    idMotivo: number;
    numeroLoteFactura: string;
    idUsuarioRegistra: number;
    medida: string | null;
    marca: string | null;
    valor: number | null;
    fondo: string;
    estado: string;
    observaciones: string | null;
}

export interface ResultadoIngreso {
    mensaje: string;
    codigos: string[];
}