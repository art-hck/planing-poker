import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { DialogConfirmComponent } from './components/dialog-confirm/dialog-confirm.component';
import { DialogToolbarComponent } from './components/dialog-toolbar/dialog-toolbar.component';
import { DialogService } from './dialog.service';


@NgModule({
  declarations: [
    DialogConfirmComponent,
    DialogToolbarComponent
  ],
  providers: [
    DialogService
  ],
  imports: [
    CommonModule,

    MatIconModule,
    MatToolbarModule,
    MatButtonModule,
    MatDialogModule,
  ],
  exports: [
    DialogToolbarComponent
  ]
})
export class DialogModule { }
