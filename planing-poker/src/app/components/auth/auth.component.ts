import { ChangeDetectionStrategy, Component, HostListener } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { RolesName } from '@common/models';
import { environment } from '../../../environments/environment';

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
  });
  devMode = false;
  private ctrlCount = 0;

  readonly googleLink: string = "https://accounts.google.com/o/oauth2/v2/auth" + this.router.createUrlTree(['.'], {
    queryParams: {
      access_type: 'offline',
      scope: 'https://www.googleapis.com/auth/userinfo.profile',
      client_id: environment.googleClientId,
      redirect_uri: environment.googleRedirectUri,
      response_type: 'code'
    }
  }).toString().slice(1);

  constructor(
    public dialogRef: MatDialogRef<AuthComponent>,
    private fb: FormBuilder,
    private router: Router
  ) {
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
    if (this.form.invalid) return;
    this.dialogRef.close(this.form.value);
  }
}
