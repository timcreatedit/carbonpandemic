import {Injectable} from '@angular/core';
import {Sectors} from '../models/data/co2data.model';

@Injectable({
  providedIn: 'root'
})
export class ColorService {

  public readonly colorLine19 = '#6690ff';
  public readonly colorLine20 = '#ffffff';

  public readonly colorPositive = '#4ff396';
  public readonly colorNegative = '#fc7407';

  public readonly colorPower = '#ffdb21';
  public readonly colorGroundTransport = '#20E74B';
  public readonly colorIndustry = '#b968ff';
  public readonly colorResidential = '#f6304e';
  public readonly colorAviation = '#388bef';

  public readonly colorCovidCases = '#ff5889';
  public readonly colorCovidLockdown = '#DCDCDC';

  constructor() {
  }

  public getColorForSector(sector: Sectors): string {
    switch (sector) {
      case Sectors.power:
        return this.colorPower;
      case Sectors.groundTransport:
        return this.colorGroundTransport;
      case Sectors.industry:
        return this.colorIndustry;
      case Sectors.residential:
        return this.colorResidential;
      case Sectors.domesticAviation:
        return this.colorAviation;
    }
  }
}
