import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ServicioGeneral } from '../../model/serviciosgeneral';
import { JsonPipe, CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-serviciogeneral',
  standalone: true,
  imports: [JsonPipe, FormsModule, CommonModule],
  templateUrl: './serviciogeneral.component.html',
  styleUrls: ['./serviciogeneral.component.css']
})
export class ServicioGeneralComponent {
  public Titulo = 'Administración de Servicios Generales';
  public Titulo2 = 'Lista de Servicios Generales';
  public Servicios: ServicioGeneral[] = [];
  public ServicioSeleccionado: ServicioGeneral | null = null;

  public NombreServicio: string = '';
  public IdServicio: number | null = null;

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
        this.metodoGETServicioGeneral();
      } else {
        this.router.navigate(['/login']);
      }
    });
  }

  public metodoGETServicioGeneral() {
    const headers = this.getAuthHeaders();
    this.http.get<{ ServiciosGenerales: ServicioGeneral[] }>('http://localhost/serviciogeneral', { headers })
      .subscribe({
        next: (response) => {
          console.log('ServiciosGenerales recibidos:', response); // Verificar los datos recibidos
          this.Servicios = response.ServiciosGenerales;
        },
        error: (error) => {
          console.error('Error al obtener servicios:', error);
        }
      });
  }

  public agregarServicio(): void {
    this.verificarToken().then(isValid => {
      if (isValid) {
        let cuerpo: Partial<ServicioGeneral> = {
          NombreServicio: this.NombreServicio
        };

        const headers = this.getAuthHeaders();

        if (this.IdServicio) {
          // Update only the fields that have changed
          if (this.Servicios.find(s => s.IdServicio === this.IdServicio)) {
            this.http.put<{ Token: string }>(`http://localhost/serviciogeneral/${this.IdServicio}`, cuerpo, { headers })
              .subscribe({
                next: (response) => {
                  this.Servicios = this.Servicios.map((servicio) =>
                    servicio.IdServicio === this.IdServicio ? { ...servicio, ...cuerpo } : servicio
                  );
                  this.LimpiarForm();
                  this.actualizarToken(response.Token);
                },
                error: (error) => {
                  console.error('Error updating service:', error);
                  this.router.navigate(['/login']);
                }
              });
          }
        } else {
          this.http.post<{ Servicio: ServicioGeneral, Token: string }>('http://localhost/serviciogeneral', cuerpo, { headers })
            .subscribe({
              next: (response) => {
                this.Servicios = [...this.Servicios, response.Servicio];
                this.LimpiarForm();
                this.actualizarToken(response.Token);
              },
              error: (error) => {
                console.error('Error adding service:', error);
                this.router.navigate(['/login']);
              }
            });
        }
      } else {
        this.router.navigate(['/login']);
      }
    });
  }

  public borrarServicio(IdServicio: any): void {
    this.verificarToken().then(isValid => {
      if (isValid) {
        const headers = this.getAuthHeaders();
        this.http.delete<{ Token: string }>(`http://localhost/serviciogeneral/${IdServicio}`, { headers })
          .subscribe({
            next: (response) => {
              this.Servicios = this.Servicios.filter((Servicio) => Servicio.IdServicio !== IdServicio);
              this.actualizarToken(response.Token);
            },
            error: (error) => {
              console.error('Error deleting service:', error);
              this.router.navigate(['/login']);
            }
          });
      } else {
        this.router.navigate(['/login']);
      }
    });
  }

  private actualizarToken(token: string): void {
    localStorage.setItem('token', token);
  }

  public modificarServicio(servicio: ServicioGeneral): void {
    this.NombreServicio = servicio.NombreServicio;
    this.IdServicio = servicio.IdServicio ?? null;
  }

  public selectServicio(servicio: ServicioGeneral): void {
    this.ServicioSeleccionado = servicio;
  }

  public isSelected(servicio: ServicioGeneral): boolean {
    return this.ServicioSeleccionado === servicio;
  }

  public trackById(index: number, servicio: ServicioGeneral): number {
    return servicio.IdServicio!;
  }

  public ServiciosPorPagina(): ServicioGeneral[] {
    const start = (this.PaginaActual - 1) * this.itemPorPagina;
    const end = Math.min(start + this.itemPorPagina, this.Servicios.length);
    return this.Servicios.slice(start, end);
  }

  public get TotalPaginas(): number {
    return Math.ceil(this.Servicios.length / this.itemPorPagina);
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
    this.NombreServicio = '';
    this.IdServicio = null;
  }
}
