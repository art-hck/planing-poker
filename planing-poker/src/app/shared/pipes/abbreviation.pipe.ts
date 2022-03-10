import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'abbreviation'
})
export class AbbreviationPipe implements PipeTransform {

  transform(value: string, letters = 2): unknown {
    return value.split(' ').map(n => n[0]).slice(0, letters).join('');
  }

}
