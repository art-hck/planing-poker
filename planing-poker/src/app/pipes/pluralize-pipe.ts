import {Pipe, PipeTransform} from "@angular/core";

@Pipe({
  name: "pluralize",
})
export class PluralizePipe implements PipeTransform {

  transform(number: number, ...titles: any[]): string {
    const cases = [2, 0, 1, 1, 1, 2];
    let withNumber = true;

    if (typeof titles[0] === "boolean") {
      withNumber = titles[0];
      titles.splice(0, 1);
    }

    return (withNumber ? number : "") + " " + titles[(number % 100 > 4 && number % 100 < 20) ? 2 : cases[(number % 10 < 5) ? number % 10 : 5]];
  }
}
