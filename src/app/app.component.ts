import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';

import { KianaWidgetComponent } from './shared/components/kiana-widget/kiana-widget.component';
import { rutaMuestraKiana } from './shared/utils/ruta-muestra-kiana';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, KianaWidgetComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title = 'cranhua-frontend';

  private readonly router = inject(Router);

  protected readonly mostrarKiana = signal(rutaMuestraKiana(this.router.url));

  constructor() {
    this.router.events
      .pipe(
        filter((evento): evento is NavigationEnd => evento instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe((evento) => {
        this.mostrarKiana.set(rutaMuestraKiana(evento.urlAfterRedirects));
      });
  }
}
