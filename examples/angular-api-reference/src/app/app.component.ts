import { Component } from '@angular/core'
import { ApiReferenceAngularComponent } from '@scalar/api-reference-angular'

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ApiReferenceAngularComponent],
  templateUrl: './app.component.html',
})
export class AppComponent {}
