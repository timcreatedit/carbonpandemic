import {Injectable} from '@angular/core';
import * as lockdownDataset from '../../../assets/datasets/data/lockdown-data.json';
import {Lockdown, LockdownDatapoint} from '../models/data/lockdowndata.model';
import {CountryService} from './country.service';
import {Countries} from '../models/data/co2data.model';

export interface FilterOptions {
  countryFilter?: Countries[];
}

@Injectable({
  providedIn: 'root'
})
export class LockdownService {

  private lockdownDatapoints: LockdownDatapoint[] = [];

  constructor(
    private countryService: CountryService
  ) {
    this.readLockdownData();
  }

  private readLockdownData(): void {
    (lockdownDataset as any).lockdowndata.forEach(dp => {
      const dateString: string = dp.date.toString();
      const dateValues = [dateString.slice(0, 4), dateString.slice(4, 6), dateString.slice(6, 8)].map(d => parseInt(d, 10));
      const actualDate = new Date(dateValues[0], dateValues[1] - 1, dateValues[2]);
      // if (actualDate <= this.maxDate) {
      this.lockdownDatapoints.push({
        date: actualDate,
        country: this.countryService.covidCountryToCountry(dp.countryName),
        lockdown: (dp.c6_Stay_at_home_requirements >= 2),
      } as LockdownDatapoint);
      // }
    });
    this.lockdownDatapoints = this.lockdownDatapoints.sort((a, b) => a.date.getTime() - b.date.getTime());
    console.log(this.lockdownDatapoints);
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

  public getLockdowns(country: Countries): Lockdown[] {
    let data = this.getLockdownData({countryFilter: [country]});
    const lockdowns: Lockdown[] = [];

    while (data.find(d => d.lockdown === true) !== undefined) {
      const startIndex = data.findIndex(d => d.lockdown);
      const end = data.findIndex((d, i) => !d.lockdown && i > startIndex);

      if (startIndex < 0) {
        break;
      }
      const endIndex = end < 0 ? data.length - 1 : end - 1;

      const lockdown = {
        start: data[startIndex],
        end: data[endIndex],

      } as Lockdown;
      lockdowns.push(lockdown);
      data = data.slice(endIndex + 1);
    }
    return lockdowns;
  }
}
