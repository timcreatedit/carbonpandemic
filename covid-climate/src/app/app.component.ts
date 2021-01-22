import {Component} from '@angular/core';
import {Co2Datapoint, Countries, Sectors} from './core/models/co2data.model';
import {DataService} from './core/services/data.service';
import {fromEvent, Observable} from 'rxjs';
import {filter, map, tap} from 'rxjs/operators';
import {ScrollService} from './core/services/scroll.service';
import {CovidDatapoint} from './core/models/coviddata.model';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'covid-climate';

  selectedCountry: Countries = Countries.spain;

  selectedSector = 'All';
  sectorsToDisplay: Sectors[];

  worstCo2DayOf20: Co2Datapoint;
  covidOnWorstCo2DayOf20: CovidDatapoint;
  worstCovidDayOf20: CovidDatapoint;
  co2OnWorstCovidDayOf20: Co2Datapoint;

  sectorKeys = Object.keys(Sectors);
  sectorNames = Object.values(Sectors);

  scenario2Degree = false;
  prognosisGraphSum = true;

  budgetDepletionYearWithRestrictions: number;
  budgetDepletionYearWithoutRestrictions: number;

  constructor(
    private dataService: DataService,
    public scrollService: ScrollService,
  ) {
    this.scrollService.covidShowSectors$.pipe(
      filter(d => !d)
    ).subscribe(() => this.updateSelectedSector('All'));
  }

  onSelectCountry(country: Countries): void {
    this.selectedCountry = country;
    const co2Data20 = this.dataService.getCo2Data({countryFilter: [this.selectedCountry], yearFilter: [2020], sumSectors: true});
    const covidData20 = this.dataService.getCovidData({countryFilter: [this.selectedCountry], yearFilter: [2020]});

    this.worstCo2DayOf20 = co2Data20.sort((a, b) => b.mtCo2 - a.mtCo2)[0];
    this.covidOnWorstCo2DayOf20 = covidData20.filter(dp => dp.date.getTime() === this.worstCo2DayOf20.date.getTime())[0];

    this.worstCovidDayOf20 = covidData20.sort((a, b) => b.cases - a.cases)[0];
    this.co2OnWorstCovidDayOf20 = co2Data20.filter(dp => dp.date.getTime() === this.worstCovidDayOf20.date.getTime())[0];
  }

  updateSelectedSector(sector: string): void {
    this.selectedSector = sector;
    if (sector === 'All') {
      this.sectorsToDisplay = Object.values(Sectors);
    } else {
      this.sectorsToDisplay = [sector as Sectors];
    }
  }

  updateScenario(scenario2Degree: boolean): void {
    this.scenario2Degree = scenario2Degree;
    const totalBudget = this.dataService.getTotalEmissionsUntilYear(2020) + this.dataService.get2020RemainingBudget(this.scenario2Degree);
    this.budgetDepletionYearWithRestrictions = this.dataService.getDepletionYear(totalBudget, true);
    this.budgetDepletionYearWithoutRestrictions = this.dataService.getDepletionYear(totalBudget, false);
  }
}
