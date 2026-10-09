import { OpcionSelect } from './unidad-recurso.models';

export interface Alerta {
    idAlerta: number;
    idUnidadRecurso: number;
    codigoInterno: string;
    nombreRecurso: string;
    tipo: string;
    descripcion: string;
    estadoAlerta: string;
    fechaGenerada: string;
}

export interface NuevaNovedad {
    idUnidadRecurso: number;
    idUsuarioReporta: number;
    tipo: string;
    descripcion: string;
}

// Deben coincidir con TIPOS_NOVEDAD del backend (movimientos/constantes.py)
export const TIPOS_NOVEDAD: OpcionSelect[] = [
    { valor: 'Mantenimiento', etiqueta: 'Mantenimiento (requiere revisión o reparación)' },
    { valor: 'Reposición', etiqueta: 'Reposición (se perdió, se consumió o hay que reemplazarlo)' },
    { valor: 'Actualización', etiqueta: 'Actualización (cambió algún dato o condición)' },
    { valor: 'Retiro de recurso', etiqueta: 'Solicitar que se retire el recurso de mi nombre' },
];
