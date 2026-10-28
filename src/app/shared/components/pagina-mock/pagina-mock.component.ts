import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-pagina-mock',
  imports: [AsyncPipe, RouterLink],
  templateUrl: './pagina-mock.component.html',
  styleUrl: './pagina-mock.component.css',
})
export class PaginaMockComponent {
  private route = inject(ActivatedRoute);

  title$ = this.route.data.pipe(map((data) => (data['title'] as string) ?? 'Página'));
}
