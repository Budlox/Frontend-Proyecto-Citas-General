import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Solicitante } from '../../model/solicitante';
import { JsonPipe, CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-solicitante',
  standalone: true,
  imports: [JsonPipe, FormsModule, CommonModule],
  templateUrl: './solicitante.component.html',
  styleUrls: ['./solicitante.component.css']
})
export class SolicitanteComponent {
  public Titulo = 'Administración de Solicitante';
  public Titulo2 = 'Lista de Solicitantes';
  public Solicitantes = signal<Solicitante[]>([]);
  public SolicitanteSeleccionado: Solicitante | null = null;
  public SolicitanteTemporal: Partial<Solicitante> | null = null; // Temporary storage for solicitante info

  public Nombre_Solicitante: string = '';
  public Email: string = '';
  public Contrasenna: string = '';
  public IdSolicitante: number | null = null;

  public itemPorPagina: number = 6;
  public PaginaActual: number = 1;

  constructor(private http: HttpClient) {
    this.metodoGETSolicitante();
  }

  public metodoGETSolicitante() {
    this.http.get<Solicitante[]>('http://localhost/Solicitante')
      .subscribe((solicitantes) => {
        this.Solicitantes.set(solicitantes);
      });
  }

  public agregarSolicitante(): void {
    let cuerpo: Partial<Solicitante> = {
      Nombre_Solicitante: this.Nombre_Solicitante,
      Email: this.Email,
    };

    // Only include password if it's not empty
    if (this.Contrasenna) {
      cuerpo.Contrasenna = this.Contrasenna;
    }

    if (this.IdSolicitante) {
      // Update only the fields that have changed
      if (this.SolicitanteTemporal) {
        for (const key in cuerpo) {
          if (cuerpo[key as keyof Solicitante] === this.SolicitanteTemporal[key as keyof Solicitante]) {
            delete cuerpo[key as keyof Solicitante];
          }
        }
      }

      this.http.put(`http://localhost/Solicitante/${this.IdSolicitante}`, cuerpo).subscribe(
        () => {
          this.Solicitantes.update((solicitantes) =>
            solicitantes.map((solicitante) =>
              solicitante.IdSolicitante === this.IdSolicitante ? { ...solicitante, ...cuerpo } : solicitante
            )
          );
          this.LimpiarForm();
        },
        (error) => console.error('Error updating solicitante:', error)
      );
    } else {
      this.http.post<Solicitante>('http://localhost/Solicitante', cuerpo).subscribe(
        (solicitanteCreado) => {
          this.Solicitantes.update((solicitantes) => [...solicitantes, solicitanteCreado]);
          this.LimpiarForm();
        },
        (error) => console.error('Error adding solicitante:', error)
      );
    }
  }

  public borrarSolicitante(IdSolicitante: number) {
    this.http.delete(`http://localhost/Solicitante/${IdSolicitante}`).subscribe(() => {
      this.Solicitantes.update((solicitantes) => solicitantes.filter((solicitante) => solicitante.IdSolicitante !== IdSolicitante));
    });
  }

  public modificarSolicitante(solicitante: Solicitante): void {
    this.Nombre_Solicitante = solicitante.Nombre_Solicitante;
    this.Email = solicitante.Email;
    this.Contrasenna = ''; // Clear the password field
    this.IdSolicitante = solicitante.IdSolicitante ?? null;
    this.SolicitanteTemporal = { ...solicitante }; // Store the original solicitante information temporarily
  }

  public selectSolicitante(solicitante: Solicitante): void {
    this.SolicitanteSeleccionado = solicitante;
  }

  public isSelected(solicitante: Solicitante): boolean {
    return this.SolicitanteSeleccionado === solicitante;
  }

  public trackById(index: number, solicitante: Solicitante): number {
    return solicitante.IdSolicitante!;
  }

  public SolicitantePorPagina(): Solicitante[] {
    const start = (this.PaginaActual - 1) * this.itemPorPagina;
    const end = Math.min(start + this.itemPorPagina, this.Solicitantes().length);
    return this.Solicitantes().slice(start, end);
  }

  public get TotalPaginas(): number {
    return Math.ceil(this.Solicitantes().length / this.itemPorPagina);
  }

  public PaginaAnterior(): void {
    if (this.PaginaActual > 1) {
      this.PaginaActual--;
    }
  }

  public PaginaSiguiente(): void {
    if (this.PaginaActual < this.TotalPaginas) {
      this.PaginaActual++;
    }
  }

  private LimpiarForm(): void {
    this.Nombre_Solicitante = '';
    this.Email = '';
    this.Contrasenna = '';
    this.IdSolicitante = null;
    this.SolicitanteTemporal = null; // Clear the temporary storage
  }
}
