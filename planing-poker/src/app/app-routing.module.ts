import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NotFoundComponent } from "./components/not-found/not-found.component";
import { RoomComponent } from "./components/room/room.component";
import { RoomsComponent } from "./components/rooms/rooms.component";
import { AuthGuard } from "./components/auth/auth.guard";

const routes: Routes = [
  { path: '', component: RoomsComponent, canActivate: [AuthGuard] },
  { path: 'not-found', component: NotFoundComponent },
  { path: ':id', component: RoomComponent, canActivate: [AuthGuard] },
  { path: '**', redirectTo: "not-found" }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
