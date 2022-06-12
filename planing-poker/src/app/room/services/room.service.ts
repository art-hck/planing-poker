import { Injectable } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { Room } from '@common/models';
import { RoomShareDialogComponent } from '../components/room-share/room-share.component';

@Injectable({
  providedIn: 'root'
})
export class RoomService {

  constructor(private bottomSheet: MatBottomSheet) {}

  share(room: Room<true>) {
    if (navigator?.share) {
      navigator.share({
        title: room.name,
        url: window?.location?.origin + '/room/' + (room.alias || room.id)
      });
    } else {
      this.bottomSheet.open(RoomShareDialogComponent, { data: { room } });
    }
  }
}
