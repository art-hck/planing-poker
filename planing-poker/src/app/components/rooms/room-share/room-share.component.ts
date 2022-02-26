import { Component, ElementRef, Inject, ViewChild } from '@angular/core';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { Uuid } from '@common/models';

@Component({
  template: `
    <!--      <div class="mat-body">-->
    <!--        Для получения доступа к комнате достаточно просто перейти по ссылке. Скопируйте и отправте её всем участникам.-->
    <!--      </div>-->
    <br />

    <mat-form-field appearance='outline' hideRequiredMarker>
      <mat-label>Код для входа в комнату</mat-label>
      <input matInput [value]='location' #input (focus)='input.select()'>
    </mat-form-field>
    <div [align]="'end'">
      <button mat-flat-button color='primary' (click)='ref.dismiss()'>Закрыть</button>
    </div>
  `,
})
export class RoomShareDialogComponent {
  location = this.data.roomId;
  @ViewChild('input') input?: ElementRef<HTMLInputElement>;

  constructor(@Inject(MAT_BOTTOM_SHEET_DATA) public data: { roomId: Uuid }, public ref: MatBottomSheetRef) {
  }
}
