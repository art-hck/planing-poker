import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
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
    name: ['', [Validators.required, Validators.minLength(1)]],
    password: { value: "", disabled: true },
    teamRole: { value: "" },
    guest: true
  });

  constructor(
    public dialogRef: MatDialogRef<AuthComponent>,
    private fb: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: { loginAttempts: number },
  ) {
  }

  ngOnInit() {
    this.form.get('guest')!.valueChanges.subscribe(guest => {
      if (guest) {
        this.form.get('password')?.disable()
        this.form.get('password')?.clearValidators();
      } else {
        this.form.get('password')?.enable();
        this.form.get('password')?.setValidators([Validators.required]);
      }
      this.form.get('password')?.updateValueAndValidity({ emitEvent: false });
    })
  }
}
