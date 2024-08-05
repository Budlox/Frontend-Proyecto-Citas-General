import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Solicitante } from '../../model/solicitante';
import { JsonPipe, CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';

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

  constructor(private http: HttpClient, private router: Router) {
    this.verificarTokenYcargarDatos();
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    console.log('Token:', token); // Verificar el token
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  private verificarToken(): Promise<boolean> {
    const headers = this.getAuthHeaders();
    return this.http.post<boolean>('http://localhost/usuario/validartoken', {}, { headers })
      .toPromise()
      .then(() => true)
      .catch(() => false);
  }

  private verificarTokenYcargarDatos() {
    this.verificarToken().then(isValid => {
      if (isValid) {
        this.metodoGETSolicitante();
      } else {
        this.router.navigate(['/login']);
      }
    });
  }

  public metodoGETSolicitante(): void {
    this.verificarToken().then(isValid => {
        if (isValid) {
            const headers = this.getAuthHeaders();
            this.http.get<{ Token: string; Solicitantes: Solicitante[] }>('http://localhost/Solicitante', { headers })
                .subscribe({
                    next: (response) => {
                        // Extract the Solicitantes array from the response
                        this.Solicitantes.set(response.Solicitantes);
                    },
                    error: (error) => {
                        console.error('Error al obtener solicitantes:', error);
                    }
                });
        } else {
            console.error('Token inválido al obtener solicitantes');
        }
    });
  }
  
  

public agregarSolicitante(): void {
  this.verificarToken().then(isValid => {
      if (isValid) {
          let cuerpo: Partial<Solicitante> = {
              Nombre_Solicitante: this.Nombre_Solicitante,
              Email: this.Email,
          };

          // Only include password if it's not empty
          if (this.Contrasenna) {
              cuerpo.Contrasenna = this.Contrasenna;
          }

          const headers = this.getAuthHeaders();

          if (this.IdSolicitante) {
              // Update only the fields that have changed
              if (this.SolicitanteTemporal) {
                  for (const key in cuerpo) {
                      if (cuerpo[key as keyof Solicitante] === this.SolicitanteTemporal[key as keyof Solicitante]) {
                          delete cuerpo[key as keyof Solicitante];
                      }
                  }
              }

              this.http.put<{ Token: string }>(`http://localhost/Solicitante/${this.IdSolicitante}`, cuerpo, { headers })
                  .subscribe({
                      next: (response) => {
                          this.Solicitantes.update((solicitantes) =>
                              solicitantes.map((solicitante) =>
                                  solicitante.IdSolicitante === this.IdSolicitante ? { ...solicitante, ...cuerpo } : solicitante
                              )
                          );
                          this.LimpiarForm();
                          this.actualizarToken(response.Token);
                      },
                      error: (error) => {
                          console.error('Error updating solicitante:', error);
                      }
                  });
          } else {
              this.http.post<{ Solicitante: Solicitante, Token: string }>('http://localhost/solicitante', cuerpo, { headers })
                  .subscribe({
                      next: (response) => {
                          this.Solicitantes.update((solicitantes) => [...solicitantes, response.Solicitante]);
                          this.LimpiarForm();
                          this.actualizarToken(response.Token);
                      },
                      error: (error) => {
                          console.error('Error adding solicitante:', error);
                      }
                  });
          }
      } else {
          console.error('Token inválido al agregar solicitante');
      }
  });
}

public borrarSolicitante(IdSolicitante: any): void {
  this.verificarToken().then(isValid => {
      if (isValid) {
          const headers = this.getAuthHeaders();
          this.http.delete<{ Token: string }>(`http://localhost/Solicitante/${IdSolicitante}`, { headers })
              .subscribe({
                  next: (response) => {
                      this.Solicitantes.update((solicitantes) => 
                          solicitantes.filter((solicitante) => solicitante.IdSolicitante !== IdSolicitante)
                      );
                      this.actualizarToken(response.Token);
                  },
                  error: (error) => {
                      console.error('Error al borrar solicitante:', error);
                  }
              });
      } else {
          console.error('Token inválido al borrar solicitante');
      }
  });
}

public modificarSolicitante(solicitante: Solicitante): void {
  this.verificarToken().then(isValid => {
      if (isValid) {
          this.Nombre_Solicitante = solicitante.Nombre_Solicitante;
          this.Email = solicitante.Email;
          this.Contrasenna = ''; // Clear the password field
          this.IdSolicitante = solicitante.IdSolicitante ?? null;
          this.SolicitanteTemporal = { ...solicitante }; // Store the original solicitante information temporarily
      } else {
          this.router.navigate(['/login']);
      }
  });
}

  public selectSolicitante(solicitante: Solicitante): void {
    this.SolicitanteSeleccionado = solicitante;
  }

  public isSelected(solicitante: Solicitante): boolean {
    return this.SolicitanteSeleccionado === solicitante;
  }

  public trackById(index: number, solicitante: Solicitante): number {
    return solicitante.IdSolicitante !== undefined ? solicitante.IdSolicitante : index;
  }

  public SolicitantePorPagina(): Solicitante[] {
    const solicitantesArray = this.Solicitantes();
    console.log('Solicitantes:', solicitantesArray); // Check if this is an array
    if (!Array.isArray(solicitantesArray)) {
      console.error('Solicitantes is not an array:', solicitantesArray);
      return [];
    }
    const start = (this.PaginaActual - 1) * this.itemPorPagina;
    const end = Math.min(start + this.itemPorPagina, solicitantesArray.length);
    return solicitantesArray.slice(start, end);
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

  private actualizarToken(token: string): void {
    localStorage.setItem('token', token);
  }
}
