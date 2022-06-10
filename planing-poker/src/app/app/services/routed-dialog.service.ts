import { ComponentType } from '@angular/cdk/portal';
import { Injectable } from '@angular/core';
import { MatDialog, MatDialogConfig, MatDialogState } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { filter, map, merge, NEVER, Subject, switchMap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class RoutedDialog {
  private readonly dialogFactories = new Map<string | null, { component: ComponentType<any>, config: MatDialogConfig & { id: string } }>();
  private readonly register$ = new Subject<string>();
  private readonly dialogs$ = new Subject<{ id: string, data: any }>();

  constructor(private router: Router, private route: ActivatedRoute, private matDialog: MatDialog) {

    merge(this.route.fragment, this.register$.pipe(map(() => this.route.snapshot.fragment))).pipe(
      map(id => this.dialogFactories.get(id)),
      filter(f => !!f && matDialog.getDialogById(f.config.id)?.getState() !== MatDialogState.OPEN),
      switchMap(f => f ? this.matDialog.open(f.component, f.config).afterClosed().pipe(map(data => ({ id: f.config.id, data }))) : NEVER)
    ).subscribe(d => {
      this.router.navigate([]);
      this.dialogs$.next(d);
    });
  }

  register(component: ComponentType<any>, config: MatDialogConfig & { id: string }) {
    this.dialogFactories.set(config.id, {
      component,
      config: {
        ...config,
        width: '500px',
        panelClass: 'app-responsive-modal',
        backdropClass: 'app-responsive-backdrop'
      }
    });
    this.register$.next(config.id);
    return this.dialogs$.pipe(filter(d => d.id === config.id), map(({ data }) => data));
  }
}
