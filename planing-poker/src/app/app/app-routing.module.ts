import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGoogleComponent } from './components/auth/auth-google.component';
import { AuthGuard } from './components/auth/auth.guard';
import { ForbiddenComponent } from './components/forbidden/forbidden.component';
import { NotFoundComponent } from './components/not-found/not-found.component';

const routes: Routes = [
  { path: '', canActivate: [AuthGuard], loadChildren: () => import('../room/room.module').then(m => m.RoomModule) },
  { path: 'forbidden', component: ForbiddenComponent },
  { path: 'not-found', component: NotFoundComponent },
  { path: 'google-auth', component: AuthGoogleComponent },
  { path: '**', redirectTo: 'not-found' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    // preloadingStrategy: PreloadAllModules,
  })],
  exports: [RouterModule],
})
export class AppRoutingModule {
}
