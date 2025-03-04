import { APP_BASE_HREF, CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Inject,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  BehaviorSubject,
  Observable,
  Subscription,
  concatMap,
  delay,
  fromEvent,
  map,
  merge,
  scan,
  shareReplay,
  startWith,
  take,
  takeUntil,
  tap,
  timer,
} from 'rxjs';
import { peep, trackGameTime, whackAMole } from '../custom-operators';
import { RemainingTimePipe, WhackAMoleMessagePipe } from '../pipes';
import { SCORE_ACTION } from './mole.enum';

@Component({
  selector: 'app-mole',
  imports: [CommonModule, RemainingTimePipe, WhackAMoleMessagePipe],
  templateUrl: 'mole.component.html',
  styleUrls: ['mole.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MoleComponent implements OnInit, OnDestroy {
  @ViewChild('start', { static: true, read: ElementRef })
  startButton!: ElementRef<HTMLButtonElement>;

  @ViewChild('hole1', { static: true, read: ElementRef })
  hole1!: ElementRef<HTMLDivElement>;

  @ViewChild('hole2', { static: true, read: ElementRef })
  hole2!: ElementRef<HTMLDivElement>;

  @ViewChild('hole3', { static: true, read: ElementRef })
  hole3!: ElementRef<HTMLDivElement>;

  @ViewChild('hole4', { static: true, read: ElementRef })
  hole4!: ElementRef<HTMLDivElement>;

  @ViewChild('hole5', { static: true, read: ElementRef })
  hole5!: ElementRef<HTMLDivElement>;

  @ViewChild('hole6', { static: true, read: ElementRef })
  hole6!: ElementRef<HTMLDivElement>;

  /**Mole */
  @ViewChild('mole1', { static: true, read: ElementRef })
  mole1!: ElementRef<HTMLDivElement>;

  @ViewChild('mole2', { static: true, read: ElementRef })
  mole2!: ElementRef<HTMLDivElement>;

  @ViewChild('mole3', { static: true, read: ElementRef })
  mole3!: ElementRef<HTMLDivElement>;

  @ViewChild('mole4', { static: true, read: ElementRef })
  mole4!: ElementRef<HTMLDivElement>;

  @ViewChild('mole5', { static: true, read: ElementRef })
  mole5!: ElementRef<HTMLDivElement>;

  @ViewChild('mole6', { static: true, read: ElementRef })
  mole6!: ElementRef<HTMLDivElement>;

  score$!: Observable<number>;
  timeLeft$!: Observable<number>;
  delayGameMsg$!: Observable<number>;
  subscription = new Subscription();
  lastHoleUpdated = new BehaviorSubject<number>(-1);

  constructor(@Inject(APP_BASE_HREF) private readonly baseHref: string) {}

  get moleSrc(): string {
    return this.buildImage('mole.svg');
  }

  get holeSrc(): string {
    return this.buildImage('dirt.svg');
  }

  private buildImage(image: string) {
    const isEndWithSlash = this.baseHref.endsWith('/');
    console.log(this.baseHref);

    const imagePath = `${this.baseHref}${
      isEndWithSlash ? '' : '/'
    }assets/images/${image}`;

    return `url('${imagePath}')`;
  }

  private createMoleClickedObservables(
    ...moles: ElementRef<HTMLDivElement>[]
  ): Observable<SCORE_ACTION>[] {
    return moles.map(({ nativeElement }) =>
      fromEvent(nativeElement, 'click').pipe(whackAMole(nativeElement))
    );
  }

  ngOnInit(): void {
    // this.score$ = of(0);
    // this.delayGameMsg$ = of(3);
    // this.timeLeft$ = of(10);

    const molesClickedArray$ = this.createMoleClickedObservables(
      this.mole1,
      this.mole2,
      this.mole3,
      this.mole4,
      this.mole5,
      this.mole6
    );
    const startButtonClicked$ = fromEvent(
      this.startButton.nativeElement,
      'click'
    ).pipe(
      map(() => SCORE_ACTION.RESET),
      shareReplay(1)
    );

    this.score$ = merge(...molesClickedArray$, startButtonClicked$).pipe(
      scan(
        (score, action) => (action === SCORE_ACTION.RESET ? 0 : score + 1),
        0
      ),
      startWith(0)
    );

    const delayTime = 3;
    this.delayGameMsg$ = startButtonClicked$.pipe(
      concatMap(() =>
        timer(0, 1000).pipe(
          take(delayTime + 1),
          map((value) => delayTime - value)
        )
      )
    );

    const delayGameStart$ = startButtonClicked$.pipe(
      delay(delayTime * 1000),
      shareReplay(1)
    );

    const gameDuration = 10;
    const resetTime$ = startButtonClicked$.pipe(map(() => gameDuration));
    this.timeLeft$ = merge(
      resetTime$,
      delayGameStart$.pipe(trackGameTime(gameDuration))
    );

    /**Create game loop */

    const moles = [
      this.mole1,
      this.mole2,
      this.mole3,
      this.mole4,
      this.mole5,
      this.mole6,
    ];

    const createGame = delayGameStart$
      .pipe(
        concatMap(() =>
          this.lastHoleUpdated.pipe(
            peep(moles, 350, 1000),
            takeUntil(timer(gameDuration * 1000))
          )
        )
      )
      .subscribe();

    this.subscription.add(createGame);
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
