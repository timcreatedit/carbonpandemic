import {Injectable} from '@angular/core';
// @ts-ignore
import * as data from 'src/assets/datasets/data/carbon-monitor-maingraphdatas.json';
import * as records from 'src/assets/datasets/data/COVID-19 cases worldwide.json';
import {Co2Datapoint, Countries, Sectors} from '../models/co2data.model';
import * as d3 from 'd3';
import {CovidDatapoint} from '../models/coviddata.model';

export interface FilterOptions {
  countryFilter?: Countries[];
  sectorFilter?: Sectors[];
  yearFilter?: number[];
  sumSectors?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class DataService {

  constructor() {
    this.readCo2Data();
    this.readCovidData();
    console.log('All Data: ' + this.co2Datapoints.length);
    console.log('First Datapoint: ');
    console.log(this.co2Datapoints[0]);
    console.log((this.covidDatapoints[0]));
  }

  private co2Datapoints: Co2Datapoint[] = [];
  private covidDatapoints: CovidDatapoint[] = [];
  private maxDate: Date;

  private static covidCountryToCountry(country: string): Countries{
    if (country === 'United_Kingdom') {
      return Countries.uk;
    }
    else if (country === 'United_States_of_America'){
      return Countries.us;
    }
    return country as Countries;
  }


  /**
   * Reads the data from the carbon monitor json and parses it into an array.
   * @private
   */
  private readCo2Data(): void {

    (data as any).datas.forEach(dp => {
      const dateValues = (dp.date).split('/').map(d => parseInt(d, 10));
      this.co2Datapoints.push({
        country: dp['country / group of countries'] as Countries,
        date: new Date(dateValues[2] < 2000 ? dateValues[2] + 2000 : dateValues[2], dateValues[1] - 1, dateValues[0]),
        sector: dp.sector as Sectors,
        mtCo2: parseFloat(dp['MtCO2 per day']),
      } as Co2Datapoint);
    });
    this.co2Datapoints = this.co2Datapoints.sort((a, b) => a.date as any - (b.date as any));
    this.maxDate = d3.max(this.co2Datapoints.map(d => d.date));
    console.log(this.co2Datapoints);
  }

  private readCovidData(): void {
    (records as any).records.forEach(dp => {
      const dateValues = (dp.dateRep).split('/').map(d => parseInt(d, 10));
      const actualDate = new Date(dateValues[2], dateValues[1] - 1, dateValues[0]);
      if (actualDate <= this.maxDate)
      {
        this.covidDatapoints.push({
          country: DataService.covidCountryToCountry(dp.countriesAndTerritories),
          date: actualDate,
          cases: dp.cases,
          continent: dp.continentExp,
        } as CovidDatapoint);
      }
    });
    this.covidDatapoints = this.covidDatapoints.sort((a, b) => a.date as any - (b.date as any));
  }

  /**
   * Returns the dataset with potential filter options applied.
   * FilterOptions contains a Country and a Sectors array. If for example we want only Power Data for China, we could get it using
   * ```typescript
   * getCo2Data({countryFilter: [Countries.china], sectorFilter:[Sectors.power]});
   * ```
   * @param filterOptions Optional Filtering for dataset. If no filterOptions are provided, the whole dataset is returned.
   */
  public getCo2Data(filterOptions?: FilterOptions): Co2Datapoint[] {
    if (!filterOptions) {
      return this.co2Datapoints;
    }
    let filteredList: Co2Datapoint [] = this.co2Datapoints;
    if (filterOptions.countryFilter) {
      filteredList = filteredList.filter(dp => filterOptions.countryFilter.includes(dp.country));
    }
    if (filterOptions.sectorFilter) {
      filteredList = filteredList.filter(dp => filterOptions.sectorFilter.includes(dp.sector));
    }
    if (filterOptions.yearFilter) {
      filteredList = filteredList.filter(dp => filterOptions.yearFilter.includes(dp.date.getFullYear()));
    }
    return filterOptions.sumSectors ? this.sumSectors(filteredList) : filteredList;
  }

  public getCovidData(filterOptions?: FilterOptions): CovidDatapoint[] {
    if (!filterOptions) {
      return this.covidDatapoints;
    }
    let filteredList: CovidDatapoint [] = this.covidDatapoints;
    if (filterOptions.countryFilter) {
      filteredList = filteredList.filter(dp => filterOptions.countryFilter.includes(dp.country));
    }
    return filteredList;
  }

  private sumSectors(datapoints: Co2Datapoint[]): Co2Datapoint[] {
    if (datapoints.length < 2) {
      return datapoints;
    }
    const dates = new Set<number>(datapoints.map(dp => dp.date.getTime()));
    const datesArray = Array.from(dates).map(t => new Date(t));
    const dailyPoints = datesArray.map(date => datapoints.filter(dp => dp.date.getTime() === date.getTime()));
    const relevantCountries = Object.values(Countries)
      .filter(c => datapoints.map(dp => dp.country).includes(c));
    const countrySummed = relevantCountries.map(c => dailyPoints
      .map(dps => dps.filter(dp => dp.country === c).reduce((a, b) => {
        return {
          ...a,
          sector: undefined,
          mtCo2: a.mtCo2 + b.mtCo2,
        } as Co2Datapoint;
      })));
    return countrySummed.reduce((a, b) => [...a, ...b], []);
  }

  public getSectorsPerDay(country: Countries): {[id: string]: number | Date}[] {
    const d = this.getCo2Data({countryFilter: [country], yearFilter: [2020]});
    const dates = Array.from(new Set<number>(d.map(dp => dp.date.getTime())));
    const days = dates.map(date => d.filter(dp => dp.date.getTime() === date));
    const sectorsPerDay = days.map(day => day.map(dp => dp.sector));
    console.assert(days.length === sectorsPerDay.length);
    const buffer: {[id: string]: number | Date}[] = [];
    for (let i = 0; i < dates.length; i++) {
      const val = { ['date']: dates[i]};
      for (const sector of sectorsPerDay[i]) {
        val[sector.valueOf()] = days[i].filter(dp => dp.sector === sector)[0].mtCo2;
      }
      buffer.push(val);
    }
    return buffer;
  }
}

