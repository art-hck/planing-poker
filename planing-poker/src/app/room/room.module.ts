import { NgModule } from '@angular/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatChipsModule } from '@angular/material/chips';
import { MatRippleModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatStepperModule } from '@angular/material/stepper';

import { AppSharedModule } from '../shared/app-shared.module';
import { RoomCardsComponent } from './components/room-cards/room-cards.component';
import { RoomCreateComponent } from './components/room-create/room-create.component';
import { RoomDeleteComponent } from './components/room-delete/room-delete.component';
import { RoomSettingsComponent } from './components/room-settings/room-settings.component';
import { RoomShareDialogComponent } from './components/room-share/room-share.component';
import { RoomUsersChangeModeratorComponent } from './components/room-users-change-moderator/room-users-change-moderator.component';
import { RoomUserComponent } from './components/room-users/room-user/room-user.component';
import { RoomUsersComponent } from './components/room-users/room-users.component';
import { RoomUsersPipe } from './components/room-users/room-users.pipe';
import { RoomVotingsCreateComponent } from './components/room-votings-create/room-votings-create.component';
import { RoomVotingsDeleteComponent } from './components/room-votings-delete/room-votings-delete.component';
import { RoomVotingsComponent } from './components/room-votings/room-votings.component';
import { RoomComponent } from './components/room/room.component';
import { RoomsHomeComponent } from './components/rooms-home/rooms-home.component';
import { RoomsComponent } from './components/rooms/rooms.component';
import { DoughnutDirective } from './directives/doughnut.directive';
import { RoomRoutingModule } from './room-routing.module';


@NgModule({
  declarations: [
    RoomComponent,
    RoomVotingsComponent,
    RoomVotingsCreateComponent,
    RoomVotingsDeleteComponent,
    RoomUsersComponent,
    RoomCardsComponent,
    RoomUsersPipe,
    RoomUserComponent,
    RoomCreateComponent,
    RoomsComponent,
    RoomShareDialogComponent,
    RoomUsersChangeModeratorComponent,
    RoomDeleteComponent,
    RoomsHomeComponent,
    RoomSettingsComponent,
    DoughnutDirective,
  ],
  imports: [
    RoomRoutingModule,
    AppSharedModule,

    MatDividerModule,
    MatRippleModule,
    MatStepperModule,
    MatChipsModule,
    MatBadgeModule,
    MatMenuModule,
    MatButtonToggleModule,
    MatSelectModule
  ]
})
export class RoomModule {
}
