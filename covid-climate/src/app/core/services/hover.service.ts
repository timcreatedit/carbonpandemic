import {Injectable} from '@angular/core';
import * as d3 from 'd3';
import {ScaleLinear} from 'd3';
import {HistoricCo2Datapoint} from '../models/historicco2data.model';

@Injectable({
  providedIn: 'root'
})
export class HoverService {

  constructor() {
  }

  public getHistoricDatapointAtMousePosition(xPos: number, data: HistoricCo2Datapoint[], xAxis: ScaleLinear<number, number>, years: number[]): HistoricCo2Datapoint {
    const xi = xAxis.invert(xPos);
    const yearIndex = d3.bisect(years, xi);
    return data[yearIndex];
  }

  public getDateString(mousePosX: number, year: string, xAxis: any): string {
    const dateToMousePosX = xAxis.invert(mousePosX).toDateString();
    const removeFirstWord = dateToMousePosX.substr(dateToMousePosX.indexOf(' ') + 1);
    const resultString = removeFirstWord.substr(0, removeFirstWord.lastIndexOf(' '));
    return resultString + year;
  }
}
