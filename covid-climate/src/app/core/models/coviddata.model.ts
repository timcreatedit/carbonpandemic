import {Countries} from './co2data.model';

export interface CovidDatapoint {
  date: Date;
  country: Countries;
  continent: string;
  cases: number;
}
