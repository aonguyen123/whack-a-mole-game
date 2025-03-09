import { APP_BASE_HREF, CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  Inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  BehaviorSubject,
  combineLatest,
  concatMap,
  delay,
  filter,
  fromEvent,
  map,
  merge,
  Observable,
  of,
  repeat,
  scan,
  shareReplay,
  startWith,
  Subscription,
  switchMap,
  take,
  takeUntil,
  tap,
  timer,
} from 'rxjs';
import { MoleItemComponent } from '../components/mole-item/mole-item.component';
import { peep, trackGameTime, whackAMole } from '../custom-operators';
import { RemainingTimePipe, WhackAMoleMessagePipe } from '../pipes';
import { SCORE_ACTION } from './mole.enum';
import { whackSound } from '../custom-operators/whack-sound.operator';

@Component({
  selector: 'app-mole',
  imports: [
    CommonModule,
    RemainingTimePipe,
    WhackAMoleMessagePipe,
    MoleItemComponent,
  ],
  templateUrl: 'mole.component.html',
  styleUrls: ['mole.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MoleComponent implements OnInit {
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

  @ViewChild('snap', { static: true }) snap!: ElementRef<HTMLAudioElement>;

  @ViewChild('soundBgGame', { static: true })
  soundBgGame!: ElementRef<HTMLAudioElement>;

  score$!: Observable<number>;
  hightScore$!: Observable<number>;
  timeLeft$!: Observable<number>;
  delayGameMsg$!: Observable<number>;
  subscription = new Subscription();
  lastHoleUpdated = new BehaviorSubject<number>(-1);
  disabledStartButton$!: Observable<boolean>;
  gameSound$!: Observable<any>;
  destroyRef = inject(DestroyRef);

  constructor(@Inject(APP_BASE_HREF) private readonly baseHref: string) {}

  get soundUrl() {
    return this.buildSound('whack');
  }

  get soundUrlBackgroundGame() {
    return this.buildSound('soundBackgroundGame');
  }

  private buildSound(sound: string) {
    const isEndWithSlash = this.baseHref.endsWith('/');
    return `${this.baseHref}${
      isEndWithSlash ? '' : '/'
    }assets/audio/${sound}.mp3`;
  }

  private createMoleClickedObservables(
    ...moles: ElementRef<HTMLDivElement>[]
  ): Observable<SCORE_ACTION>[] {
    return moles.map(({ nativeElement }) =>
      fromEvent(nativeElement, 'click').pipe(
        whackAMole(nativeElement),
        whackSound(this.snap.nativeElement)
      )
    );
  }

  ngOnInit(): void {
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
      startWith(0),
      shareReplay(1)
    );

    const delayTime = 5;
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

    const gameDuration = 60;
    const resetTime$ = startButtonClicked$.pipe(map(() => gameDuration));
    this.timeLeft$ = merge(
      resetTime$,
      delayGameStart$.pipe(trackGameTime(gameDuration))
    ).pipe(shareReplay(1));

    this.hightScore$ = combineLatest([this.timeLeft$, this.score$]).pipe(
      filter(([time, score]) => time === 0),
      switchMap(([time, score]) => {
        const t = Number(localStorage.getItem('score') || 0);
        if (score > t) {
          localStorage.setItem('score', score.toString());
          return of(score);
        }
        return of(t);
      }),
      startWith(Number(localStorage.getItem('score') || 0))
    );

    this.disabledStartButton$ = combineLatest([
      startButtonClicked$,
      this.timeLeft$,
    ]).pipe(
      map(([actionScore, timeLeft]) => {
        if (actionScore === SCORE_ACTION.RESET && timeLeft !== 0) {
          return true;
        }
        return false;
      })
    );

    /**Game sound setting */
    merge(
      startButtonClicked$,
      delayGameStart$.pipe(concatMap(() => timer(gameDuration * 1000)))
    )
      .pipe(
        tap((_) => {
          const sound = this.soundBgGame.nativeElement;
          sound.currentTime = 13;
          sound.loop = true;
          if (_ === SCORE_ACTION.RESET) {
            sound.play();
          }
          if (_ === 0) {
            sound.pause();
          }
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();

    /**Create game loop */

    const moles = [
      this.mole1,
      this.mole2,
      this.mole3,
      this.mole4,
      this.mole5,
      this.mole6,
    ];

    delayGameStart$
      .pipe(
        concatMap(() =>
          this.lastHoleUpdated.pipe(
            peep(moles, 350, 1000),
            takeUntil(timer(gameDuration * 1000))
          )
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }
}
