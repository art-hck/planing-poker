import { Component, Inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { RolesName, User } from '@common/models';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'pp-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.scss']
})
export class UserComponent {
  readonly roles = Object.entries(RolesName);
  readonly RolesName = RolesName;
  readonly form = this.fb.group({
    name: [this.data.user.name, [Validators.required]],
    role: this.data.user.role
  });
  edit = false;

  readonly googleLink: string = 'https://accounts.google.com/o/oauth2/v2/auth' + this.router.createUrlTree(['.'], {
    queryParams: {
      access_type: 'offline',
      scope: 'https://www.googleapis.com/auth/userinfo.profile',
      client_id: environment.googleClientId,
      redirect_uri: environment.googleRedirectUri,
      response_type: 'code'
    }
  }).toString().slice(1);

  constructor(@Inject(MAT_DIALOG_DATA) public data: { user: User }, private fb: FormBuilder, private router: Router) {
  }
}
