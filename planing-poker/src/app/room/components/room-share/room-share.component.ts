import { Component, ElementRef, Inject, ViewChild } from '@angular/core';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { Room } from '@common/models';

@Component({
  template: `
    <br />

    <mat-form-field appearance='outline' hideRequiredMarker>
      <mat-label>Ссылка для входа в комнату</mat-label>
      <input matInput [value]='location' #input (focus)='input.select()'>
    </mat-form-field>
    <div [align]="'end'">
      <button mat-flat-button color='primary' (click)='ref.dismiss()'>Закрыть</button>
    </div>
  `,
})
export class RoomShareDialogComponent {
  readonly location = window?.location?.origin + '/room/' + (this.data.room.alias || this.data.room.id);
  @ViewChild('input') input?: ElementRef<HTMLInputElement>;

  constructor(@Inject(MAT_BOTTOM_SHEET_DATA) public data: { room: Room<true> }, public ref: MatBottomSheetRef) {
  }
}
