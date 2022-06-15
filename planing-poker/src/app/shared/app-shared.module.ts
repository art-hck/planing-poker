import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MAT_DIALOG_DEFAULT_OPTIONS, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MAT_TOOLTIP_DEFAULT_OPTIONS, MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../app/components/header/header.component';
import { DialogModule } from './modules/dialog/dialog.module';
import { AbbreviationPipe } from './pipes/abbreviation.pipe';
import { PluralizePipe } from './pipes/pluralize-pipe';
import { StringToColorPipe } from './pipes/string-to-color.pipe';
import { AutoFocusDirective } from './directives/auto-focus.directive';

@NgModule({
  declarations: [
    PluralizePipe,
    AbbreviationPipe,
    StringToColorPipe,
    HeaderComponent,
    AutoFocusDirective,
  ],
  providers: [
    { provide: MAT_DIALOG_DEFAULT_OPTIONS, useValue: { enterAnimationDuration: "0ms", exitAnimationDuration: "0ms" } },
    { provide: MAT_TOOLTIP_DEFAULT_OPTIONS, useValue: { touchGestures: 'off' } }
  ],
  imports: [
    CommonModule,
    RouterModule,
    DialogModule,

    MatIconModule,
    MatToolbarModule,
    MatButtonModule,
    MatMenuModule,
    MatBadgeModule,
    MatDialogModule,
  ],
  exports: [
    PluralizePipe,
    AbbreviationPipe,
    StringToColorPipe,
    DialogModule,
    AutoFocusDirective,

    CommonModule,
    FormsModule,
    ReactiveFormsModule,

    MatSnackBarModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDialogModule,
    MatSidenavModule,
    MatFormFieldModule,
    MatInputModule,
    MatListModule,
    MatToolbarModule,
    MatTooltipModule,
    MatBadgeModule,
    HeaderComponent,
  ]
})
export class AppSharedModule {
}
