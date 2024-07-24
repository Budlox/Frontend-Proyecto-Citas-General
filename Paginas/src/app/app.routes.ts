import { Routes } from '@angular/router';
import { ServicioGeneralComponent } from './pages/serviciogeneral/serviciogeneral.component';
import { ServicioespecificoComponent } from './pages/servicioespecifico/servicioespecifico.component';
import { CitaComponent } from './pages/cita/cita.component';
import { SolicitanteComponent } from './pages/solicitante/solicitante.component';
import { UsuarioComponent } from './pages/usuario/usuario.component';
import { LoginComponent } from './pages/login/login.component';

export const routes: Routes = [
    {
        path: 'serviciogeneral',
        component: ServicioGeneralComponent
    },
    {
        path: 'servicioespecifico',
        component: ServicioespecificoComponent
    },
    {
        path: 'cita',
        component: CitaComponent
    },
    {
        path: 'solicitante',
        component: SolicitanteComponent
    },
    {
        path: 'usuario',
        component: UsuarioComponent
    },
    {
        path: 'login',
        component: LoginComponent
    }
];
