import { Injectable } from '@angular/core';
import { MatDrawerMode } from "@angular/material/sidenav/drawer";
import { debounceTime, filter, fromEvent, map, startWith, Subject } from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class SidebarsService {
  get sidenavMode(): MatDrawerMode {
    return this._sidenavMode;
  }

  set sidenavMode(value: MatDrawerMode) {
    this._sidenavMode = value;
    this.detectChanges$.next();
  }
  get showPlayers(): boolean {
    return this._showPlayers;
  }

  set showPlayers(value: boolean) {
    this._showPlayers = value;
    this.detectChanges$.next();
  }

  get showVotings(): boolean {
    return this._showVotings;
  }

  set showVotings(value: boolean) {
    this._showVotings = value;
    this.detectChanges$.next();
  }

  private _showVotings: boolean = false;
  private _showPlayers: boolean = false;
  private _sidenavMode: MatDrawerMode = 'over';
  public detectChanges$ = new Subject<void>();

  saveSidebarsState() {
    if (this._sidenavMode === 'side') {
      window.localStorage.setItem('showVotings', this.showVotings.toString());
      window.localStorage.setItem('showPlayers', this.showPlayers.toString());
    }
  }

  constructor() {
    fromEvent(window, 'resize').pipe(
      debounceTime(200),
      startWith(null),
      map(() => (window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth) > 1000 ? 'side' : 'over'),
      filter(sidenavMode => sidenavMode !== this.sidenavMode)
    ).subscribe(sidenavMode => {
      this.sidenavMode = sidenavMode;
      this.showVotings = sidenavMode === 'side' ? (window.localStorage.getItem('showVotings') || 'true') === 'true' : false;
      this.showPlayers = sidenavMode === 'side' ? (window.localStorage.getItem('showPlayers') || 'true') === 'true' : false;
      this.detectChanges$.next();
    });
  }
}
