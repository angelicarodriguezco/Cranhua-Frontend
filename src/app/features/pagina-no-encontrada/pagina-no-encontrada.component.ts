import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { RUTA_DASHBOARD_POR_ROL } from '../../core/models/cuenta.model';
import { CuentaService } from '../../core/services/cuenta.service';
import { TemaService } from '../../core/services/tema.service';

@Component({
  selector: 'app-pagina-no-encontrada',
  imports: [RouterLink],
  templateUrl: './pagina-no-encontrada.component.html',
  styleUrl: './pagina-no-encontrada.component.css',
  host: { '[attr.data-theme]': 'tema()' },
})
export class PaginaNoEncontradaComponent {
  private readonly cuentas = inject(CuentaService);

  protected readonly tema = inject(TemaService).tema;
  protected readonly logo = computed(() =>
    this.tema() === 'claro' ? '/images/logo-cranhua-negro.png' : '/images/logo-cranhua.png',
  );

  protected readonly destino = computed(() => {
    const rol = this.cuentas.cuenta()?.roles[0];
    return rol
      ? { ruta: RUTA_DASHBOARD_POR_ROL[rol], texto: 'Volver al dashboard' }
      : { ruta: '/', texto: 'Volver al inicio' };
  });
}
