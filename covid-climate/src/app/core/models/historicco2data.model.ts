import {Countries} from './co2data.model';

export interface HistoricCo2Datapoint {
  year: number;
  country: Countries;
  mtCo2: number;
  co2PrognosisLockdown: number;
  co2PrognosisNoLockdown: number;
}
