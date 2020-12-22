import {Countries} from './co2data.model';

export interface HistoricCo2Datapoint {
  year: number;
  country: Countries;
  mtCo2: number;
}
