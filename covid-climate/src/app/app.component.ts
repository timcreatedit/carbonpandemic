import {Component} from '@angular/core';
import {Co2Datapoint, Countries, Sectors} from './core/models/co2data.model';
import {DataService} from './core/services/data.service';
import {fromEvent, Observable} from 'rxjs';
import {map, tap} from 'rxjs/operators';
import {ScrollService} from './core/services/scroll.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'covid-climate';

  selectedCountry: Countries = Countries.spain;
  worstDayOf20: Co2Datapoint;

  sectorKeys = Object.keys(Sectors);
  sectorNames = Object.values(Sectors);


  constructor(
    private dataService: DataService,
    public scrollService: ScrollService,
  ) {
  }

  onSelectCountry(country: Countries): void {
    this.selectedCountry = country;
    const data20 = this.dataService.getCo2Data({countryFilter: [this.selectedCountry], yearFilter: [2020], sumSectors: true});
    this.worstDayOf20 = data20.sort((a, b) => a.mtCo2 - b.mtCo2)[0];
  }
}
