import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { FormBuilder, Validators } from "@angular/forms";

@Component({
  selector: 'pp-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss']
})
export class AuthComponent {
  readonly form = this.fb.group({
    name: ['', Validators.required],
    password: '',
    guest: true
  });

  constructor(
    public dialogRef: MatDialogRef<AuthComponent>,
    private fb: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: { loginAttempts: number },
  ) {}
}
