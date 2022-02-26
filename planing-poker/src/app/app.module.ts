import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgxsReduxDevtoolsPluginModule } from '@ngxs/devtools-plugin';
import { NgxsModule } from '@ngxs/store';
import { environment } from '../environments/environment';

import { AppRoutingModule } from './app-routing.module';
import { AppSharedModule } from './app-shared.module';
import { AppComponent } from './app.component';
import { AuthGoogleComponent } from './components/auth/auth-google.component';
import { AuthComponent } from './components/auth/auth.component';
import { AuthGuard } from './components/auth/auth.guard';
import { ForbiddenComponent } from './components/forbidden/forbidden.component';
import { FeedbackComponent } from './components/header/feedback/feedback.component';
import { NotFoundComponent } from './components/not-found/not-found.component';
import { RoomCreateComponent } from './components/rooms/room-create/room-create.component';
import { RoomShareDialogComponent } from './components/rooms/room-share/room-share.component';
import { RoomsComponent } from './components/rooms/rooms.component';
import { UsersState } from './states/users.state';
import { VotingsState } from './states/votings.state';

@NgModule({
  declarations: [
    AppComponent,
    AuthComponent,
    AuthGoogleComponent,
    FeedbackComponent,
    NotFoundComponent,
    RoomCreateComponent,
    RoomsComponent,
    RoomShareDialogComponent,
    ForbiddenComponent,
  ],
  imports: [
    AppSharedModule,
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    HttpClientModule,
    NgxsModule.forRoot([UsersState, VotingsState], { developmentMode: !environment.production }),
    NgxsReduxDevtoolsPluginModule.forRoot({ disabled: environment.production }),
    MatButtonToggleModule,
    MatSelectModule,
    MatMenuModule,
    MatBottomSheetModule,
  ],
  providers: [AuthGuard],
  bootstrap: [AppComponent],
})
export class AppModule {
}
