import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { CovidGraphComponent } from './covid-graph/covid-graph.component';
import { PieChartComponent } from './pie-chart/pie-chart.component';
import { PrognosisGraphComponent } from './prognosis-graph/prognosis-graph.component';
import { TopBarComponent } from './top-bar/top-bar.component';

@NgModule({
  declarations: [
    AppComponent,
    CovidGraphComponent,
    PieChartComponent,
    PrognosisGraphComponent,
    TopBarComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
