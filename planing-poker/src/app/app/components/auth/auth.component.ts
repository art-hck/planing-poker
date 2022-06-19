import { ChangeDetectionStrategy, Component, HostListener, OnDestroy, ViewChild } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { MatTooltip } from '@angular/material/tooltip';
import { RolesName } from '@common/models';
import { debounceTime, distinctUntilChanged, filter, finalize, map, Subject, takeUntil, takeWhile, timer } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { PlaningPokerWsService } from '../../services/planing-poker-ws.service';

@Component({
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AuthComponent implements OnDestroy {
  @ViewChild('matTooltipRef', { read: MatTooltip }) matTooltip?: MatTooltip;
  readonly roles = Object.entries(RolesName);
  readonly form = this.fb.nonNullable.group({
    name: { value: '', disabled: true },
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

  constructor(
    public dialogRef: MatDialogRef<AuthComponent>,
    private fb: FormBuilder,
    private pp: PlaningPokerWsService,
    public authService: AuthService
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

  checkAnonymous(e: MatSlideToggleChange) {
    if (e.checked) {
      this.form.get('email')?.disable();
      this.form.get('name')?.enable();
      this.matTooltip?.show();
    } else {
      this.form.get('email')?.enable();
      this.form.get('name')?.disable();
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
