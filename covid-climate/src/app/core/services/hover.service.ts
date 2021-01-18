import { Injectable } from '@angular/core';
import * as d3 from 'd3';

@Injectable({
  providedIn: 'root'
})
export class HoverService {

  constructor() { }

  public getObjectToMousePos(xPos: number, data: any, xAxis: any, mapedData: any): any {
    const xi = xAxis.invert(xPos);
    const sub = d3.bisect(mapedData, xi);
    return data[sub];
  }

  public getDateString(mousePosX: number, year: string, xAxis: any): string {
    const dateToMousePosX = xAxis.invert(mousePosX).toDateString();
    const removeFirstWord = dateToMousePosX.substr(dateToMousePosX.indexOf(' ') + 1);
    const resultString = removeFirstWord.substr(0, removeFirstWord.lastIndexOf(' '));
    return resultString + year;
  }
}
