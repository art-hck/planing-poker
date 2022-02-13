import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatButtonModule } from "@angular/material/button";
import { MatDividerModule } from "@angular/material/divider";
import { MatIconModule } from "@angular/material/icon";
import { MatToolbarModule } from "@angular/material/toolbar";
import { MatCardModule } from "@angular/material/card";
import { MatSidenavModule } from "@angular/material/sidenav";
import { MatListModule } from "@angular/material/list";
import { MatRippleModule } from "@angular/material/core";
import { MatStepperModule } from "@angular/material/stepper";
import { MatChipsModule } from "@angular/material/chips";
import { HeaderComponent } from './components/header/header.component';
import { UsersComponent } from './components/users/users.component';
import { CardsComponent } from './components/cards/cards.component';
import { VotingsComponent } from './components/votings/votings.component';
import { AuthComponent } from './components/auth/auth.component';
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatDialogModule } from "@angular/material/dialog";
import { MatSnackBarModule } from "@angular/material/snack-bar";
import { MatSlideToggleModule } from "@angular/material/slide-toggle";
import { CreateVoteComponent } from './components/create-vote/create-vote.component';
import { NgxsModule } from "@ngxs/store";
import { VotingsState } from "./states/votings.state";
import { MatButtonToggleModule } from "@angular/material/button-toggle";
import { MatTooltipModule } from "@angular/material/tooltip";
import { environment } from "../environments/environment";
import { NgChartsModule } from 'ng2-charts';
import { MatTableModule } from "@angular/material/table";
import { DoughnutDirective } from './directives/doughnut.directive';
import { PluralizePipe } from "./pipes/pluralize-pipe";
import { UsersState } from "./states/users.state";
import { NotFoundComponent } from './components/not-found/not-found.component';
import { RoomComponent } from "./components/room/room.component";
import { NewRoomDialogComponent, RoomsComponent } from './components/rooms/rooms.component';
import { AuthGuard } from "./components/auth/auth.guard";

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    UsersComponent,
    CardsComponent,
    VotingsComponent,
    AuthComponent,
    CreateVoteComponent,
    DoughnutDirective,
    PluralizePipe,
    NotFoundComponent,
    RoomComponent,
    NewRoomDialogComponent,
    RoomsComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    BrowserAnimationsModule,
    MatButtonModule,
    MatDividerModule,
    MatIconModule,
    MatToolbarModule,
    MatCardModule,
    MatSidenavModule,
    MatListModule,
    MatRippleModule,
    MatStepperModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
    MatSnackBarModule,
    MatSlideToggleModule,
    ReactiveFormsModule,
    NgxsModule.forRoot([UsersState, VotingsState], {
      developmentMode: !environment.production
    }),
    MatButtonToggleModule,
    MatTooltipModule,
    NgChartsModule,
    MatTableModule
  ],
  providers: [AuthGuard],
  bootstrap: [AppComponent]
})
export class AppModule {
}
