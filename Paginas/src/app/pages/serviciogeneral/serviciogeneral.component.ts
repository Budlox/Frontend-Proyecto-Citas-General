import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ServicioGeneral } from '../../model/serviciosgeneral';
import { JsonPipe, CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

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
  public Servicios = signal<ServicioGeneral[]>([]);
  public ServicioSeleccionado: ServicioGeneral | null = null;

  public NombreServicio: string = '';
  public IdServicio: number | null = null;

  public itemPorPagina: number = 6;
  public PaginaActual: number = 1;

  constructor(private http: HttpClient) {
    this.metodoGETServicioGeneral();
  }

  public metodoGETServicioGeneral() {
    this.http.get<ServicioGeneral[]>('http://localhost/serviciogeneral')
      .subscribe((Servicios) => {
        this.Servicios.set(Servicios);
      });
  }

  public agregarServicio(): void {
    let cuerpo: Partial<ServicioGeneral> = {
      NombreServicio: this.NombreServicio
    };

    if (this.IdServicio) {
      // Update only the fields that have changed
      if (this.Servicios().find(s => s.IdServicio === this.IdServicio)) {
        this.http.put<ServicioGeneral>(`http://localhost/serviciogeneral/${this.IdServicio}`, cuerpo)
          .subscribe(() => {
            this.Servicios.update((servicios) =>
              servicios.map((servicio) =>
                servicio.IdServicio === this.IdServicio ? { ...servicio, ...cuerpo } : servicio
              )
            );
            this.LimpiarForm();
          },
          (error) => console.error('Error updating service:', error)
        );
      }
    } else {
      this.http.post<ServicioGeneral>('http://localhost/serviciogeneral', cuerpo)
        .subscribe((nuevoServicio) => {
          this.Servicios.update((servicios) => [...servicios, nuevoServicio]);
          this.LimpiarForm();
        },
        (error) => console.error('Error adding service:', error)
      );
    }
  }

  public borrarServicio(IdServicio: any) {
    this.http.delete(`http://localhost/serviciogeneral/${IdServicio}`)
      .subscribe(() => {
        this.Servicios.update((Servicios) => Servicios.filter((Servicio) => Servicio.IdServicio !== IdServicio));
      });
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
    const end = Math.min(start + this.itemPorPagina, this.Servicios().length);
    return this.Servicios().slice(start, end);
  }

  public get TotalPaginas(): number {
    return Math.ceil(this.Servicios().length / this.itemPorPagina);
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
