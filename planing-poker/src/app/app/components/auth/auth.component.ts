import { ChangeDetectionStrategy, Component, HostListener, OnDestroy } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { RolesName } from '@common/models';
import { debounceTime, distinctUntilChanged, filter, finalize, map, Subject, takeUntil, takeWhile, timer } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PlaningPokerWsService } from '../../services/planing-poker-ws.service';

@Component({
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AuthComponent implements OnDestroy {
  readonly roles = Object.entries(RolesName);
  readonly form = this.fb.nonNullable.group({
    name: '',
    email: ['', [Validators.required, Validators.email]],
    password: [{ value: '', disabled: true }],
    role: '',
    emailCode: [{ value: '', disabled: true }, [Validators.required, Validators.pattern(/^\d{6}$/)]]
  });
  readonly timer$ = timer(0, 1000).pipe(
    map(i => 5 * 60 - i),
    takeWhile(t => t >= 0),
    map(s => new Date(s * 1000).toISOString().slice(14, 19)),
    finalize(() => this.form.get('emailCode')?.disable())
  );
  readonly destroy$ = new Subject<void>();
  private ctrlCount = 0;

  get isCodeStep(): boolean {
    return !!this.form.get('emailCode')?.enabled;
  }

  readonly googleLink: string = 'https://accounts.google.com/o/oauth2/v2/auth' + this.router.createUrlTree(['.'], {
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
    private pp: PlaningPokerWsService,
    private router: Router
  ) {
    this.form?.valueChanges.pipe(debounceTime(400), filter(() => !!this.form.get('emailCode')?.valid), takeUntil(this.destroy$))
      .subscribe(() => this.submit());

    this.form.get('email')?.statusChanges.pipe(distinctUntilChanged(), takeUntil(this.destroy$)).subscribe(s => {
      this.form.get('name')?.setValidators(s !== 'DISABLED' ? null : Validators.required);
      this.form.get('name')?.updateValueAndValidity();
    });
  }

  preventNonNumber(e: KeyboardEvent) {
    !e.ctrlKey && /^(\D)$/.test(e.key) && e.preventDefault();
  }

  @HostListener('window:keyup', ['$event'])
  keyEvent(event: KeyboardEvent) {
    if (event.key === 'Control') {
      if (++this.ctrlCount === 5) {
        this.form.get('password')?.enable();
      }
    } else {
      this.ctrlCount = 0;
    }
  }

  submit() {
    if (!this.isCodeStep && this.form.get('email')?.enabled && this.form.get('email')?.valid) {
      this.form.get('emailCode')?.reset({ value: '', disabled: false });
      this.pp.sendCode(this.form.value.email ?? '');
    } else if (this.form.valid) {
      this.dialogRef.close(this.form.value);
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
