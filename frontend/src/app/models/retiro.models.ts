export interface ItemRetiro {
    idUnidadRecurso: number;
    estadoAlRetirar: string;
}

export interface NuevoRetiro {
    idUsuarioRetira: number;
    idUsuarioRegistra: number;
    idMotivo: number | null;
    observaciones: string | null;
    unidades: ItemRetiro[];
}

export interface ResultadoRetiro {
    mensaje: string;
    codigos: string[];
}
