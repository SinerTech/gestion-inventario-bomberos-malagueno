export interface ItemDevolucion {
    idUnidadRecurso: number;
    estadoAlDevolver: string;
}

export interface NuevaDevolucion {
    idUsuarioDevuelve: number;
    idUsuarioRegistra: number;
    observaciones: string | null;
    unidades: ItemDevolucion[];
}

export interface ResultadoDevolucion {
    mensaje: string;
    codigos: string[];
}
