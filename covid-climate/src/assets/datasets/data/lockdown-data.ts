import * as brazil from 'src/assets/datasets/data/lockdown-data/covid-policy-tracker-brazil_nat_total.json';
import * as china from 'src/assets/datasets/data/lockdown-data/covid-policy-tracker-china.json';
import * as france from 'src/assets/datasets/data/lockdown-data/covid-policy-tracker-france.json';
import * as germany from 'src/assets/datasets/data/lockdown-data/covid-policy-tracker-germany.json';
import * as india from 'src/assets/datasets/data/lockdown-data/covid-policy-tracker-india.json';
import * as italy from 'src/assets/datasets/data/lockdown-data/covid-policy-tracker-italy.json';
import * as japan from 'src/assets/datasets/data/lockdown-data/covid-policy-tracker-japan.json';
import * as russia from 'src/assets/datasets/data/lockdown-data/covid-policy-tracker-russia.json';
import * as spain from 'src/assets/datasets/data/lockdown-data/covid-policy-tracker-spain.json';
import * as uk from 'src/assets/datasets/data/lockdown-data/covid-policy-tracker-uk_nat_total.json';
import * as us from 'src/assets/datasets/data/lockdown-data/covid-policy-tracker-usa_nat_total.json';
import {LockdownDatapoint} from '../../../app/core/models/lockdowndata.model';

export class LockdownData {
  private lockdownDatapoints: LockdownDatapoint[] = [];
  private dataTest: object = {};

  constructor() {
    this.fillDatapoints();
  }

  private fillDatapoints(): void {
    // this.dataTest = { ...brazil, ...france, ...germany, ...india};
    console.log((brazil as any));
  }
}
