import { NgModule } from '@angular/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatChipsModule } from '@angular/material/chips';
import { MatRippleModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { MatStepperModule } from '@angular/material/stepper';
import { MatTooltipModule } from '@angular/material/tooltip';
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
    DeleteRoomConfirmDialogComponent
  ],
  imports: [
    RoomRoutingModule,
    AppSharedModule,

    MatDividerModule,
    MatRippleModule,
    MatStepperModule,
    MatChipsModule,
    MatTooltipModule,
    MatBadgeModule,
    MatMenuModule
  ]
})
export class RoomModule {
}
