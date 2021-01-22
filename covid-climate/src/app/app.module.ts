import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { CovidGraphComponent } from './covid-graph/covid-graph.component';
import { PieChartComponent } from './pie-chart/pie-chart.component';
import { PrognosisGraphComponent } from './prognosis-graph/prognosis-graph.component';
import { TopBarComponent } from './top-bar/top-bar.component';
import { FormsModule } from '@angular/forms';
import { NgxSliderModule } from '@angular-slider/ngx-slider';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';

@NgModule({
  declarations: [
    AppComponent,
    CovidGraphComponent,
    PieChartComponent,
    PrognosisGraphComponent,
    TopBarComponent,
  ],
    imports: [
        BrowserModule,
        FormsModule,
        NgxSliderModule,
        MatButtonModule,
        MatButtonToggleModule
    ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
