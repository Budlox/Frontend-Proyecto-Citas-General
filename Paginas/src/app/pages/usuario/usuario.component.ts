import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Usuario } from '../../model/usuario';
import { JsonPipe, CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-usuario',
  standalone: true,
  imports: [JsonPipe, FormsModule, CommonModule],
  templateUrl: './usuario.component.html',
  styleUrls: ['./usuario.component.css']
})
export class UsuarioComponent {
  public Titulo = 'Administración de Usuarios';
  public Titulo2 = 'Lista de Usuarios';
  public Usuarios = signal<Usuario[]>([]);
  public UsuarioSeleccionado: Usuario | null = null;
  public UsuarioTemporal: Partial<Usuario> | null = null; // Temporary storage for user info

  public nombreUsuario: string = '';
  public email: string = '';
  public contrasenna: string = '';
  public IdUsuario: number | null = null;

  public itemPorPagina: number = 6;
  public PaginaActual: number = 1;

  constructor(private http: HttpClient) {
    this.metodoGETUsuario();
  }

  public metodoGETUsuario() {
    this.http.get('http://localhost/usuario')
    .subscribe((Usuarios) => {
      const arr = Usuarios as Usuario[];
      arr.forEach((Usuario) => {
        Usuario.FechaRegistro = new Date(Usuario.FechaRegistro);
        this.agregarUsuarioALaSenial(Usuario.NombreUsuario, 
          Usuario.Email, Usuario.Contrasenna, Usuario.FechaRegistro, Usuario.IdUsuario);
      });
    });
  }

  public agregarUsuarioALaSenial(NombreUsuario: string, Email: string, Contrasenna: string, FechaRegistro: Date, IdUsuario?: number) {
    let nuevoUsuario = { IdUsuario: IdUsuario, NombreUsuario: NombreUsuario, Email: Email, Contrasenna: Contrasenna, FechaRegistro: FechaRegistro };
    this.Usuarios.update((Usuarios) => [...Usuarios, nuevoUsuario]);
  }

  public agregarUsuario(): void {
    let cuerpo: Partial<Usuario> = {
      NombreUsuario: this.nombreUsuario,
      Email: this.email,
      FechaRegistro: new Date()
    };

    // Only include password if it's not empty
    if (this.contrasenna) {
      cuerpo.Contrasenna = this.contrasenna;
    }

    if (this.IdUsuario) {
      // Update only the fields that have changed
      if (this.UsuarioTemporal) {
        for (const key in cuerpo) {
          if (cuerpo[key as keyof Usuario] === this.UsuarioTemporal[key as keyof Usuario]) {
            delete cuerpo[key as keyof Usuario];
          }
        }
      }

      this.http.put(`http://localhost/usuario/${this.IdUsuario}`, cuerpo).subscribe(
        () => {
          this.Usuarios.update((usuarios) =>
            usuarios.map((usuario) =>
              usuario.IdUsuario === this.IdUsuario ? { ...usuario, ...cuerpo } : usuario
            )
          );
          this.LimpiarForm();
        },
        (error) => console.error('Error updating user:', error)
      );
    } else {
      this.http.post<Usuario>('http://localhost/usuario', cuerpo).subscribe(
        (usuarioCreado) => {
          this.Usuarios.update((usuarios) => [...usuarios, usuarioCreado]);
          this.LimpiarForm();
        },
        (error) => console.error('Error adding user:', error)
      );
    }
  }

  public borrarUsuario(Id: any) {
    this.http.delete('http://localhost/usuario/' + Id).subscribe(() => {
      this.Usuarios.update((Usuarios) => Usuarios.filter((Usuario) => Usuario.IdUsuario !== Id));
    });
  }

  public modificarUsuario(usuario: Usuario): void {
    this.nombreUsuario = usuario.NombreUsuario;
    this.email = usuario.Email;
    this.contrasenna = ''; // Clear the password field
    this.IdUsuario = usuario.IdUsuario ?? null;
    this.UsuarioTemporal = { ...usuario }; // Store the original user information temporarily
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
    const end = Math.min(start + this.itemPorPagina, this.Usuarios().length);
    return this.Usuarios().slice(start, end);
  }

  public get TotalPaginas(): number {
    return Math.ceil(this.Usuarios().length / this.itemPorPagina);
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
    this.UsuarioTemporal = null; // Clear the temporary storage
  }
}


