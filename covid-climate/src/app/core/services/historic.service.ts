import { Injectable } from '@angular/core';
import {HistoricCo2Datapoint, PrognosisDataIndicators} from '../models/data/historicco2data.model';
import {FilterOptions} from './data.service';
import * as historicCo2Dataset from '../../../assets/datasets/data/historical_co2_data_whole_world.json';
import {Countries} from '../models/data/co2data.model';

@Injectable({
  providedIn: 'root'
})
export class HistoricService {

  private historicCo2Datapoints: HistoricCo2Datapoint[] = [];

  constructor() {
    this.readHistoricCo2Data();
  }

  private readHistoricCo2Data(): void {
    let sumBuffer = 0;
    let sumBufferLockdown = 0;
    let sumBufferNoLockdown = 0;
    const uniqueYears = new Set((historicCo2Dataset as any).Tabelle1.map(d => d.Year));
    uniqueYears.forEach(year => {
      const dps = (historicCo2Dataset as any).Tabelle1.filter(d => d.Year === year);
      if (dps.length === 0 || dps.length > 2) {
        throw new Error('Too many historic datapoints for year ' + year);
      }
      const historicDp = dps.filter(d => d.PrognosisData === 'historic')[0];
      const prognosisDp = dps.filter(d => d.PrognosisData === 'prognosis')[0];
      const isLeapYear = !(dps[0].Year % 4 !== 0 || (dps[0].Year % 100 === 0 && dps[0].Year % 400 !== 0));

      const addedCo2: number = historicDp ? (parseFloat(historicDp.meandailyCO2) * (isLeapYear ? 364 : 365)) : 0;
      sumBuffer += addedCo2;

      const addedCo2Lockdown = prognosisDp ? (parseFloat(prognosisDp.CO2WithLockdowns) * (isLeapYear ? 364 : 365)) : addedCo2;
      sumBufferLockdown += addedCo2Lockdown;

      const addedCo2NoLockdown = prognosisDp ? (parseFloat(prognosisDp.CO2WithoutLockdowns) * (isLeapYear ? 364 : 365)) : addedCo2;
      sumBufferNoLockdown += addedCo2NoLockdown;

      dps.forEach(dp => this.historicCo2Datapoints.push({
        country: Countries.world, // the dataset used right now only contains world data; subject of discussion!
        year: parseInt(dp.Year, 10),
        mtCo2: parseFloat(dp.meandailyCO2),
        co2Sum: sumBuffer,
        co2PrognosisLockdown: parseFloat(dp.CO2WithLockdowns),
        co2SumLockdown: sumBufferLockdown,
        co2PrognosisNoLockdown: parseFloat(dp.CO2WithoutLockdowns),
        co2SumNoLockdown: sumBufferNoLockdown,
        prognosisDataIndicator: dp.PrognosisData,
      } as HistoricCo2Datapoint));

    });
  }

  public getHistoricCo2Data(filterOptions?: FilterOptions): HistoricCo2Datapoint[] {
    if (!filterOptions) {
      return this.historicCo2Datapoints;
    }
    let filteredList: HistoricCo2Datapoint [] = this.historicCo2Datapoints;
    if (filterOptions.prognosisDataFilter) {
      filteredList = filteredList.filter(dp => filterOptions.prognosisDataFilter.includes(dp.prognosisDataIndicator));
    }
    return filteredList;
  }

  public getTotalEmissionsUntilYear(year: number): number {
    return this.historicCo2Datapoints
      .filter(dp => dp.year === year && dp.prognosisDataIndicator === PrognosisDataIndicators.historic)
      [0].co2Sum;
  }

  public get2020RemainingBudget(scenario2Degree: boolean): number {
    return scenario2Degree ? 1042800 : 293000;
  }

  public getDepletionYear(totalBudget: number, lockdowns: boolean): number {
    const data = this.historicCo2Datapoints;

    return lockdowns
      ? data.filter(dp => dp.co2SumLockdown > totalBudget)[0].year
      : data.filter(dp => dp.co2SumNoLockdown > totalBudget)[0].year;
  }
}
