import { TipoMaterial } from './tipo-material.models';

export interface Recurso {
    idRecurso: number;
    nombreRecurso: string;
    idCategoria: number;
    nombreCategoria: string;
    tiposMaterial: TipoMaterial[];
}