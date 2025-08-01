import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { HomeComponent } from './home/home.component';
import { RequestResetPasswordComponent } from './auth/reset-password/request-reset-password/request-reset-password.component';
import { ResetPasswordComponent } from './auth/reset-password/reset-password/reset-password.component';

import { AuthGuard } from './core/auth.guard';
import { UnauthorizedComponent } from './shared/unauthorized/unauthorized.component';
import { NotFoundComponent } from './shared/notfound/notfound.component';
export const routes: Routes = [

    // Authentification ////////////////
    { path: 'register', component: RegisterComponent },
    { path: 'request-reset-password', component: RequestResetPasswordComponent },
    { path: 'login',component:LoginComponent},
    { path: 'reset-password',component:ResetPasswordComponent},
    ///////////////////// Unauthorized //////////////////
    {path:'unauthorized',component:UnauthorizedComponent},
    ////////////// Landing Page ///////////////
    { path: '',component:HomeComponent},
    ////////////////////Not Found ///////////////////////
    {path:'**',component:NotFoundComponent}
    
    
];
