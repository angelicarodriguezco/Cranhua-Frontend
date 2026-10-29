import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { USUARIOS, USUARIO_ACTUAL } from '../../core/mocks/finca.mock';
import { SesionService } from '../../core/services/sesion.service';

@Component({
  selector: 'app-iniciar-sesion',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './iniciar-sesion.component.html',
  styleUrl: './iniciar-sesion.component.css',
})
export class IniciarSesionComponent {
  private readonly sesion = inject(SesionService);
  private readonly router = inject(Router);

  protected readonly form = new FormGroup({
    correo: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    contrasena: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  protected campoInvalido(nombre: 'correo' | 'contrasena'): boolean {
    const control = this.form.controls[nombre];
    return control.invalid && control.touched;
  }

  protected enviar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const correo = this.form.controls.correo.value.trim().toLowerCase();
    const usuario = USUARIOS.find((u) => u.correo.toLowerCase() === correo) ?? USUARIO_ACTUAL;

    this.sesion.iniciarSesion(usuario);
    void this.router.navigateByUrl('/dashboard');
  }
}
