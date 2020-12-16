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
  countryFilteredData: Co2Datapoint[];

  sectorKeys = Object.keys(Sectors);
  sectorNames = Object.values(Sectors);


  constructor(
    private dataService: DataService,
    public scrollService: ScrollService,
  ) {
  }

  onSelectCountry(country: Countries): void {
    console.log(country);
    this.selectedCountry = country;
    this.countryFilteredData = this.dataService.getCo2Data({countryFilter: [this.selectedCountry]});
  }
}
