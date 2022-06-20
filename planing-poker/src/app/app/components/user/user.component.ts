import { Component, Inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { RolesName, User } from '@common/models';
import { TranslocoService } from '@ngneat/transloco';
import { AuthService } from '../../services/auth.service';

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
    role: this.data.user.role,
    lang: this.translocoService.getActiveLang()
  });
  edit = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { user: User },
    private fb: FormBuilder,
    public authService: AuthService,
    public translocoService: TranslocoService
  ) {}
}
