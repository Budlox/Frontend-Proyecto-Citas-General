import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ServicioEspecifico } from '../../model/serviciosespecifico';
import { ServicioGeneral } from '../../model/serviciosgeneral';
import { JsonPipe, CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

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

  constructor(private http: HttpClient) {
    this.metodoGETServicioGeneral();
    this.metodoGETServicioEspecifico();
  }

  public metodoGETServicioGeneral() {
    this.http.get<ServicioGeneral[]>('http://localhost/serviciogeneral')
      .subscribe((Servicios) => {
        this.ServiciosGeneral.set(Servicios);
      });
  }

  public metodoGETServicioEspecifico() {
    this.http.get<ServicioEspecifico[]>('http://localhost/servicioespecifico')
      .subscribe((Servicios) => {
        this.ServiciosEspecifico.set(Servicios);
        // Reset EspecificosFiltrados to empty initially
        this.EspecificosFiltrados = [];
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
    if (this.ServicioGeneralFiltroSeleccionado) {
      this.EspecificosFiltrados = this.ServiciosEspecifico().filter(
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
    if (this.ServicioGeneralSeleccionado && this.NombreServicioEspecifico && this.CostoServicioEspecifico) {
      const servicioEspecifico: ServicioEspecifico = {
        IdServicioEspecifico: this.IdServicioEspecifico ?? 0, // Use the existing ID or 0 for new entries
        NombreServicioEspecifico: this.NombreServicioEspecifico,
        CostoServicioEspecifico: this.CostoServicioEspecifico,
        IdServicio: this.ServicioGeneralSeleccionado,
      };

      if (this.IdServicioEspecifico) {
        // Update existing service
        this.http.put<ServicioEspecifico>(`http://localhost/servicioespecifico/${this.IdServicioEspecifico}`, servicioEspecifico)
          .subscribe((response) => {
            console.log('Servicio específico actualizado', response);
            this.metodoGETServicioEspecifico(); // Refresh the list
            this.resetForm();
          }, (error) => {
            console.error('Error al actualizar servicio específico', error);
          });
      } else {
        // Create new service
        this.http.post<ServicioEspecifico>('http://localhost/servicioespecifico', servicioEspecifico)
          .subscribe((response) => {
            console.log('Servicio específico agregado', response);
            this.metodoGETServicioEspecifico(); // Refresh the list
            this.resetForm();
          }, (error) => {
            console.error('Error al agregar servicio específico', error);
          });
      }
    } else {
      alert('Por favor complete todos los campos');
    }
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
    this.NombreServicioEspecifico = servicio.NombreServicioEspecifico;
    this.CostoServicioEspecifico = servicio.CostoServicioEspecifico;
    this.IdServicioEspecifico = servicio.IdServicioEspecifico ?? null;
    this.ServicioGeneralSeleccionado = servicio.IdServicio;

    // Optionally, you can set the selected ServicioGeneral in the filter combobox
    this.ServicioGeneralFiltroSeleccionado = servicio.IdServicio;
  }

  public borrarServicioEspecifico(IdServicioEspecifico: any): void {
    this.http.delete(`http://localhost/servicioespecifico/${IdServicioEspecifico}`)
      .subscribe(() => {
        this.metodoGETServicioEspecifico(); // Refresh the list after deletion
      });
  }

  public trackById(index: number, servicio: ServicioEspecifico): number {
    return servicio.IdServicioEspecifico!;
  }
}
