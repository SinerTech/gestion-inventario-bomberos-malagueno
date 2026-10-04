import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { ContenidoService } from '../../services/contenido/contenido-service';
import { Integrante, Valor } from '../../models/contenido.models';

@Component({
  imports: [],
  selector: 'app-quienes-somos',
  styleUrl: './quienes-somos.css',
  templateUrl: './quienes-somos.html',
})
export class QuienesSomos implements OnInit {
  private contenidoService = inject(ContenidoService);
  private cdr = inject(ChangeDetectorRef);

  descripcion = '';
  pilares: Valor[] = [];
  integrantes: Integrante[] = []; 

  ngOnInit(): void {
    this.contenidoService.obtenerQuienesSomos().subscribe({
      next: (data) => {
        this.descripcion = data.descripcion;
        this.pilares = data.pilares;
        this.integrantes = data.equipo;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al obtener el contenido de quiénes somos:', err);
      },
    });
  }
}
