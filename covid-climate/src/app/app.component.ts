import {Component} from '@angular/core';
import {Co2Datapoint, Countries} from './core/models/co2data.model';
import {DataService} from './core/services/data.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'covid-climate';

  selectedCountry: Countries = Countries.spain;
  countryFilteredData: Co2Datapoint[];

  constructor(private dataService: DataService) {
  }

  onSelectCountry(country: Countries): void {
    console.log(country);
    this.selectedCountry = country;
    this.countryFilteredData = this.dataService.getCo2Data({countryFilter: [this.selectedCountry]});
  }
}
