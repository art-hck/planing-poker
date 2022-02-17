import { Component, Inject, NgZone, ViewChild } from '@angular/core';
import { CdkTextareaAutosize } from "@angular/cdk/text-field";
import { FormBuilder, Validators } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { take } from "rxjs";

@Component({
  selector: 'pp-feedback',
  templateUrl: './feedback.component.html'
})
export class FeedbackComponent {
  @ViewChild('autosize') autosize!: CdkTextareaAutosize;
  readonly form = this.fb.group({
    subject: ['', Validators.required],
    message: ['', Validators.required],
  });

  constructor(
    public dialogRef: MatDialogRef<FeedbackComponent>,
    private fb: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: unknown,
    private _ngZone: NgZone
  ) {}

  triggerResize() {
    this._ngZone.onStable.pipe(take(1)).subscribe(() => this.autosize.resizeToFitContent(true));
  }
}
