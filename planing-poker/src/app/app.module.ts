import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AuthComponent } from './components/auth/auth.component';
import { NgxsModule } from "@ngxs/store";
import { VotingsState } from "./states/votings.state";
import { environment } from "../environments/environment";
import { UsersState } from "./states/users.state";
import { NotFoundComponent } from './components/not-found/not-found.component';
import { NewRoomDialogComponent, RoomsComponent } from './components/rooms/rooms.component';
import { AuthGuard } from "./components/auth/auth.guard";
import { NgxsReduxDevtoolsPluginModule } from "@ngxs/devtools-plugin";
import { AppSharedModule } from "./app-shared.module";
import { MatButtonToggleModule } from "@angular/material/button-toggle";
import { MatSelectModule } from "@angular/material/select";

@NgModule({
  declarations: [
    AppComponent,
    AuthComponent,
    NotFoundComponent,
    NewRoomDialogComponent,
    RoomsComponent,


  ],
  imports: [
    AppSharedModule,
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    NgxsModule.forRoot([UsersState, VotingsState], { developmentMode: !environment.production }),
    NgxsReduxDevtoolsPluginModule.forRoot({ disabled: environment.production }),
    MatButtonToggleModule,
    MatSelectModule,
  ],
  providers: [AuthGuard],
  bootstrap: [AppComponent]
})
export class AppModule {
}
