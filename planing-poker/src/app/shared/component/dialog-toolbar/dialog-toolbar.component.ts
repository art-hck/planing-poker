import { Component, Input } from '@angular/core';

@Component({
  selector: 'pp-dialog-toolbar',
  templateUrl: './dialog-toolbar.component.html',
  styleUrls: ['./dialog-toolbar.component.scss']
})
export class DialogToolbarComponent {
  @Input() closable = true;
  @Input() back = false;
}
