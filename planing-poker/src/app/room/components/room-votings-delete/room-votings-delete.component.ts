import { Component, Inject } from '@angular/core';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { Voting } from '@common/models';

@Component({
  selector: 'pp-room-votings-delete',
  templateUrl: './room-votings-delete.component.html'
})
export class RoomVotingsDeleteComponent {

  constructor(@Inject(MAT_BOTTOM_SHEET_DATA) public data: { voting: Voting }, public ref: MatBottomSheetRef) {
  }
}
