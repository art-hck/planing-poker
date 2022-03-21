import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Voting } from '@common/models';

@Component({
  selector: 'pp-room-votings-edit',
  templateUrl: './room-votings-edit.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoomVotingsEditComponent {
  readonly form = this.fb.group({
    name: ['', Validators.required],
  });

  constructor(
    public dialogRef: MatDialogRef<RoomVotingsEditComponent>,
    private fb: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: { voting: Voting },
  ) {
    this.form.patchValue(data.voting, { emitEvent: false });
  }
}
