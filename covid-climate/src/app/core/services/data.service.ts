import {Injectable} from '@angular/core';
// @ts-ignore
import * as data from 'src/assets/datasets/data/carbon-monitor-maingraphdatas.json';
import {Co2Datapoint, Countries, Sectors} from '../models/co2data.model';


@Injectable({
  providedIn: 'root'
})
export class DataService {

  private co2Datapoints: Co2Datapoint[] = [];

  constructor() {
    this.readCo2Data();
    console.log('All Data: ' + this.co2Datapoints.length);
    console.log('First Datapoint: ');
    console.log(this.co2Datapoints[0]);
  }

  /**
   * Reads the data from the carbon monitor json and parses it into an array.
   * @private
   */
  private readCo2Data(): void {

    data.datas.forEach(dp => {
      const dateValues = (dp.date).split('/').map(d => parseInt(d, 10));
      this.co2Datapoints.push({
        country: dp['country / group of countries'] as Countries,
        date: new Date(dateValues[2] < 2000 ? dateValues[2] + 2000 : dateValues[2], dateValues[1] - 1, dateValues[0]),
        sector: dp.sector as Sectors,
        mtCo2: parseFloat(dp['MtCO2 per day']),
      } as Co2Datapoint);
    });
    this.co2Datapoints = this.co2Datapoints.sort((a, b) => a.date as any - (b.date as any));
    console.log(this.co2Datapoints);
  }

  /**
   * Returns the dataset with potential filter options applied.
   * FilterOptions contains a Country and a Sectors array. If for example we want only Power Data for China, we could get it using
   * ```typescript
   * getCo2Data({countryFilter: [Countries.china], sectorFilter:[Sectors.power]});
   * ```
   * @param filterOptions Optional Filtering for dataset. If no filterOptions are provided, the whole dataset is returned.
   */
  public getCo2Data(filterOptions?: {
    countryFilter?: Countries[]
    sectorFilter?: Sectors[]
    yearFilter?: number[],
    sumSectors?: boolean,
  }): Co2Datapoint[] {
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
          sector: null,
          mtCo2: a.mtCo2 + b.mtCo2,
        } as Co2Datapoint;
      })));
    return countrySummed.reduce((a, b) => [...a, ...b], []);
  }

}

