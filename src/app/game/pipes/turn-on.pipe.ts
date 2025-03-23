import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'turnOn',
})
export class TurnOnPipe implements PipeTransform {
  transform(seconds: number | null): string {
    if (seconds === 0) {
      return 'You Turn';
    }
    return ``;
  }
}
