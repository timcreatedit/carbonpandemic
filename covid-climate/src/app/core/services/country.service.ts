import { Injectable } from '@angular/core';
import {Countries} from '../models/co2data.model';

@Injectable({
  providedIn: 'root'
})
export class CountryService {

  constructor() { }

  public covidCountryToCountry(country: string): Countries {
    if (country === 'United_Kingdom' || country === 'United Kingdom') {
      return Countries.uk;
    } else if (country === 'United_States_of_America' || country === 'United States') {
      return Countries.us;
    }
    return country as Countries;
  }
}
