import { Injectable } from '@angular/core';
import { MatDrawerMode } from "@angular/material/sidenav/drawer";
import { filter, map, Subject, switchMapTo } from "rxjs";
import { NavigationEnd, Router } from "@angular/router";
import { ResolutionService } from "./resolution.service";

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

  private _showVotings = false;
  private _showPlayers = false;
  private _sidenavMode: MatDrawerMode = 'over';
  public detectChanges$ = new Subject<void>();

  saveSidebarsState() {
    if (this._sidenavMode === 'side') {
      window.localStorage.setItem('showVotings', this.showVotings.toString());
      window.localStorage.setItem('showPlayers', this.showPlayers.toString());
    }
  }

  constructor(private router: Router, private resolutionService: ResolutionService) {
    router.events.pipe(filter(e => e instanceof NavigationEnd)).pipe(
      switchMapTo(this.resolutionService.isMobile$),
      filter(isMobile => isMobile)
    ).subscribe(() => this.showPlayers = this.showVotings = false);

    this.resolutionService.isMobile$.pipe(
      map(isMobile => isMobile ? 'over' : 'side'),
      filter(sidenavMode => sidenavMode !== this.sidenavMode)
    ).subscribe((sidenavMode) => {
      this.sidenavMode = sidenavMode;
      this.showVotings = sidenavMode === 'side' ? (window.localStorage.getItem('showVotings') || 'true') === 'true' : false;
      this.showPlayers = sidenavMode === 'side' ? (window.localStorage.getItem('showPlayers') || 'true') === 'true' : false;
      this.detectChanges$.next();
    });
  }
}
