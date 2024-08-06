import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ServicioEspecifico } from '../../model/serviciosespecifico';
import { ServicioGeneral } from '../../model/serviciosgeneral';
import { JsonPipe, CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-servicioespecifico',
  standalone: true,
  imports: [JsonPipe, FormsModule, CommonModule],
  templateUrl: './servicioespecifico.component.html',
  styleUrls: ['./servicioespecifico.component.css']
})
export class ServicioespecificoComponent {
  public Titulo = 'Administración de Servicios Específicos';
  public Titulo2 = 'Lista de Servicios Específicos';
  public ServiciosGeneral = signal<ServicioGeneral[]>([]);
  public ServiciosEspecifico = signal<ServicioEspecifico[]>([]);
  public EspecificosFiltrados: ServicioEspecifico[] = [];
  public ServicioGeneralSeleccionado: number | null = null;
  public ServicioGeneralFiltroSeleccionado: number | null = null;

  public NombreServicioEspecifico: string = '';
  public CostoServicioEspecifico: number | null = null;
  public IdServicioEspecifico: number | null = null;

  public busquedaNombre: string = ''; // New property for search input

  constructor(private http: HttpClient, private router: Router) {
    this.verificarTokenYcargarDatos();
  }

  private verificarTokenYcargarDatos() {
    this.verificarToken().then(isValid => {
      if (isValid) {
        this.metodoGETServicioGeneral();
        this.metodoGETServicioEspecifico();

      } else {
        this.router.navigate(['/login']);
      }
    });
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

  public metodoGETServicioGeneral() {
    const headers = this.getAuthHeaders();
    this.http.get<{ ServiciosGenerales: ServicioGeneral[] }>('http://localhost/serviciogeneral', { headers })
      .subscribe({
        next: (response) => {
          console.log('ServiciosGenerales recibidos:', response); // Verificar los datos recibidos
          this.ServiciosGeneral.set(response.ServiciosGenerales);
        },
        error: (error) => {
          console.error('Error al obtener servicios:', error);
        }
      });
  }

  //Ajustar los servicios especificos (la respuesta)
  public metodoGETServicioEspecifico() {
    const headers = this.getAuthHeaders();
    this.http.get<{ ServiciosEspecificos: ServicioEspecifico[] }>('http://localhost/servicioespecifico', { headers })
      .subscribe({
        next: (response) => {
          this.ServiciosEspecifico.set(response.ServiciosEspecificos);
          // Reset EspecificosFiltrados to empty initially
          this.EspecificosFiltrados = [];
        },
        error: (error) => {
          console.error('Error al obtener servicios específicos:', error);
        }
      });
  }


  public onSelectServicioGeneral(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.ServicioGeneralSeleccionado = +target.value;
  }

  public onSelectServicioGeneralFiltro(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.ServicioGeneralFiltroSeleccionado = +target.value;
    this.filterEspecificos();
  }

  private filterEspecificos(): void {
    const serviciosEspecificos = this.ServiciosEspecifico(); // Obtener el valor actual del signal
    if (this.ServicioGeneralFiltroSeleccionado) {
      this.EspecificosFiltrados = serviciosEspecificos.filter(
        s => s.IdServicio === this.ServicioGeneralFiltroSeleccionado &&
             (this.busquedaNombre ? s.NombreServicioEspecifico.toLowerCase().includes(this.busquedaNombre.toLowerCase()) : true)
      );
    } else {
      this.EspecificosFiltrados = [];
    }
  }
  

  public onSearchChange(): void {
    // Call filterEspecificos when the search input changes
    this.filterEspecificos();
  }

  public guardarServicioEspecifico(): void {
    this.verificarToken().then(isValid => {
        if (isValid) {
            if (this.ServicioGeneralSeleccionado && this.NombreServicioEspecifico && this.CostoServicioEspecifico) {
                const servicioEspecifico: ServicioEspecifico = {
                    IdServicioEspecifico: this.IdServicioEspecifico ?? 0, // Use the existing ID or 0 for new entries
                    NombreServicioEspecifico: this.NombreServicioEspecifico,
                    CostoServicioEspecifico: this.CostoServicioEspecifico,
                    IdServicio: this.ServicioGeneralSeleccionado,
                };

                const headers = this.getAuthHeaders();

                if (this.IdServicioEspecifico) {
                    // Update existing service
                    this.http.put<{ Token: string }>(`http://localhost/servicioespecifico/${this.IdServicioEspecifico}`, servicioEspecifico, { headers })
                        .subscribe({
                            next: (response) => {
                                console.log('Servicio específico actualizado', response);
                                this.metodoGETServicioEspecifico(); // Refresh the list
                                this.resetForm();
                                this.actualizarToken(response.Token);
                            },
                            error: (error) => {
                                console.error('Error al actualizar servicio específico', error);
                            }
                        });
                } else {
                    // Create new service
                    this.http.post<{ Token: string }>('http://localhost/servicioespecifico', servicioEspecifico, { headers })
                        .subscribe({
                            next: (response) => {
                                console.log('Servicio específico agregado', response);
                                this.metodoGETServicioEspecifico(); // Refresh the list
                                this.resetForm();
                                this.actualizarToken(response.Token);
                            },
                            error: (error) => {
                                console.error('Error al agregar servicio específico', error);
                            }
                        });
                }
            } else {
                alert('Por favor complete todos los campos');
            }
        } else {
            this.router.navigate(['/login']);
        }
    });
} 


  private resetForm(): void {
    this.NombreServicioEspecifico = '';
    this.CostoServicioEspecifico = null;
    this.IdServicioEspecifico = null;
    this.ServicioGeneralSeleccionado = null;
    this.ServicioGeneralFiltroSeleccionado = null;
    this.busquedaNombre = ''; // Clear search input
  }

  public modificarServicioEspecifico(servicio: ServicioEspecifico): void {
    this.verificarToken().then(isValid => {
        if (isValid) {
            this.NombreServicioEspecifico = servicio.NombreServicioEspecifico;
            this.CostoServicioEspecifico = servicio.CostoServicioEspecifico;
            this.IdServicioEspecifico = servicio.IdServicioEspecifico ?? null;
            this.ServicioGeneralSeleccionado = servicio.IdServicio;

            // Optionally, you can set the selected ServicioGeneral in the filter combobox
            this.ServicioGeneralFiltroSeleccionado = servicio.IdServicio;
        } else {
            this.router.navigate(['/login']);
        }
    });
}

  public borrarServicioEspecifico(IdServicioEspecifico: any): void {
    this.verificarToken().then(isValid => {
        if (isValid) {
            const headers = this.getAuthHeaders();
            this.http.delete<{ Token: string }>(`http://localhost/servicioespecifico/${IdServicioEspecifico}`, { headers })
                .subscribe({
                    next: (response) => {
                        this.metodoGETServicioEspecifico(); // Refresh the list after deletion
                        this.actualizarToken(response.Token);
                        this.resetForm();
                    },
                    error: (error) => {
                        console.error('Error al borrar servicio específico:', error);
                        this.router.navigate(['/login']);
                    }
                });
        } else {
            this.router.navigate(['/login']);
        }
    });
}

public trackById(index: number, servicio: ServicioEspecifico): number {
    return servicio.IdServicioEspecifico!;
}

private actualizarToken(token: string): void {
    localStorage.setItem('token', token);
}

}
