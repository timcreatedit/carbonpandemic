import {Injectable} from '@angular/core';
// @ts-ignore
import * as data from 'src/assets/datasets/data/carbon-monitor-maingraphdatas.json';
import {Co2Datapoint, Countries, Sectors} from '../models/co2data.model';


@Injectable({
  providedIn: 'root'
})
export class DataService {

  private readonly co2Datapoints: Co2Datapoint[] = [];

  constructor() {
    this.readCo2Data();
    console.log('All Data: ' + this.co2Datapoints.length);
  }

  /**
   * Reads the data from the carbon monitor json and parses it into an array.
   * @private
   */
  private readCo2Data(): void {
    data.datas.forEach(dp => {
      this.co2Datapoints.push({
        country: dp['country / group of countries'] as Countries,
        date: dp.date,
        sector: dp.sector as Sectors
        ,
        mtCo2: parseFloat(dp['MtCO2 per day']),
      } as Co2Datapoint);
    });
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
  }): Co2Datapoint[] {
    if (!filterOptions) { return this.co2Datapoints; }
    let filteredList: Co2Datapoint [] = this.co2Datapoints;
    if (filterOptions.countryFilter) {
      filteredList = filteredList.filter(dp => filterOptions.countryFilter.includes(dp.country));
    }
    if (filterOptions.sectorFilter) {
      filteredList = filteredList.filter(dp => filterOptions.sectorFilter.includes(dp.sector));
    }
    return filteredList;
  }
}
