import { NgModule } from '@angular/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatChipsModule } from '@angular/material/chips';
import { MatRippleModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatStepperModule } from '@angular/material/stepper';
import { AppSharedModule } from '../app-shared.module';
import { DoughnutDirective } from '../directives/doughnut.directive';
import { RoomRoutingModule } from './room-routing.module';
import { CardsComponent } from './room/cards/cards.component';
import { RoomComponent } from './room/room.component';
import { ChangeModeratorConfirmComponent, UserComponent } from './room/users/user/user.component';
import { UsersComponent } from './room/users/users.component';
import { UsersPipe } from './room/users/users.pipe';
import { CreateVoteComponent } from './room/votings-create/create-vote.component';
import { VotingDeleteConfirmComponent, VotingsComponent } from './room/votings/votings.component';
import { DeleteRoomConfirmDialogComponent } from './rooms/rooms.component';
import { SettingsComponent } from './settings/settings.component';


@NgModule({
  declarations: [
    RoomComponent,
    VotingsComponent,
    UsersComponent,
    DoughnutDirective,
    CreateVoteComponent,
    VotingDeleteConfirmComponent,
    CardsComponent,
    UsersPipe,
    UserComponent,
    ChangeModeratorConfirmComponent,
    DeleteRoomConfirmDialogComponent,
    SettingsComponent
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
