import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'whack-mole',
    pathMatch: 'full',
  },
  {
    path: 'whack-mole',
    loadComponent: () =>
      import('./game/mole/mole.component').then((c) => c.MoleComponent),
  },
  {
    path: 'memory',
    loadComponent: () =>
      import('./game/memory/memory.component').then((c) => c.MemoryComponent),
  },
];
