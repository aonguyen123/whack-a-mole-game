import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  QueryList,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import {
  concatMap,
  delay,
  fromEvent,
  map,
  Observable,
  take,
  tap,
  timer,
} from 'rxjs';
import { SCORE_ACTION } from './memory.enum';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-memory',
  imports: [CommonModule],
  templateUrl: './memory.component.html',
  styleUrl: './memory.component.css',
})
export class MemoryComponent implements AfterViewInit {
  @ViewChildren('node') nodeElement!: QueryList<ElementRef<HTMLDivElement>>;

  @ViewChild('startButton', { static: true })
  startElement!: ElementRef<HTMLButtonElement>;

  deplayGameMsg$!: Observable<number>;

  ngAfterViewInit(): void {
    const startButtonClicked$ = fromEvent(
      this.startElement.nativeElement,
      'click'
    ).pipe(map(() => SCORE_ACTION.RESET));

    const delayTime = 5;

    this.deplayGameMsg$ = startButtonClicked$.pipe(
      concatMap(() =>
        timer(0, 1000).pipe(
          take(delayTime + 1),
          map((v) => delayTime - v)
        )
      )
    );

    const deplayGameStart$ = startButtonClicked$.pipe(delay(delayTime * 1000));

    // const elementClick$ = (event: string, color: string) => {
    //   return this.nodeElement.map(({ nativeElement }) => {
    //     return fromEvent(nativeElement, event).pipe(
    //       tap((a: HTMLDivElement) => {})
    //     );
    //   });
    // };

    // fromEvent(document.querySelectorAll('.child'), event).pipe(
    //   pluck('srcElement'),
    //   tap((e: HTMLElement) => (e.style.background = color))
    // );

    /**Create game loop */
    deplayGameStart$.pipe();
  }
}
