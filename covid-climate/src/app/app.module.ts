import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { CovidGraphComponent } from './covid-graph/covid-graph.component';
import { PrognosisGraphComponent } from './prognosis-graph/prognosis-graph.component';
import { TopBarComponent } from './top-bar/top-bar.component';
import { FormsModule } from '@angular/forms';
import { NgxSliderModule } from '@angular-slider/ngx-slider';
import {DecimalPipe} from '@angular/common';

@NgModule({
  declarations: [
    AppComponent,
    CovidGraphComponent,
    PrognosisGraphComponent,
    TopBarComponent,
  ],
    imports: [
        BrowserModule,
        FormsModule,
        NgxSliderModule,
    ],
  providers: [DecimalPipe],
  bootstrap: [AppComponent]
})
export class AppModule { }
