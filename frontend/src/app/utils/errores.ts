export function extraerMensajes(valor: unknown): string[] {
    if (typeof valor === 'string') return [valor];
    if (Array.isArray(valor)) return valor.flatMap((v) => extraerMensajes(v));
    if (valor && typeof valor === 'object') {
        return Object.values(valor).flatMap((v) => extraerMensajes(v));
    }
    return [];
}