import {Countries} from './co2data.model';

export interface LockdownDatapoint {
  date: Date;
  country: Countries;
  lockdown: boolean;
  mask: boolean;
}
