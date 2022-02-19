import { ChangeDetectionStrategy, Component, HostListener, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { FormBuilder, Validators } from "@angular/forms";
import { RolesName } from "@common/models";

@Component({
  selector: 'pp-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AuthComponent {
  readonly roles = Object.entries(RolesName);
  readonly form = this.fb.group({
    name: ['', [Validators.required]],
    password: "",
    role: "",
  });
  devMode = false;
  private ctrlCount = 0;

  constructor(
    public dialogRef: MatDialogRef<AuthComponent>,
    private fb: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: { loginAttempts: number },
  ) {
  }

  @HostListener('window:keyup', ['$event'])
  keyEvent(event: KeyboardEvent) {
    if(event.key === 'Control') {
      if(++this.ctrlCount === 5) {
        this.devMode = true;
      }
    } else {
      this.ctrlCount = 0;
    }
  }
}
