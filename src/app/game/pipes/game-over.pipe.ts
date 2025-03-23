import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'gameOver',
})
export class GameOverPipe implements PipeTransform {
  transform(checkGameOver: boolean | null): string {
    if (checkGameOver) {
      return 'Game Over';
    }
    return '';
  }
}
