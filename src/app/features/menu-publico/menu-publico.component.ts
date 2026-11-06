import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';

import { TemaDashboard } from '../../core/models/dashboard-cafetalero.model';
import { MenuPublicoService } from '../../core/services/menu-publico.service';
import { TemaService } from '../../core/services/tema.service';
import { formatearColones } from '../../shared/utils/formato';

@Component({
  selector: 'app-menu-publico',
  imports: [RouterLink],
  templateUrl: './menu-publico.component.html',
  styleUrl: './menu-publico.component.css',
  host: { '[attr.data-theme]': 'tema()' },
})
export class MenuPublicoComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly menus = inject(MenuPublicoService);
  private readonly temas = inject(TemaService);

  protected readonly tema = this.temas.tema;
  protected readonly id = toSignal(this.route.paramMap.pipe(map((p) => p.get('id') ?? '')), {
    initialValue: this.route.snapshot.paramMap.get('id') ?? '',
  });

  protected readonly menu = computed(() => this.menus.obtener(this.id()));

  protected readonly logo = computed(() =>
    this.tema() === 'claro' ? '/images/logo-cranhua-negro.png' : '/images/logo-cranhua.png',
  );

  protected readonly precio = formatearColones;

  protected establecerTema(tema: TemaDashboard): void {
    this.temas.establecerTema(tema);
  }
}
