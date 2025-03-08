import { Observable, tap } from 'rxjs';

export const whackSound =
  (soundElement: HTMLAudioElement) => (source: Observable<any>) =>
    source.pipe(
      tap(() => {
        soundElement.currentTime = 0;
        soundElement.play();
      })
    );
