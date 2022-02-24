import { Component, OnDestroy } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { endWith, map, scan, Subject, switchMap, takeUntil, takeWhile, timer } from 'rxjs';
import { PlaningPokerWsService } from '../../../services/planing-poker-ws.service';

@Component({
  templateUrl: './telegram-link.component.html',
})
export class TelegramLinkComponent implements OnDestroy {
  readonly code = this.fb.control('', Validators.required);
  readonly destroy$ = new Subject<void>();
  readonly startTimer$ = new Subject<number>();
  readonly timer$ = this.startTimer$.pipe(
    switchMap(countdown => timer(0, 1000).pipe(
      scan(acc => --acc, countdown),
      takeWhile(x => x >= 0),
      map(time => {
        const date = new Date(0);
        date.setSeconds(time + date.getTimezoneOffset() * 60);
        return date;
      }),
      endWith(undefined),
    )),
  );

  constructor(
    public dialogRef: MatDialogRef<TelegramLinkComponent>,
    private fb: FormBuilder,
    private pp: PlaningPokerWsService,
    private snackBar: MatSnackBar,
  ) {
    this.pp.linkTelegram$.pipe(takeUntil(this.destroy$)).subscribe(({ success }) => {
      if (success) {
        this.snackBar.open('Аккаунт успешно привязан', '', { duration: 2000 });
        this.dialogRef.close();
      } else {
        this.code.setErrors({ invalidCode: true });
      }
    });
  }

  submit() {
    this.pp.linkTelegram(Number(this.code.value));
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
