import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Solicitante } from '../../model/solicitante';
import { Cita } from '../../model/cita';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ServicioEspecifico } from '../../model/serviciosespecifico';
import { ServicioGeneral } from '../../model/serviciosgeneral';

@Component({
  selector: 'app-cita',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './cita.component.html',
  styleUrls: ['./cita.component.css'],
})
export class CitaComponent {
  public Solicitantes = signal<{ Token: string; Solicitantes: Solicitante[] }>({
    Token: '',
    Solicitantes: [],
  });
  public Solicitantes2 = signal<{ Token: string; Solicitantes: Solicitante[] }>(
    { Token: '', Solicitantes: [] }
  );
  public SolicitantesFiltrados: Solicitante[] = [];
  public SolicitantesFiltrados2: Solicitante[] = [];
  public ServiciosGeneral = signal<ServicioGeneral[]>([]);
  public ServiciosEspecifico = signal<ServicioEspecifico[]>([]);
  public citas: Cita[] = [];
  public servicioEspecificos: ServicioEspecifico[] = [];
  public EspecificosFiltrados: ServicioEspecifico[] = [];
  public ServicioGeneralSeleccionado: number | null = null;
  public ServicioGeneralFiltroSeleccionado: number | null = null;

  public selectedSolicitante: Solicitante | null = null;
  public selectedSolicitante2: Solicitante | null = null;
  public selectedServicio: ServicioEspecifico | null = null;
  public selectedDate: string = '';
  public selectedCita: Cita | null = null;

  public Apellido_Cliente: string = '';
  public Correo_Cliente: string = '';
  public FechaCita: Date | null = null;
  public IdCita: number | null = null;
  public IdServicioEspecifico: number | null = null;
  public IdSolicitante: number | null = null;
  public Nombre_Cliente: string = '';
  public minDate: string;

  public busquedaNombre: string = '';
  public busquedaNombre2: string = '';
  public busquedaNombreServicio: string = '';
  public searchIdServicioEspecifico: number | null = null;

  // New properties for combobox and filter
  public filterOptions = ['Pasado', 'Presente', 'Futuro'];
  public filterComboBoxValue: string = 'Presente';
  public filteredItems: { id: number; name: string; details: string }[] = [];
  public busquedaNombreFiltro: string = '';

  constructor(private http: HttpClient, private router: Router) {
    const today = new Date();

    // Format to 'YYYY-MM-DD'
    this.minDate = today.toISOString().split('T')[0];

    this.verificarTokenYcargarDatos();
  }

  private verificarTokenYcargarDatos() {
    this.verificarToken().then((isValid) => {
      if (isValid) {
        this.metodoGETSolicitantes();
        this.metodoGETSolicitantes2();
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
      Authorization: `Bearer ${token}`,
    });
  }

  private verificarToken(): Promise<boolean> {
    const headers = this.getAuthHeaders();
    return this.http
      .post<boolean>('http://localhost/usuario/validartoken', {}, { headers })
      .toPromise()
      .then(() => true)
      .catch(() => false);
  }

  public metodoGETServicioGeneral() {
    const headers = this.getAuthHeaders();
    this.http
      .get<{ ServiciosGenerales: ServicioGeneral[] }>(
        'http://localhost/serviciogeneral',
        { headers }
      )
      .subscribe({
        next: (response) => {
          console.log('ServiciosGenerales recibidos:', response);
          this.ServiciosGeneral.set(response.ServiciosGenerales);
        },
        error: (error) => {
          console.error('Error al obtener servicios:', error);
        },
      });
  }

  public metodoGETServicioEspecifico() {
    const headers = this.getAuthHeaders();
    this.http
      .get<{ ServiciosEspecificos: ServicioEspecifico[] }>(
        'http://localhost/servicioespecifico',
        { headers }
      )
      .subscribe({
        next: (response) => {
          this.ServiciosEspecifico.set(response.ServiciosEspecificos);
          this.EspecificosFiltrados = [];
        },
        error: (error) => {
          console.error('Error al obtener servicios específicos:', error);
        },
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
    this.filterEspecificos();
  }

  private filterEspecificos(): void {
    const serviciosEspecificos = this.ServiciosEspecifico();
    if (this.ServicioGeneralFiltroSeleccionado) {
      this.EspecificosFiltrados = serviciosEspecificos.filter(
        (s) =>
          s.IdServicio === this.ServicioGeneralFiltroSeleccionado &&
          (this.busquedaNombreServicio
            ? s.NombreServicioEspecifico.toLowerCase().includes(
                this.busquedaNombreServicio.toLowerCase()
              )
            : true)
      );
    } else {
      this.EspecificosFiltrados = [];
    }
  }

  public metodoGETSolicitantes() {
    const headers = this.getAuthHeaders();
    this.http
      .get<{ Token: string; Solicitantes: Solicitante[] }>(
        'http://localhost/solicitante',
        { headers }
      )
      .subscribe({
        next: (response) => {
          this.Solicitantes.set(response);
          this.SolicitantesFiltrados = response.Solicitantes;
        },
        error: (error) => {
          console.error('Error al obtener solicitantes:', error);
        },
      });
  }

  public metodoGETSolicitantes2() {
    const headers = this.getAuthHeaders();
    this.http
      .get<{ Token: string; Solicitantes: Solicitante[] }>(
        'http://localhost/solicitante',
        { headers }
      )
      .subscribe({
        next: (response) => {
          this.Solicitantes2.set(response);
          this.SolicitantesFiltrados2 = response.Solicitantes;
        },
        error: (error) => {
          console.error('Error al obtener solicitantes:', error);
        },
      });
  }

  public getCitaPorIdSolicitante(idSolicitante: number): void {
    if (!idSolicitante) {
      console.error('No solicitante ID provided');
      return;
    }

    const headers = this.getAuthHeaders();

    this.http
      .get<{ Citas: Cita[] }>(
        `http://localhost/cita/solicitante/${idSolicitante}`,
        { headers }
      )
      .subscribe({
        next: (response) => {
          this.citas = response.Citas.map((cita) => ({
            ...cita,
            FechaCita: new Date(cita.FechaCita), // Ensure FechaCita is a Date object
          }));
          this.applyFilter(); // Apply filter after fetching citas
        },
        error: (error) => {
          console.error('Error al obtener citas por solicitante:', error);
        },
      });
  }

  public getServicioPorIdServicio(IdServicioEspecifico: number | null): void {
    // Ensure IdServicioEspecifico is defined and valid
    if (IdServicioEspecifico === null || IdServicioEspecifico === undefined) {
      console.error('No IdServicioEspecifico provided');
      return;
    }

    const headers = this.getAuthHeaders();

    this.http
      .get<{ Token: string; ServiciosEspecificos: ServicioEspecifico[] }>(
        `http://localhost/servicioespecifico/${IdServicioEspecifico}`,
        { headers }
      )
      .subscribe({
        next: (response) => {
          console.log('API Response:', response);

          // Assign the entire array to servicioEspecificos
          this.servicioEspecificos = response.ServiciosEspecificos;

          // If you need only the first element, you can handle it here
          if (this.servicioEspecificos.length > 0) {
            const firstServicioEspecifico = this.servicioEspecificos[0];
            this.selectedServicio = this.servicioEspecificos[0];
            console.log('First Servicio Especifico:', firstServicioEspecifico);
            // Perform further actions with the first element if needed
          } else {
            console.warn('No servicios especificos found');
          }
        },
        error: (error) => {
          console.error('Error al obtener servicios específicos:', error);
        },
      });
  }

  public onSearchChange(): void {
    const solicitantesArray = this.Solicitantes().Solicitantes;
    if (Array.isArray(solicitantesArray)) {
      this.SolicitantesFiltrados = solicitantesArray.filter(
        (s) =>
          s.Nombre_Solicitante?.toLowerCase().includes(
            this.busquedaNombre.toLowerCase()
          ) ||
          s.Apellido_Solicitante?.toLowerCase().includes(
            this.busquedaNombre.toLowerCase()
          )
      );
    } else {
      console.error('Solicitantes is not an array:', solicitantesArray);
    }
  }

  public onSearchChange2(): void {
    const solicitantesArray = this.Solicitantes2().Solicitantes;
    if (Array.isArray(solicitantesArray)) {
      this.SolicitantesFiltrados2 = solicitantesArray.filter(
        (s) =>
          s.Nombre_Solicitante?.toLowerCase().includes(
            this.busquedaNombre2.toLowerCase()
          ) ||
          s.Apellido_Solicitante?.toLowerCase().includes(
            this.busquedaNombre2.toLowerCase()
          )
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

  public onSelectSolicitante2(solicitante: Solicitante): void {
    if (!solicitante || !solicitante.IdSolicitante) {
      console.error('Solicitante is invalid or missing ID');
      return;
    }

    this.selectedSolicitante2 = solicitante;
    this.getCitaPorIdSolicitante(solicitante.IdSolicitante);
  }

  public onDateChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedDate = input.value;
  }

  public guardarCita(): void {
    this.verificarToken().then((isValid) => {
      if (isValid) {
        const cuerpo: Partial<Cita> = {};

        // Use selectedDate directly
        if (this.selectedDate) {
          cuerpo.FechaCita = new Date(this.selectedDate);
        }

        // Update fields from selectedSolicitante if it exists
        if (this.selectedSolicitante) {
          cuerpo.IdSolicitante = this.selectedSolicitante.IdSolicitante;
          cuerpo.Nombre_Cliente = this.selectedSolicitante.Nombre_Solicitante;
          cuerpo.Apellido_Cliente =
            this.selectedSolicitante.Apellido_Solicitante;
          cuerpo.Correo_Cliente = this.selectedSolicitante.Email;
        }

        // Update fields from selectedServicio if it exists
        if (this.selectedServicio) {
          cuerpo.IdServicioEspecifico =
            this.selectedServicio.IdServicioEspecifico;
        }

        const headers = this.getAuthHeaders();

        if (this.selectedCita?.IdCita) {
          this.http
            .put<{ Token: string }>(
              `http://localhost/cita/${this.selectedCita.IdCita}`,
              cuerpo,
              { headers }
            )
            .subscribe({
              next: (response) => {
                this.LimpiarForm();
                this.actualizarToken(response.Token);
                console.log('Quote updated successfully');
              },
              error: (error) => {
                console.error('Error updating quote:', error);
              },
            });
        } else {
          this.http
            .post<{ Cita: Cita; Token: string }>(
              'http://localhost/cita',
              cuerpo,
              { headers }
            )
            .subscribe({
              next: (response) => {
                this.LimpiarForm();
                this.actualizarToken(response.Token);
                console.log('Quote added successfully');
              },
              error: (error) => {
                console.error('Error adding quote:', error);
              },
            });
        }
      } else {
        console.error('Invalid token while adding/updating quote');
      }
    });
  }

  private LimpiarForm(): void {
    this.ServicioGeneralSeleccionado = null;
    this.ServicioGeneralFiltroSeleccionado = null;
    this.selectedSolicitante = null;
    this.selectedServicio = null;
    this.selectedDate = '';
    this.Apellido_Cliente = '';
    this.Correo_Cliente = '';
    this.Nombre_Cliente = '';
    this.FechaCita = null;
    this.IdCita = null;
    this.IdServicioEspecifico = null;
    this.IdSolicitante = null;
    this.EspecificosFiltrados = [];
    this.busquedaNombre = '';
    this.refreshCitas();
  }

  private actualizarToken(token: string): void {
    localStorage.setItem('token', token);
  }

  public onSearchChangeFiltro(): void {
    // Logic to filter items based on busquedaNombreFiltro and filterComboBoxValue
    this.filteredItems = this.getFilteredItems();
  }

  private getFilteredItems(): { id: number; name: string; details: string }[] {
    // Replace with actual filtering logic based on busquedaNombreFiltro and filterComboBoxValue
    return [];
  }

  public onFilterComboBoxChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.filterComboBoxValue = target.value;
    this.applyFilter();
  }

  private applyFilter(): void {
    // Get current date in Costa Rican time zone
    const now = new Date();
    const costaRicanOffset = -6 * 60; // UTC-6 in minutes
    const localNow = new Date(now.getTime() + costaRicanOffset * 60000);

    // Set the start and end of the current day in Costa Rican time zone
    const startOfDay = new Date(
      localNow.toISOString().split('T')[0] + 'T00:00:00Z'
    );
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1); // End of the day

    console.log('Filter Criteria:', this.filterComboBoxValue);
    console.log('Current Date:', localNow);

    this.filteredItems = this.citas
      .filter((cita) => {
        const citaDate = new Date(cita.FechaCita);
        console.log('Cita Date:', citaDate);

        // Convert citaDate to Costa Rican time zone
        const localCitaDate = new Date(
          citaDate.getTime() + costaRicanOffset * 60000
        );

        // Check if the date conversion was successful
        if (isNaN(localCitaDate.getTime())) {
          console.error('Invalid date:', cita.FechaCita);
          return false;
        }

        switch (this.filterComboBoxValue) {
          case 'Pasado':
            return localCitaDate < startOfDay;
          case 'Presente':
            return localCitaDate >= startOfDay && localCitaDate <= endOfDay;
          case 'Futuro':
            return localCitaDate > endOfDay;
          default:
            return true;
        }
      })
      .map((cita) => ({
        id: cita.IdCita,
        name: `${cita.Nombre_Cliente} ${cita.Apellido_Cliente}`,
        details: `Date: ${new Date(
          cita.FechaCita
        ).toLocaleDateString()} - Service: ${cita.IdServicioEspecifico}`,
      }));

    console.log('Filtered Items:', this.filteredItems);
  }

  public trackById(index: number, servicio: ServicioEspecifico): number {
    return servicio.IdServicioEspecifico!;
  }

  // In your component class
  public onModify(id: number): void {
    // Find the appointment in the filtered appointments list
    const appointment = this.citas.find((app) => app.IdCita === id);

    if (appointment) {
      // Populate the data with the found appointment
      this.Nombre_Cliente = appointment.Nombre_Cliente;
      this.Apellido_Cliente = appointment.Apellido_Cliente;
      this.Correo_Cliente = appointment.Correo_Cliente;
      this.selectedDate = new Date(appointment.FechaCita)
        .toISOString()
        .split('T')[0]; // Format date for the input
      this.IdServicioEspecifico = appointment.IdServicioEspecifico;
      this.IdSolicitante = appointment.IdSolicitante;

      // Populate the search input with the client name
      this.busquedaNombre = appointment.Nombre_Cliente;

      // Find and set the selected applicant, defaulting to null if not found
      this.selectedSolicitante =
        this.SolicitantesFiltrados.find(
          (applicant) => applicant.IdSolicitante === appointment.IdSolicitante
        ) || null;
      const serviciosEspecificos = this.ServiciosEspecifico();
      // Find the specific service in FilterSpecifics
      const specificService = serviciosEspecificos.find(
        (service) =>
          service.IdServicioEspecifico === appointment.IdServicioEspecifico
      );

      if (specificService) {
        // Ensure IdServicioEspecifico is a number or null
        this.IdServicioEspecifico =
          specificService.IdServicioEspecifico ?? null;

        // Find and set the corresponding general service
        const generalService = this.ServiciosGeneral().find(
          (service) => service.IdServicio === specificService.IdServicio
        );

        if (generalService) {
          // Set the selected general service in the dropdown
          this.ServicioGeneralFiltroSeleccionado =
            specificService.IdServicio ?? null;
          this.filterEspecificos();
          this.getServicioPorIdServicio(this.IdServicioEspecifico as number);
        } else {
          console.error('General Service not found!');
        }
      } else {
        console.error('Specific Service not found!');
      }

      // Optionally, you might want to set the selectedAppointment to the current appointment
      this.selectedCita = appointment;

      // Further actions (like opening a modal or enabling edit mode) can be handled here
      // Example: this.openEditModal();
    } else {
      console.error('Appointment not found!');
    }
  }

  public onDeleteCita(idCita: number): void {
    const headers = this.getAuthHeaders();
    this.http.delete(`http://localhost/cita/${idCita}`, { headers }).subscribe({
      next: () => {
        console.log('Cita deleted successfully');
        this.refreshCitas(); // Refresh citas list after deletion
      },
      error: (error) => {
        console.error('Error al eliminar cita:', error);
      },
    });
  }

  private refreshCitas(): void {
    // Fetch the updated list of citas
    if (this.selectedSolicitante2) {
      this.getCitaPorIdSolicitante(this.selectedSolicitante2.IdSolicitante);
    } else {
      // Optionally handle the case where no solicitante is selected
      console.log('No solicitante selected');
    }
  }
}
