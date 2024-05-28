import {
  type AfterViewInit,
  Component,
  type ElementRef,
  ViewChild,
} from '@angular/core'
import { ApiReference, type ReferenceProps } from '@scalar/api-reference'
import { createApp } from 'vue'

import { spec } from './spec'

@Component({
  selector: 'scalar-api-reference-angular',
  standalone: true,
  imports: [],
  template: ` <div #scalar></div> `,
  styles: ``,
})
export class ApiReferenceAngularComponent implements AfterViewInit {
  @ViewChild('scalar', { static: false }) scalar!: ElementRef<HTMLDivElement>

  title = 'api-reference-angular'

  ngAfterViewInit() {
    if (!this.scalar)
      console.error('Missing mounting ref for Scalar References')
    console.log(this.scalar)

    const props: ReferenceProps = {
      configuration: {
        spec: {
          content: spec,
        },
      },
    }
    const app = createApp(ApiReference, props)
    app.mount(this.scalar.nativeElement)
  }
}
