import {Injectable} from '@angular/core';
// @ts-ignore
import * as co2dataset from 'src/assets/datasets/data/co2-data.json';
import * as covidDataset from 'src/assets/datasets/data/COVID-19 cases worldwide.json';
import * as lockdownDataset from 'src/assets/datasets/data/lockdown-data.json';
import * as historicCo2Dataset from 'src/assets/datasets/data/historical_co2_data_whole_world.json';
import {Co2Datapoint, Countries, Sectors} from '../models/co2data.model';
import {CovidDatapoint} from '../models/coviddata.model';
import {LockdownDatapoint} from '../models/lockdowndata.model';
import {HistoricCo2Datapoint, PrognosisDataIndicators} from '../models/historicco2data.model';
import * as d3 from 'd3';

export interface FilterOptions {
  countryFilter?: Countries[];
  sectorFilter?: Sectors[];
  yearFilter?: number[];
  sumSectors?: boolean;
  prognosisDataFilter?: PrognosisDataIndicators[];
}

@Injectable({
  providedIn: 'root'
})
export class DataService {

  private co2Datapoints: Co2Datapoint[] = [];

  private covidDatapoints: CovidDatapoint[] = [];
  private lockdownDatapoints: LockdownDatapoint[] = [];
  private historicCo2Datapoints: HistoricCo2Datapoint[] = [];
  private covidEuropeDatapoints: CovidDatapoint[] = [];
  private maxDate: Date;
  private maxPerCapita: number;

  private eu28 = [Countries.france, Countries.germany, Countries.italy, Countries.spain, Countries.uk, 'Austria', 'Belgium', 'Bulgaria', 'Croatia', 'Cyprus', 'Czechia', 'Denmark', 'Estonia', 'Finland', 'Greece', 'Hungary', 'Ireland', 'Latvia', 'Lithuania', 'Luxembourg', 'Malta', 'Netherlands', 'Poland', 'Portugal', 'Romania', 'Slovakia', 'Slovenia', 'Sweden'];

  constructor() {
    this.readCo2Data();
    this.readCovidData();
    this.readLockdownData();
    this.readHistoricCo2Data();
    this.combineCovidDataForWorld();
    this.combineCovidDataForEU28();
    this.combineCovidDataForRestOfWorld();
    // this.readMaxPerCapita();
    console.log('All Data: ' + this.co2Datapoints.length);
    console.log('First Datapoint: ');
    console.log(this.co2Datapoints[0]);
    console.log((this.covidDatapoints));
    console.log((this.lockdownDatapoints[0]));
    console.log(this.covidEuropeDatapoints);
    console.log('Population Rest: ' + this.getPopulation(Countries.rest));
    console.log('Population World: ' + this.getPopulation(Countries.world));
    console.log('Population EU28: ' + this.getPopulation(Countries.eu28));
  }


  // region Initialization

  /**
   * Reads the data from the carbon monitor json and parses it into an array.
   * @private
   */
  private readCo2Data(): void {

    (co2dataset as any).datas.forEach(dp => {
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
  }

  private readCovidData(): void {
    (covidDataset as any).records.forEach(dp => {
      const dateValues = (dp.dateRep).split('/').map(d => parseInt(d, 10));
      const actualDate = new Date(dateValues[2], dateValues[1] - 1, dateValues[0]);
      if (actualDate <= this.maxDate) {
        this.covidDatapoints.push({
          country: this.covidCountryToCountry(dp.countriesAndTerritories),
          date: actualDate,
          cases: dp.cases,
          continent: dp.continentExp,
          population: dp.popData2019,
        } as CovidDatapoint);
      }
    });
    this.covidDatapoints = this.covidDatapoints.sort((a, b) => a.date as any - (b.date as any));
  }

  private combineCovidDataForWorld(): void {
    const holder = {};
    const holderPopulation = {};
    const dates = [];
    (this.covidDatapoints as any).forEach(dp => {
      if (holder.hasOwnProperty(dp.date)) {
        holder[dp.date] = holder[dp.date] + dp.cases;
        holderPopulation[dp.date] = holderPopulation[dp.date] + dp.population;
      } else {
        holder[dp.date] = dp.cases;
        holderPopulation[dp.date] = dp.population;
        dates.push(dp.date);
      }
    });

    for (const date of dates) {
      this.covidDatapoints.push({
        country: Countries.world,
        date,
        cases: holder[date],
        population: holderPopulation[date],
      } as CovidDatapoint);
    }

    this.covidDatapoints = this.covidDatapoints.sort((a, b) => a.date as any - (b.date as any));
  }

  private combineCovidDataForRestOfWorld(): void {
    const holder = {};
    const holderPopulation = {};
    const dates = [];
    (this.covidDatapoints as any).forEach(dp => {
      if (!Object.values(Countries).includes(dp.country)) {
          if (holder.hasOwnProperty(dp.date)) {
            holder[dp.date] = holder[dp.date] + dp.cases;
            holderPopulation[dp.date] = holderPopulation[dp.date] + dp.population;
          } else {
            holder[dp.date] = dp.cases;
            holderPopulation[dp.date] = dp.population;
            dates.push(dp.date);
          }
      }
    });

    for (const date of dates) {
      this.covidDatapoints.push({
        country: Countries.rest,
        date,
        cases: holder[date],
        population: holderPopulation[date],
      } as CovidDatapoint);
    }

    this.covidDatapoints = this.covidDatapoints.sort((a, b) => a.date as any - (b.date as any));
  }

  private combineCovidDataForEU28(): void {
    const holderEurope = {};
    const holderPopulation = {};
    const dates = [];
    (this.covidDatapoints as any).forEach(dp => {
      if (this.eu28.includes(dp.country)) {
        if (holderEurope.hasOwnProperty(dp.date)) {
          holderEurope[dp.date] = holderEurope[dp.date] + dp.cases;
          holderPopulation[dp.date] = holderPopulation[dp.date] + dp.population;
        } else {
          holderEurope[dp.date] = dp.cases;
          holderPopulation[dp.date] = dp.population;
          dates.push(dp.date);
        }
      }
    });

    for (const date of dates) {
      this.covidDatapoints.push({
        country: Countries.eu28,
        date,
        cases: holderEurope[date],
        population: holderPopulation[date],
      } as CovidDatapoint);
    }

    this.covidDatapoints = this.covidDatapoints.sort((a, b) => a.date as any - (b.date as any));
  }

  private readLockdownData(): void {
    (lockdownDataset as any).lockdowndata.forEach(dp => {
      const dateString = dp.date.toString();
      const dateValues = [dateString.slice(0, 4), dateString.slice(4, 6), dateString.slice(6, 8)].map(d => parseInt(d, 10));
      const actualDate = new Date(dateValues[0], dateValues[1] - 1, dateValues[2]);
      if (actualDate <= this.maxDate) {
        this.lockdownDatapoints.push({
          date: actualDate,
          country: this.covidCountryToCountry(dp.countryName),
          lockdown: (dp.c6_Stay_at_home_requirements >= 2),
        } as LockdownDatapoint);
      }
    });
    this.lockdownDatapoints = this.lockdownDatapoints.sort((a, b) => a.date as any - (b.date as any));
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

  private readMaxPerCapita(): void {
    const perCapitas = [];
    (this.co2Datapoints as any).forEach(dp => {
      if (Object.values(Countries).includes(dp.country)) {
        const population = this.getPopulation(dp.country);
        perCapitas.push((dp.mtCo2 / population));
      }
    });
    this.maxPerCapita = Math.max(...perCapitas);
  }

  // endregion

  // region Public Data Accessors

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

  public getLockdownData(filterOptions?: FilterOptions): LockdownDatapoint[] {
    if (!filterOptions) {
      return this.lockdownDatapoints;
    }
    let filteredList: LockdownDatapoint [] = this.lockdownDatapoints;
    if (filterOptions.countryFilter) {
      filteredList = filteredList.filter(dp => filterOptions.countryFilter.includes(dp.country));
    }
    return filteredList;
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
      .filter(dp => dp.year === 2020 && dp.prognosisDataIndicator === PrognosisDataIndicators.historic)
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

  public getSectorsPerDay(
    country: Countries,
    sectors: Sectors[] = Object.values(Sectors),
    showAbsolute: string,
    setRemainingToZero = false
  ): { [id: string]: number | Date }[] {
    const d = this.getCo2Data({countryFilter: [country], yearFilter: [2020]});
    const dates = Array.from(new Set<number>(d.map(dp => dp.date.getTime())));
    const days = dates.map(date => d.filter(dp => dp.date.getTime() === date));
    const sectorsPerDay = days.map(day => day.map(dp => dp.sector));
    const buffer: { [id: string]: number | Date }[] = [];

    // For Relative Data
    const dataWorld20 = this.getCo2Data({
      yearFilter: [2020],
      countryFilter: [Countries.world],
      sumSectors: true,
    });

    const population = this.getPopulation(country);

    for (let i = 0; i < dates.length; i++) {
      const val = {['date']: new Date(dates[i])};
      for (const sector of sectorsPerDay[i]) {
        if (!sectors.includes(sector)) {
          if (setRemainingToZero) {
            val[sector.valueOf()] = 0;
          }
          continue;
        }

        // RELATIVE DATA
        switch (showAbsolute) {
          case 'absolute':
            val[sector.valueOf()] = days[i].filter(dp => dp.sector === sector)[0].mtCo2;
            break;
          case 'relativeToWorld':
            val[sector.valueOf()] = days[i].filter(dp => dp.sector === sector)[0].mtCo2 / dataWorld20[i].mtCo2 * 100;
            break;
          case 'relativeToPopulation':
            val[sector.valueOf()] = days[i].filter(dp => dp.sector === sector)[0].mtCo2 / population * 1000000;
            break;
          default:
            console.log('none');
            break;
        }
        // END RELATIVE DATA

        }

      buffer.push(val);
    }
    return buffer;
  }


  public getPopulation(selectedCountry: Countries): number {
    const filteredList = this.getCovidData({countryFilter: [selectedCountry]});
    return filteredList[filteredList.length - 1].population;
  }


  // endregion

  //region Helpers

  private covidCountryToCountry(country: string): Countries {
    if (country === 'United_Kingdom' || country === 'United Kingdom') {
      return Countries.uk;
    } else if (country === 'United_States_of_America' || country === 'United States') {
      return Countries.us;
    }
    return country as Countries;
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

  public getMaxPerCapita(): number {
    return this.maxPerCapita;
  }

  //endregion
}

