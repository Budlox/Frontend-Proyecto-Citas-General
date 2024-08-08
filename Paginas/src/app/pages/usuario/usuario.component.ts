import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Usuario } from '../../model/usuario';
import { JsonPipe, CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-usuario',
  standalone: true,
  imports: [JsonPipe, FormsModule, CommonModule],
  templateUrl: './usuario.component.html',
  styleUrls: ['./usuario.component.css'],
})
export class UsuarioComponent {
  public Titulo = 'Administración de Usuarios';
  public Titulo2 = 'Lista de Usuarios';
  public Usuarios: Usuario[] = [];
  public UsuarioSeleccionado: Usuario | null = null;
  public UsuarioTemporal: Partial<Usuario> | null = null; // Temporary storage for user info

  public nombreUsuario: string = '';
  public email: string = '';
  public contrasenna: string = '';
  public IdUsuario: number | null = null;
  public rolSeleccionado: string = 'Nivel0'; // Default role value

  public roles: string[] = ['Nivel0', 'Nivel1', 'Nivel2']; // Define roles

  public itemPorPagina: number = 6;
  public PaginaActual: number = 1;

  constructor(private http: HttpClient, private router: Router) {
    this.verificarTokenYcargarDatos();
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

  private verificarTokenYcargarDatos() {
    this.verificarToken().then((isValid) => {
      if (isValid) {
        this.metodoGETUsuario();
      } else {
        this.router.navigate(['/login']);
      }
    });
  }

  public metodoGETUsuario(): void {
    this.verificarToken().then((isValid) => {
      if (isValid) {
        const headers = this.getAuthHeaders();
        this.http
          .get<{ Token: string; Usuarios: Usuario[] }>(
            'http://localhost/usuario',
            { headers }
          )
          .subscribe({
            next: (response) => {
              // Actualizar la lista de usuarios con los datos recibidos
              this.Usuarios = response.Usuarios;
              this.actualizarToken(response.Token); // Actualizar el token en localStorage
            },
            error: (error) => {
              console.error('Error al obtener usuarios:', error);
              this.router.navigate(['/login']); // Redirigir al login si ocurre un error
            },
          });
      } else {
        console.error('Token inválido al obtener usuarios');
        this.router.navigate(['/login']); // Redirigir al login si el token es inválido
      }
    });
  }

  public agregarUsuario(): void {
    this.verificarToken().then((isValid) => {
      if (isValid) {
        const cuerpo: Partial<Usuario> = {
          NombreUsuario: this.nombreUsuario,
          Email: this.email,
          Rol: this.rolSeleccionado,
          FechaRegistro: new Date(),
        };

        if (this.contrasenna) {
          cuerpo.Contrasenna = this.contrasenna;
        }

        const headers = this.getAuthHeaders();

        if (this.IdUsuario) {
          // Update existing user
          this.http
            .put<Usuario>(
              `http://localhost/usuario/${this.IdUsuario}`,
              cuerpo,
              { headers }
            )
            .subscribe({
              next: (usuarioActualizado) => {
                this.Usuarios = this.Usuarios.map((usuario) =>
                  usuario.IdUsuario === this.IdUsuario
                    ? { ...usuario, ...cuerpo }
                    : usuario
                );
                this.LimpiarForm();
                this.actualizarToken(usuarioActualizado.Token);
              },
              error: (error) => {
                console.error('Error updating user:', error);
                this.router.navigate(['/login']);
              },
            });
        } else {
          // Create new user
          this.http
            .post<{ Usuario: Usuario; Token: string }>(
              'http://localhost/usuario',
              cuerpo,
              { headers }
            )
            .subscribe({
              next: (response) => {
                this.Usuarios = [...this.Usuarios, response.Usuario];
                this.LimpiarForm();
                this.actualizarToken(response.Token);
              },
              error: (error) => {
                console.error('Error adding user:', error);
                this.router.navigate(['/login']);
              },
            });
        }
      } else {
        this.router.navigate(['/login']);
      }
    });
  }

  public borrarUsuario(Id: number): void {
    this.verificarToken().then((isValid) => {
      if (isValid) {
        const headers = this.getAuthHeaders();
        this.http
          .delete<{ Token: string }>(`http://localhost/usuario/${Id}`, {
            headers,
          })
          .subscribe({
            next: (response) => {
              this.Usuarios = this.Usuarios.filter(
                (usuario) => usuario.IdUsuario !== Id
              );
              this.actualizarToken(response.Token);
            },
            error: (error) => {
              console.error('Error deleting user:', error);
              this.router.navigate(['/login']);
            },
          });
      } else {
        this.router.navigate(['/login']);
      }
    });
  }

  private actualizarToken(token: string): void {
    localStorage.setItem('token', token);
  }

  public modificarUsuario(usuario: Usuario): void {
    this.verificarToken().then((isValid) => {
      if (isValid) {
        this.nombreUsuario = usuario.NombreUsuario;
        this.email = usuario.Email;
        this.contrasenna = ''; // Clear the password field
        this.IdUsuario = usuario.IdUsuario ?? null;
        this.rolSeleccionado = usuario.Rol ?? 'Nivel0'; // Set the selected role
        this.UsuarioTemporal = { ...usuario }; // Store the original user information temporarily
      } else {
        this.router.navigate(['/login']);
      }
    });
  }

  public selectUsuario(usuario: Usuario): void {
    this.UsuarioSeleccionado = usuario;
  }

  public isSelected(usuario: Usuario): boolean {
    return this.UsuarioSeleccionado === usuario;
  }

  public trackById(index: number, usuario: Usuario): number {
    return usuario.IdUsuario!;
  }

  public UsuariosPorPagina(): Usuario[] {
    const start = (this.PaginaActual - 1) * this.itemPorPagina;
    const end = Math.min(start + this.itemPorPagina, this.Usuarios.length);
    return this.Usuarios.slice(start, end);
  }

  public get TotalPaginas(): number {
    return Math.ceil(this.Usuarios.length / this.itemPorPagina);
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
    this.nombreUsuario = '';
    this.email = '';
    this.contrasenna = '';
    this.IdUsuario = null;
    this.rolSeleccionado = 'Nivel0'; // Reset to default role
    this.UsuarioTemporal = null; // Clear the temporary storage
  }
}
