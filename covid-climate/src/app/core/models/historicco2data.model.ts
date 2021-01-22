import {Countries} from './co2data.model';

export enum PrognosisDataIndicators {
  prognosis = 'prognosis',
  historic = 'historic',
}

export interface HistoricCo2Datapoint {
  year: number;
  country: Countries;
  mtCo2: number;
  co2Sum: number;
  co2PrognosisLockdown: number;
  co2SumLockdown: number;
  co2PrognosisNoLockdown: number;
  co2SumNoLockdown: number;
  prognosisDataIndicator: PrognosisDataIndicators;
}
