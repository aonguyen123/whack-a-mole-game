// export const takePlayerInput = () => {
//     return
// }

// const takePlayerInput$ = (randomSequence: number[]) => (_) =>
//     fromEvent(document, 'click').pipe(
//       take(randomSequence.length),
//       scan(
//         (acc: number[], curr: MouseEvent) => [
//           ...acc,
//           parseInt(curr.target['id']),
//         ],
//         []
//       ),
//       switchMap(checkIfGameOver$(randomSequence)),
//       switchMap((result) =>
//         result
//           ? (displayLevelChange(), memoryGame$(randomSequence.length + 1))
//           : EMPTY
//       )
//     );
