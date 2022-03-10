import { Pipe, PipeTransform } from '@angular/core';
import { Colors } from '../util/colors';

@Pipe({
  name: 'stringToColor'
})
export class StringToColorPipe implements PipeTransform {

  transform(string: string): unknown {
    return Colors[string.split("").map(char => +char.charCodeAt(0)).reduce((a, b) => a + b, 0) % Colors.length];
  }

}
