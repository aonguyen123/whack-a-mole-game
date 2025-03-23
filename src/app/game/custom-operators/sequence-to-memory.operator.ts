import { ElementRef } from '@angular/core';
import {
  filter,
  fromEvent,
  interval,
  map,
  merge,
  Observable,
  of,
  scan,
  switchMap,
  take,
  tap,
} from 'rxjs';
import { SCORE_ACTION } from './../memory/memory.enum';

export const sequenceToMemory =
  (elements: Array<ElementRef<HTMLDivElement>>) =>
  (source: Observable<Array<number>>) =>
    source.pipe(
      switchMap((randomSequence) =>
        interval(1000).pipe(
          take(randomSequence.length),
          map((index) => randomSequence[index]),
          tap((node) => {
            elements[node - 1].nativeElement.click();
          }),
          map((_, index) => ({
            action:
              randomSequence.length - (index + 1) !== 0
                ? SCORE_ACTION.NEXT
                : SCORE_ACTION.DONE,
            sequenceValue: randomSequence,
          }))
        )
      )
    );

export const takePlayerInput = (nodes: Array<ElementRef<HTMLDivElement>>) => {
  return (
    source: Observable<{ action: SCORE_ACTION; sequenceValue: Array<number> }>
  ) => {
    return source.pipe(
      filter((value) => value.action === SCORE_ACTION.DONE),
      switchMap((value) =>
        merge(...createNodeClick(nodes)).pipe(
          take(value.sequenceValue.length),
          scan((acc: number[], curr) => [...acc, curr], []),
          switchMap((userSequence) => {
            return of({
              ramdomSequence: value.sequenceValue,
              action: value.action,
              userSequence,
            });
          })
          // switchMap((result) => {
          //   if (result) {
          //     this.displayLevelChange();
          //     return this.memoryGame$(this.memorySize + 1);
          //   } else {
          //     return [];
          //   }
          // })
        )
      )
    );
  };
};

const createNodeClick = (nodes: Array<ElementRef<HTMLDivElement>>) =>
  nodes.map(({ nativeElement }, index) =>
    fromEvent(nativeElement, 'click').pipe(map(() => index + 1))
  );
