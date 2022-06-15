import { ChangeDetectorRef, Directive, ElementRef, OnInit } from '@angular/core';

@Directive({ selector: '[ppAutoFocus]' })
export class AutoFocusDirective implements OnInit {

  constructor(
    private el: ElementRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.el.nativeElement.focus();
    this.cd.detectChanges();
  }
}
