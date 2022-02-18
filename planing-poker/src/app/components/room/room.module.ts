import { NgModule } from '@angular/core';
import { RoomRoutingModule } from "./room-routing.module";
import { RoomComponent } from "./room.component";
import { VotingDeleteConfirmComponent, VotingsComponent } from "../votings/votings.component";
import { UsersComponent } from "../users/users.component";
import { CardsComponent } from "../cards/cards.component";
import { AppSharedModule } from "../../app-shared.module";
import { DoughnutDirective } from "../../directives/doughnut.directive";
import { CreateVoteComponent } from "../create-vote/create-vote.component";
import { MatDividerModule } from "@angular/material/divider";
import { MatRippleModule } from "@angular/material/core";
import { MatStepperModule } from "@angular/material/stepper";
import { MatChipsModule } from "@angular/material/chips";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatBadgeModule } from "@angular/material/badge";
import { MatBottomSheetModule } from "@angular/material/bottom-sheet";
import { UsersPipe } from "../users/users.pipe";


@NgModule({
  declarations: [
    RoomComponent,
    VotingsComponent,
    UsersComponent,
    DoughnutDirective,
    CreateVoteComponent,
    VotingDeleteConfirmComponent,
    CardsComponent,
    UsersPipe
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
    MatBottomSheetModule
  ]
})
export class RoomModule { }
