import {Injectable} from '@angular/core';
// @ts-ignore
import * as co2dataset from 'src/assets/datasets/data/co2-data.json';
import * as covidDataset from 'src/assets/datasets/data/COVID-19 cases worldwide.json';
import * as lockdownDataset from 'src/assets/datasets/data/lockdown-data.json';
import * as historicCo2Dataset from 'src/assets/datasets/data/historical_co2_data_whole_world.json';
import {Co2Datapoint, Countries, Sectors} from '../models/data/co2data.model';
import {CovidDatapoint} from '../models/data/coviddata.model';
import {LockdownDatapoint} from '../models/data/lockdowndata.model';
import {HistoricCo2Datapoint, PrognosisDataIndicators} from '../models/data/historicco2data.model';
import * as d3 from 'd3';
import {CountryService} from './country.service';

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
  private covidEuropeDatapoints: CovidDatapoint[] = [];
  private maxDate: Date;
  private maxPerCapita: number;

  private eu28 = [Countries.france, Countries.germany, Countries.italy, Countries.spain, Countries.uk, 'Austria', 'Belgium', 'Bulgaria', 'Croatia', 'Cyprus', 'Czechia', 'Denmark', 'Estonia', 'Finland', 'Greece', 'Hungary', 'Ireland', 'Latvia', 'Lithuania', 'Luxembourg', 'Malta', 'Netherlands', 'Poland', 'Portugal', 'Romania', 'Slovakia', 'Slovenia', 'Sweden'];

  constructor(
    private readonly countryService: CountryService
  ) {
    this.readCo2Data();
    this.readCovidData();
    this.combineCovidDataForWorld();
    this.combineCovidDataForEU28();
    this.combineCovidDataForRestOfWorld();
    // this.readMaxPerCapita();
    console.log('All Data: ' + this.co2Datapoints.length);
    console.log('First Datapoint: ');
    console.log(this.co2Datapoints[0]);
    console.log((this.covidDatapoints));
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
          country: this.countryService.covidCountryToCountry(dp.countriesAndTerritories),
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

