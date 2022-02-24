import { ChangeDetectionStrategy, Component, HostListener } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { RolesName } from '@common/models';

@Component({
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthComponent {
  readonly roles = Object.entries(RolesName);
  readonly form = this.fb.group({
    name: ['', [Validators.required]],
    password: '',
    role: '',
    telegramCode: '',
  });
  readonly telegramCodeForm = this.fb.group({
    telegramCode: ['', [Validators.required]],
  });
  devMode = false;
  telegramHandshake = false;
  private ctrlCount = 0;

  constructor(public dialogRef: MatDialogRef<AuthComponent>, private fb: FormBuilder) {
  }

  @HostListener('window:keyup', ['$event'])
  keyEvent(event: KeyboardEvent) {
    if (event.key === 'Control') {
      if (++this.ctrlCount === 5) {
        this.devMode = true;
      }
    } else {
      this.ctrlCount = 0;
    }
  }

  submit() {
    if (this.form.invalid && this.telegramCodeForm.invalid) return;
    this.dialogRef.close(this.form.valid ? this.form.value : this.telegramCodeForm.value);
  }
}
