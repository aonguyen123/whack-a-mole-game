import { Component } from '@angular/core';
import { MoleComponent } from './game/game/mole/mole.component';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-root',
  imports: [MoleComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  constructor(private readonly title: Title) {
    this.title.setTitle('whack-a-mole-game');
  }
}
