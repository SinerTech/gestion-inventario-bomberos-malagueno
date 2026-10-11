import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
    selector: 'app-paginador',
    templateUrl: './paginador.html',
})
export class Paginador {
    @Input() paginaActual = 1;
    @Input() totalElementos = 0;
    @Input() elementosPorPagina = 10;
    @Output() paginaCambiada = new EventEmitter<number>();

    get totalPaginas(): number {
        return Math.max(1, Math.ceil(this.totalElementos / this.elementosPorPagina));
    }

    get desde(): number {
        return this.totalElementos === 0 ? 0 : (this.paginaActual - 1) * this.elementosPorPagina + 1;
    }

    get hasta(): number {
        return Math.min(this.paginaActual * this.elementosPorPagina, this.totalElementos);
    }

    // Muestra como máximo 5 números alrededor de la página actual
    get paginas(): number[] {
        const inicio = Math.max(1, Math.min(this.paginaActual - 2, this.totalPaginas - 4));
        const fin = Math.min(this.totalPaginas, inicio + 4);
        return Array.from({ length: fin - inicio + 1 }, (_, i) => inicio + i);
    }

    ir(pagina: number): void {
        if (pagina < 1 || pagina > this.totalPaginas || pagina === this.paginaActual) return;
        this.paginaCambiada.emit(pagina);
    }
}
