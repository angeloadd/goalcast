import {Component} from '@angular/core';
import {RouterOutlet} from '@angular/router';

@Component({
  selector: 'fb-root',
  imports: [RouterOutlet],
  template: `
    <div class="container">
      <div class="flex">
        <main class="flex-1 min-w-0 py-8">
          <router-outlet/>
        </main>
      </div>
    </div>`,
})
export class App {
}
