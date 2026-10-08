export interface OpcionSelect {
    valor: string;
    etiqueta: string;
}

export const FONDOS: OpcionSelect[] = [
    { valor: 'Propio', etiqueta: 'Propio' },
    { valor: 'Donado', etiqueta: 'Donado' },
    { valor: 'Subsidio Nacional', etiqueta: 'Subsidio Nacional' },
    { valor: 'Subsidio Provincial', etiqueta: 'Subsidio Provincial' },
    { valor: 'Subsidio Especifico PPMF', etiqueta: 'Subsidio Específico PPMF' },
];

// Op = operativo, NoOp = no operativo
export const ESTADOS_RECURSO: OpcionSelect[] = [
    { valor: 'Op-Bueno', etiqueta: 'Operativo - Bueno' },
    { valor: 'Op-Regular', etiqueta: 'Operativo - Regular' },
    { valor: 'Op-Malo', etiqueta: 'Operativo - Malo' },
    { valor: 'NoOp-Bueno', etiqueta: 'No operativo - Bueno' },
    { valor: 'NoOp-Regular', etiqueta: 'No operativo - Regular' },
    { valor: 'NoOp-Malo', etiqueta: 'No operativo - Malo' },
];

export interface UnidadRecurso {
    idUnidadRecurso: number;
    codigoInterno: string;
    idRecurso: number;
    nombreRecurso: string;
    nombreCategoria: string;
    medida: string | null;
    marca: string | null;
    numeroSerieFabricante: string | null;
    fechaAlta: string;
    valor: number | null;
    fondo: string;
    idProveedor: number;
    razonSocial: string;
    estado: string;
    disponibilidad: string;
    idUsuarioAsignado: number | null;
    nombreUsuarioAsignado: string | null;
    observaciones: string | null;
}
