import { Routes } from '@angular/router';
import { RegisterComponent } from './user/register/register.component';
import { LoginComponent } from './user/login/login.component';
import { AuthGuard } from './Service/auth.guard';
import { GetAlluserComponent } from './user/get-alluser/get-alluser.component';
import { HomeComponent } from './home/home.component';
import { LoginGuard } from './Service/login.guard';
import { SignDocumentComponent } from './sign-document/sign-document.component';
import { EnvelopecreateComponent } from './envelopecreate/envelopecreate.component';
import { EnvelopeDetailsComponent } from './envelope-details/envelope-details.component';
import { LogoutComponent } from './user/logout/logout.component';
import { ResetPasswordComponent } from './user/reset-password/reset-password.component';
import { PrepareDocumentComponent } from './prepare/preparedoc.component';
import { SendersignDocComponent } from './sendersign-doc/sendersign-doc.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'logout', component: LogoutComponent },
{
  path: 'resetpassword',
  loadComponent: () =>
    import('./user/reset-password/reset-password.component').then(
      (m) => m.ResetPasswordComponent
    ),
},
  { path: 'home', component: HomeComponent, canActivate: [AuthGuard] },
  { path: 'create', component: EnvelopecreateComponent, canActivate: [AuthGuard] },
  { path: 'users', component: GetAlluserComponent, canActivate: [AuthGuard] },
  { path: 'register', component: RegisterComponent },
  {path:'password-reset', component: ResetPasswordComponent},
  { path: 'sign-document/:envelopeId/:recipientId', component: SignDocumentComponent },
  { path: 'signed-files', component: EnvelopeDetailsComponent, canActivate: [AuthGuard] },
 {
  path: 'completed-documents',
  loadComponent: () =>
    import('./envelope-details/envelope-details.component').then(m => m.EnvelopeDetailsComponent)
} ,
   { path: 'prepare/:id', component: PrepareDocumentComponent, canActivate: [AuthGuard] },
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'senderSign/:id', component: SendersignDocComponent, canActivate: [AuthGuard] }
];
