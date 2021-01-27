import {Countries} from './co2data.model';

export interface LockdownDatapoint {
  date: Date;
  country: Countries;
  lockdown: boolean;
}

export interface Lockdown {
  start: LockdownDatapoint;
  end: LockdownDatapoint;
}
