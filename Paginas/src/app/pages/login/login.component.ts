// src/app/pages/login/login.component.ts
import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  email: string = '';
  password: string = '';

  constructor(private http: HttpClient, private router: Router) {}

  onLogin() {
    const loginData = {
      Email: this.email,
      Contrasenna: this.password
    };

    this.http.post<{ token: string }>('http://localhost/usuario/autenticar', loginData)
      .subscribe(
        (response) => {
          localStorage.setItem('token', response.token);
          this.router.navigate(['/']);
        },
        (error) => {
          console.error('Error during login:', error);
          alert('Error al iniciar sesión. Por favor, verifica tus credenciales.');
        }
      );
  }
}

