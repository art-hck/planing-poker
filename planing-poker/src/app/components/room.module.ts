import { NgModule } from '@angular/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatChipsModule } from '@angular/material/chips';
import { MatRippleModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { MatStepperModule } from '@angular/material/stepper';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AppSharedModule } from '../app-shared.module';
import { DoughnutDirective } from '../directives/doughnut.directive';
import { CardsComponent } from './room/cards/cards.component';
import { CreateVoteComponent } from './room/create-vote/create-vote.component';
import { RoomRoutingModule } from './room-routing.module';
import { RoomComponent } from './room/room.component';
import { ChangeModeratorConfirmComponent, UserComponent } from './room/users/user/user.component';
import { UsersComponent } from './room/users/users.component';
import { UsersPipe } from './room/users/users.pipe';
import { VotingDeleteConfirmComponent, VotingsComponent } from './room/votings/votings.component';


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
    MatBottomSheetModule,
    MatMenuModule,
  ],
})
export class RoomModule {
}
