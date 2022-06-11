import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FeedbackRouteComponent } from '../app/components/feedback/feedback.route';
import { RoomCreateRouteComponent } from './components/room-create/room-create.route';
import { RoomUpdateRouteComponent } from './components/room-create/room-update.route';
import { RoomSettingsRouteComponent } from './components/room-settings/room-settings.route';
import { RoomVotingsCreateRouteComponent } from './components/room-votings-create/room-votings-create.route';
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
        component: RoomsHomeComponent,
        title: 'Список комнат - PlaningPoker',
        children: [
          { path: 'create', component: RoomCreateRouteComponent, title: 'Создать комнату - PlaningPoker' },
          { path: 'feedback', component: FeedbackRouteComponent, title: 'Обратная связь - PlaningPoker' }
        ]
      },
      {
        path: 'room/:id',
        component: RoomComponent,
        children: [
          { path: 'create', component: RoomCreateRouteComponent, title: 'Создать комнату - PlaningPoker' },
          { path: 'edit', component: RoomUpdateRouteComponent, title: 'Изменить комнату - PlaningPoker' },
          { path: 'create-voting', component: RoomVotingsCreateRouteComponent, title: 'Добавить стори - PlaningPoker' },
          { path: 'settings', component: RoomSettingsRouteComponent },
          { path: 'feedback', component: FeedbackRouteComponent, title: 'Обратная связь - PlaningPoker' }
        ]
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
