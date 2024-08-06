import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Solicitante } from '../../model/solicitante'; // Import Solicitante model
import { Cita } from '../../model/cita';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common'; // Ensure CommonModule is imported
import { ServicioEspecifico } from '../../model/serviciosespecifico';
import { ServicioGeneral } from '../../model/serviciosgeneral';

@Component({
  selector: 'app-cita',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './cita.component.html',
  styleUrls: ['./cita.component.css']
})
export class CitaComponent {
  public Solicitantes = signal<{ Token: string; Solicitantes: Solicitante[] }>({ Token: '', Solicitantes: [] });
  public SolicitantesFiltrados: Solicitante[] = [];
  public ServiciosGeneral = signal<ServicioGeneral[]>([]);
  public ServiciosEspecifico = signal<ServicioEspecifico[]>([]);
  public EspecificosFiltrados: ServicioEspecifico[] = [];
  public ServicioGeneralSeleccionado: number | null = null;
  public ServicioGeneralFiltroSeleccionado: number | null = null;

  public selectedSolicitante: Solicitante | null = null;
  public selectedServicio: ServicioEspecifico | null = null;
  public selectedDate: string = ''; // New property for selected date
  public selectedCita: Cita | null = null;

  public Apellido_Cliente: string = "";
  public Correo_Cliente: string = "";
  public FechaCita: Date | null = null;
  public IdCita: number | null = null;
  public IdServicioEspecifico: number | null = null;
  public IdSolicitante: number | null = null;
  public  Nombre_Cliente: string = "";
  public minDate: string;



  public busquedaNombre: string = ''; // New property for search input
  public busquedaNombreServicio: string = '';

  constructor(private http: HttpClient, private router: Router) {
    const today = new Date();
    this.minDate = today.toISOString().split('T')[0];
    this.verificarTokenYcargarDatos();
  }

  private verificarTokenYcargarDatos() {
    this.verificarToken().then(isValid => {
      if (isValid) {
        this.metodoGETSolicitantes();
        this.metodoGETServicioGeneral();
        this.metodoGETServicioEspecifico();
      } else {
        this.router.navigate(['/login']);
      }
    });
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
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
  public onSearchChangeServicio(): void {
    // Call filterEspecificos when the search input changes
    this.filterEspecificos();
  }

  private filterEspecificos(): void {
    const serviciosEspecificos = this.ServiciosEspecifico(); // Obtener el valor actual del signal
    if (this.ServicioGeneralFiltroSeleccionado) {
      this.EspecificosFiltrados = serviciosEspecificos.filter(
        s => s.IdServicio === this.ServicioGeneralFiltroSeleccionado &&
             (this.busquedaNombreServicio ? s.NombreServicioEspecifico.toLowerCase().includes(this.busquedaNombreServicio.toLowerCase()) : true)
      );
    } else {
      this.EspecificosFiltrados = [];
    }
  }

  public metodoGETSolicitantes() {
    const headers = this.getAuthHeaders();
    this.http.get<{ Token: string; Solicitantes: Solicitante[] }>('http://localhost/solicitante', { headers })
      .subscribe({
        next: (response) => {
          this.Solicitantes.set(response);
          this.SolicitantesFiltrados = response.Solicitantes; // Initialize with full list
        },
        error: (error) => {
          console.error('Error al obtener solicitantes:', error);
        }
      });
  }

  public onSearchChange(): void {
    const solicitantesArray = this.Solicitantes().Solicitantes;
    if (Array.isArray(solicitantesArray)) {
      this.SolicitantesFiltrados = solicitantesArray.filter(
        s => (s.Nombre_Solicitante?.toLowerCase().includes(this.busquedaNombre.toLowerCase()) ||
              s.Apellido_Solicitante?.toLowerCase().includes(this.busquedaNombre.toLowerCase()))
      );
    } else {
      console.error('Solicitantes is not an array:', solicitantesArray);
    }
  }

  public onSelectServicio(servicio: ServicioEspecifico): void {
    this.selectedServicio = servicio;
  }

  public onSelectSolicitante(solicitante: Solicitante): void {
    this.selectedSolicitante = solicitante;
  }

  public onDateChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedDate = input.value;
  }

  public guardarCita(): void {
    this.verificarToken().then(isValid => {
      if (isValid) {
        // Prepare the request body based on selected data
        const cuerpo: Partial<Cita> = {
          FechaCita: new Date(this.selectedDate), // Convert date string to Date object
          IdSolicitante: this.selectedSolicitante?.IdSolicitante ?? 0,
          Nombre_Cliente: this.selectedSolicitante?.Nombre_Solicitante ?? '',
          Apellido_Cliente: this.selectedSolicitante?.Apellido_Solicitante ?? '',
          Correo_Cliente: this.selectedSolicitante?.Email ?? '',
          IdServicioEspecifico: this.selectedServicio?.IdServicioEspecifico ?? 0,
          // IdCita is not included as it should be managed by the server
        };
  
        const headers = this.getAuthHeaders();
  
        if (this.selectedCita?.IdCita) {
          // Update only the fields that have changed
          const citaTemporal = this.selectedCita;
  
          // Check for changes and prepare the update payload
          for (const key in cuerpo) {
            if (cuerpo[key as keyof Cita] === citaTemporal[key as keyof Cita]) {
              delete cuerpo[key as keyof Cita];
            }
          }
  
          this.http.put<{ Token: string }>(`http://localhost/cita/${this.selectedCita.IdCita}`, cuerpo, { headers })
            .subscribe({
              next: (response) => {
                this.LimpiarForm(); // Clear the form after a successful update
                this.actualizarToken(response.Token);
              },
              error: (error) => {
                console.error('Error updating appointment:', error);
              }
            });
        } else {
          // Create new appointment
          this.http.post<{ Cita: Cita, Token: string }>('http://localhost/cita', cuerpo, { headers })
            .subscribe({
              next: (response) => {
                this.LimpiarForm(); // Clear the form after a successful creation
                this.actualizarToken(response.Token);
              },
              error: (error) => {
                console.error('Error adding appointment:', error);
              }
            });
        }
      } else {
        console.error('Token inválido al agregar/actualizar cita');
      }
    });
  }
  
  
  private LimpiarForm(): void {
    // Clear form fields and reset selection
    this.ServicioGeneralSeleccionado = null;
    this.ServicioGeneralFiltroSeleccionado = null;
    this.selectedSolicitante = null;
    this.selectedServicio = null;
    this.selectedDate = ''; // Clear date input
    this.Apellido_Cliente = '';
    this.Correo_Cliente = '';
    this.FechaCita = null;
    this.IdCita = null;
    this.IdServicioEspecifico = null;
    this.IdSolicitante = null;
    this.Nombre_Cliente = '';
  
    // Reset search fields
    this.busquedaNombre = '';
    this.busquedaNombreServicio = '';
  
    // Clear filtered lists 
    this.EspecificosFiltrados = [];
    this.metodoGETSolicitantes();
  }
  
  
  
  private actualizarToken(token: string): void {
    // Update the token in localStorage and any relevant state
    localStorage.setItem('token', token);
  }
  

  public trackById(index: number, servicio: ServicioEspecifico): number {
    return servicio.IdServicioEspecifico!;
}

}
