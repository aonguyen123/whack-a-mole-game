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
  BehaviorSubject,
  combineLatest,
  concatMap,
  defer,
  delay,
  filter,
  from,
  fromEvent,
  generate,
  iif,
  map,
  merge,
  Observable,
  of,
  scan,
  sequenceEqual,
  shareReplay,
  startWith,
  Subject,
  switchMap,
  take,
  takeUntil,
  tap,
  timer,
} from 'rxjs';
import { SCORE_ACTION } from './memory.enum';
import { CommonModule } from '@angular/common';
import {
  sequenceToMemory,
  takePlayerInput,
} from '../custom-operators/sequence-to-memory.operator';
import { TurnOnPipe, GameOverPipe } from '../pipes';

type Sequence = {
  ramdomSequence: Array<number>;
  userSequence: Array<number>;
  action: SCORE_ACTION;
};

@Component({
  selector: 'app-memory',
  imports: [CommonModule, TurnOnPipe, GameOverPipe],
  templateUrl: './memory.component.html',
  styleUrl: './memory.component.css',
})
export class MemoryComponent implements OnInit {
  @ViewChild('node1', { static: true }) node1!: ElementRef<HTMLDivElement>;
  @ViewChild('node2', { static: true }) node2!: ElementRef<HTMLDivElement>;
  @ViewChild('node3', { static: true }) node3!: ElementRef<HTMLDivElement>;
  @ViewChild('node4', { static: true }) node4!: ElementRef<HTMLDivElement>;
  @ViewChild('node5', { static: true }) node5!: ElementRef<HTMLDivElement>;
  @ViewChild('node6', { static: true }) node6!: ElementRef<HTMLDivElement>;
  @ViewChild('node7', { static: true }) node7!: ElementRef<HTMLDivElement>;
  @ViewChild('node8', { static: true }) node8!: ElementRef<HTMLDivElement>;
  @ViewChild('node9', { static: true }) node9!: ElementRef<HTMLDivElement>;

  @ViewChild('startButton', { static: true })
  startElement!: ElementRef<HTMLButtonElement>;

  deplayGameMsg$!: Observable<number>;

  memorySize$ = new BehaviorSubject<number>(3);

  delaySequenceMsg$!: Observable<number>;

  checkIfGameOver$!: Observable<boolean>;

  sequenceData$ = new Subject<Sequence>();

  level$!: Observable<number>;

  private random() {
    return Math.floor(Math.random() * Math.floor(8));
  }

  private gameOver(sequence: Sequence) {
    return from(sequence.userSequence).pipe(
      sequenceEqual(from(sequence.ramdomSequence))
    );
  }

  // private showSequenceToMemorize$ = (memorySize: number) => (randomSequence: number[]) =>
  //   interval(1000)
  //     .pipe(
  //       tap(i => setInfo(i === memorySize - 1 ? `YOUR TURN` : `${memorySize - i} elements`)),
  //       take(randomSequence.length),
  //       map(index => randomSequence[index]),
  //       tap(value => document.getElementById(`${value}`).click()),
  //       switchMap(takePlayerInput$(randomSequence))
  //     );

  ngOnInit(): void {
    const nodes = [
      this.node1,
      this.node2,
      this.node3,
      this.node4,
      this.node5,
      this.node6,
      this.node7,
      this.node8,
      this.node9,
    ];

    const startButtonClicked$ = fromEvent(
      this.startElement.nativeElement,
      'click'
    ).pipe(
      map(() => SCORE_ACTION.RESET),
      shareReplay(1)
    );

    const delayTime = 5;

    this.deplayGameMsg$ = startButtonClicked$.pipe(
      concatMap(() =>
        timer(0, 1000).pipe(
          take(delayTime + 1),
          map((v) => delayTime - v)
        )
      )
    );

    const deplayGameStart$ = startButtonClicked$.pipe(
      delay(delayTime * 1000),
      shareReplay(1)
    );

    this.delaySequenceMsg$ = deplayGameStart$.pipe(
      concatMap(() =>
        timer(0, 1000).pipe(
          take(this.memorySize$.getValue() + 1),
          map((v) => this.memorySize$.getValue() - v)
        )
      )
    );

    const elementClick = (event: string, color: string) => {
      return nodes.map(({ nativeElement }) => {
        return fromEvent(nativeElement, event).pipe(
          tap(() => {
            if (!color) {
              nativeElement.classList.remove('bg-secondary');
            } else {
              nativeElement.classList.add('bg-secondary');
            }
          })
        );
      });
    };

    const clickNodeArray$ = merge(
      ...elementClick('click', 'bg-secondary'),
      ...elementClick('transitionend', '')
    );

    const sequenceMemoryGame$ = this.memorySize$.pipe(
      concatMap((memorySize) =>
        generate(
          1,
          (x) => x <= memorySize,
          (x) => x + 1
        ).pipe(
          scan(
            (acc: Array<number>, cur: number) => [...acc, this.random() + 1],
            []
          ),
          sequenceToMemory(nodes),
          takePlayerInput(nodes),
          tap((sequenceData) => this.sequenceData$.next(sequenceData))
        )
      )
    );

    this.checkIfGameOver$ = merge(
      this.sequenceData$,
      startButtonClicked$.pipe(
        tap(() => {
          nodes.map((node) =>
            node.nativeElement.classList.remove('bg-secondary')
          );
        }),
        map(() => ({
          action: SCORE_ACTION.RESET,
          ramdomSequence: [],
          userSequence: [],
        }))
      )
    ).pipe(
      concatMap((sequence) =>
        combineLatest([this.gameOver(sequence as Sequence), of(sequence)]).pipe(
          map(
            ([match, value]) =>
              !match &&
              (value as Sequence).userSequence.length ===
                (value as Sequence).ramdomSequence.length
          )
        )
      )
    );

    this.level$ = this.sequenceData$.pipe(
      switchMap((sequence) => this.gameOver(sequence)),
      switchMap((result) =>
        combineLatest([of(result), of(this.memorySize$.getValue())]).pipe(
          map(([match, size]) => {
            if (match) {
              this.memorySize$.next(size + 1);
              return size + 1;
            }
            return size;
          })
        )
      ),
      startWith(this.memorySize$.getValue())
    );

    /**Create game loop */
    deplayGameStart$
      .pipe(
        switchMap(() =>
          merge(clickNodeArray$, sequenceMemoryGame$).pipe(
            takeUntil(
              this.checkIfGameOver$.pipe(filter((isGameOver) => isGameOver))
            )
          )
        )
      )
      .subscribe();
  }
}
