import { ComponentType } from '@angular/cdk/portal';
import { Injectable } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { filter, Observable } from 'rxjs';
import { DefaultDialogConfig } from '../../util/default-dialog-config';
import { DialogConfirmComponent } from './components/dialog-confirm/dialog-confirm.component';
import { DialogConfirmData } from './components/dialog-confirm/dialog-confirm.data';

@Injectable()
export class DialogService {

  constructor(public matDialog: MatDialog) { }

  confirm<D = DialogConfirmData, R = boolean>(config?: MatDialogConfig<D>): Observable<R | undefined> {
    return this.small<DialogConfirmComponent, D, R>(DialogConfirmComponent, config).pipe(filter(v => !!v));
  }

  small<T, D = any, R = any>(component: ComponentType<T>, config?: MatDialogConfig<D>): Observable<R | undefined> {
    return this.open<T, D, R>(component, { width: '360px', ...config });
  }

  big<T, D = any, R = any>(component: ComponentType<T>, config?: MatDialogConfig<D>): Observable<R | undefined> {
    return this.open<T, D, R>(component, { ...DefaultDialogConfig, ...config });
  }

  open<T, D = any, R = any>(component: ComponentType<T>, config?: MatDialogConfig<D>): Observable<R | undefined> {
    return this.matDialog.open<T, D, R>(component, config).afterClosed();
  }

  getDialogById(id: string) {
    return this.matDialog.getDialogById(id);
  }
}
