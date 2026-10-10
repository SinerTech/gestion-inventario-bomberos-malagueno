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
    imagen_fondo: string;
    imagenes: ImagenLanding[];
}

export interface QuienesSomosContenido {
    descripcion: string;
    pilares: Valor[];
    equipo: Integrante[];
}

export interface AccionTabla {
    id: string;
    icono: string;
    titulo: string;
}

export interface DashboardContenido {
    rol: string;
    descripcion: string;
    accionesDisponibles: string[];
    informacionSistema: { icono: string; etiqueta: string; valor: string }[];
    accesosDirectos: { icono: string; etiqueta: string; descripcion: string; link: string }[];
    botonesFiltro: string[];
    encabezadosTabla: string[];
    accionesTabla: AccionTabla[];
}

export interface Contenido {
    landing: LandingContenido;
    quienesSomos: QuienesSomosContenido;
    dashboards: Record<string, DashboardContenido>;
}

export interface ImagenLanding {
    url: string;
    titulo: string;
    descripcion: string;
}
