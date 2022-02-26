import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import { ChangeDetectionStrategy, Component, Inject, NgZone, ViewChild } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { take } from 'rxjs';

@Component({
  selector: 'pp-create',
  templateUrl: './create-vote.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateVoteComponent {
  @ViewChild('autosize') autosize!: CdkTextareaAutosize;
  readonly form = this.fb.group({
    names: ['', Validators.required],
  });

  constructor(
    public dialogRef: MatDialogRef<CreateVoteComponent>,
    private fb: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: unknown,
    private _ngZone: NgZone,
  ) {
  }

  triggerResize() {
    this._ngZone.onStable.pipe(take(1)).subscribe(() => this.autosize.resizeToFitContent(true));
  }
}