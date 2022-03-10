import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RoomComponent } from './components/room/room.component';
import { RoomsHomeComponent } from './components/rooms-home/rooms-home.component';
import { RoomsComponent } from './components/rooms/rooms.component';

const routes: Routes = [
  {
    path: '',
    component: RoomsComponent,
    children: [
      {
        path: '',
        component: RoomsHomeComponent
      },
      {
        path: 'room/:id',
        component: RoomComponent,
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class RoomRoutingModule {
}
