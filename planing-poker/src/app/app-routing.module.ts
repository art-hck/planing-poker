import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { NotFoundComponent } from "./components/not-found/not-found.component";
import { RoomsComponent } from "./components/rooms/rooms.component";
import { AuthGuard } from "./components/auth/auth.guard";

const routes: Routes = [
  { path: '', component: RoomsComponent, canActivate: [AuthGuard] },
  { path: 'not-found', component: NotFoundComponent },
  { path: ':id', loadChildren: () => import('./components/room.module').then(m => m.RoomModule), canActivate: [AuthGuard] },
  { path: '**', redirectTo: "not-found" }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    preloadingStrategy: PreloadAllModules

  })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
