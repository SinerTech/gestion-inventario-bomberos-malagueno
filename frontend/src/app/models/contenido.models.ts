export interface Valor {
    icono: string;
    titulo: string;
    descripcion: string;
}

export interface Integrante {
    id: string;
    nombre: string;
    rol: string;
    imagen: string;
    alt: string;
    bio: string;
}

export interface LandingContenido {
    descripcion: string;
    valores: Valor[];
}

export interface QuienesSomosContenido {
    descripcion: string;
    pilares: Valor[];
    equipo: Integrante[];
}

export interface DashboardContenido {
    rol: string;
    descripcion: string;
    accionesDisponibles: string[];
    informacionSistema: { icono: string; etiqueta: string; valor: string }[];
    accesosDirectos: { icono: string; etiqueta: string; descripcion: string; link: string }[];
    botonesFiltro: string[];
    encabezadosTabla: string[];
    accionesTabla: { icono: string }[];
}

export interface Contenido {
    landing: LandingContenido;
    quienesSomos: QuienesSomosContenido;
    dashboards: Record<string, DashboardContenido>;
}
