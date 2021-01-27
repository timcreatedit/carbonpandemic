import {Injectable} from '@angular/core';
import * as d3 from 'd3';
import {ScaleLinear, ScaleTime} from 'd3';
import {HistoricCo2Datapoint} from '../models/historicco2data.model';
import {LockdownDatapoint} from '../models/lockdowndata.model';
import {CovidDatapoint} from '../models/coviddata.model';
import {Co2Datapoint} from '../models/co2data.model';

@Injectable({
  providedIn: 'root'
})
export class HoverService {

  constructor() {
  }

  getLockdownDataAtMousePosition(xPos: number, data: LockdownDatapoint[], xAxis: ScaleTime<number, number>): LockdownDatapoint {
    const dateAtMouse: Date = xAxis.invert(xPos);
    const dataIndex = d3.bisect(data.map(d => d.date), dateAtMouse);
    return data[dataIndex - 1];
  }

  getCovidDataAtMousePosition(xPos: number, data: CovidDatapoint[], xAxis: ScaleTime<number, number>): CovidDatapoint {
    const dateAtMouse: Date = xAxis.invert(xPos);
    const dataIndex = d3.bisect(data.map(d => d.date), dateAtMouse);
    return data[dataIndex - 1];
  }

  getCo2DataAtMousePosition(xPos: number, data: Co2Datapoint[], xAxis: ScaleTime<number, number>): Co2Datapoint {
    const dateAtMouse: Date = xAxis.invert(xPos);
    const dataIndex = d3.bisect(data.map(d => d.date), dateAtMouse);
    return data[dataIndex - 1];
  }

  getSectorStackAtDatapoint(xPos: number, data: { [id: string]: number | Date }[], xAxis: ScaleTime<number, number>): { [id: string]: number | Date } {
    const dateAtMouse: Date = xAxis.invert(xPos);
    const dataIndex = d3.bisect(data.map(d => d.date as Date), dateAtMouse);
    return data[dataIndex - 1];
  }

  getHistoricDatapointAtMousePosition(xPos: number, data: HistoricCo2Datapoint[], xAxis: ScaleLinear<number, number>, years: number[]): HistoricCo2Datapoint {
    const xi = xAxis.invert(xPos);
    const yearIndex = d3.bisect(years, xi);
    return data[yearIndex - 1];
  }
}
