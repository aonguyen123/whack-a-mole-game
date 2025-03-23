import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Observable, fromEvent, interval, merge, generate, from } from 'rxjs';
import {
  map,
  pluck,
  scan,
  switchMap,
  take,
  tap,
  sequenceEqual,
} from 'rxjs/operators';

@Component({
  selector: 'app-memory-game',
  templateUrl: './memory.component.html',
  styleUrls: ['./memory.component.css'],
  imports: [CommonModule],
})
export class MemoryComponent12 implements OnInit {
  public gameOver: boolean = false;
  public info: string = '';
  public randomSequence: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  public userSequence: number[] = [];
  public memorySize: number = 2;
  public level: number = 1;

  constructor() {}

  ngOnInit(): void {
    this.startGame();
  }

  random(): number {
    return Math.floor(Math.random() * 8);
  }

  setInfo(text: string): void {
    this.info = text;
  }

  displayLevelChange(): void {
    // Trigger level change effects here if needed, like updating the UI
  }

  checkIfGameOver$(
    randomSequence: number[]
  ): (userSequence: number[]) => Observable<boolean> {
    return (userSequence: number[]) =>
      from(userSequence).pipe(
        sequenceEqual(from(randomSequence)),
        tap((match) => {
          if (!match && userSequence.length === randomSequence.length) {
            this.setInfo('GAME OVER!');
            this.gameOver = true;
          }
        })
      );
  }

  takePlayerInput$(randomSequence: number[]): Observable<any> {
    return fromEvent(document, 'click').pipe(
      take(randomSequence.length),
      scan(
        (acc: number[], curr: any) => [...acc, parseInt(curr.target['id'])],
        []
      ),
      switchMap((userSequence) =>
        this.checkIfGameOver$(randomSequence)(userSequence)
      ),
      switchMap((result) => {
        if (result) {
          this.displayLevelChange();
          return this.memoryGame$(this.memorySize + 1);
        } else {
          return [];
        }
      })
    );
  }

  showSequenceToMemorize$(
    memorySize: number
  ): (randomSequence: number[]) => Observable<any> {
    return (randomSequence: number[]) =>
      interval(1000).pipe(
        tap((i) =>
          this.setInfo(
            i === memorySize - 1 ? `YOUR TURN` : `${memorySize - i} elements`
          )
        ),
        take(randomSequence.length),
        map((index) => randomSequence[index]),
        tap((value) => this.clickElement(value)),
        switchMap(() => this.takePlayerInput$(randomSequence))
      );
  }

  memoryGame$(memorySize: number): Observable<any> {
    return generate(
      1,
      (x) => x <= memorySize,
      (x) => x + 1
    ).pipe(
      scan(
        (acc: number[], _: number): number[] => [...acc, this.random() + 1],
        []
      ),
      switchMap((randomSequence) =>
        this.showSequenceToMemorize$(memorySize)(randomSequence)
      )
    );
  }

  clickElement(value: number): void {
    const element = document.getElementById(value.toString());
    if (element) {
      element.click();
    }
  }

  elementClick$(event: string, color: string): Observable<any> {
    return fromEvent(document.querySelectorAll('.child'), event).pipe(
      pluck('srcElement'),
      tap((e: any) => (e.style.background = color))
    );
  }

  startGame(): void {
    const clicks$ = merge(
      this.elementClick$('click', 'lightgray'),
      this.elementClick$('transitionend', 'white')
    );
    const game$ = merge(clicks$, this.memoryGame$(this.memorySize));
    game$.subscribe();
  }
}
