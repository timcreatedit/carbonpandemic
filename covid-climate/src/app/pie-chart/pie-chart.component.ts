import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import * as d3 from 'd3';
import {DataService} from '../core/services/data.service';
import {Co2Datapoint, Countries, Sectors} from '../core/models/co2data.model';

@Component({
  selector: 'app-pie-chart',
  templateUrl: './pie-chart.component.html',
  styleUrls: ['./pie-chart.component.scss']
})
export class PieChartComponent implements OnInit, OnChanges {

  @Input() selectedCountry: Countries;
  @Input() co2Data: Co2Datapoint[];

  constructor(private dataService: DataService) {
  }

  ngOnInit(): void {
    this.drawTest();
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.drawTest();
  }

  drawTest(): void {
    const data2019 = this.co2Data
      .filter(d => d.date.getFullYear() === 2019);
    const data2020 = this.co2Data
      .filter(d => d.date.getFullYear() === 2020);

    const sectorData19 = Object.keys(Sectors)
      .map(s => data2019.filter(dp => dp.sector === Sectors[s]))
      .map(dps => dps.map(dp => dp.mtCo2).reduce((v1, v2) => v1 + v2, 0));

    const sectorData20 = Object.keys(Sectors)
      .map(s => data2020.filter(dp => dp.sector === Sectors[s]))
      .map(dps => dps.map(dp => dp.mtCo2).reduce((v1, v2) => v1 + v2, 0));

    console.log(sectorData19);
    console.log(sectorData20);

    const svg1 = d3.select('#pieChart2019');
    const svg2 = d3.select('#pieChart2020');

    const g1 = svg1.append('g')
      .attr('transform', 'translate(150,120)');
    const g2 = svg2.append('g')
      .attr('transform', 'translate(150,120)');

    const pie = d3.pie();

    const arc: d3.Arc<any, d3.DefaultArcObject> = d3.arc()
      .innerRadius(0)
      .outerRadius(100);

    const arcs1 = g1.selectAll('arc')
      .data(pie(sectorData19))
      .enter()
      .append('g');
    const arcs2 = g2.selectAll('arc')
      .data(pie(sectorData20))
      .enter()
      .append('g');

    arcs1.append('path')
      .attr('fill', (data, i) => {
        return d3.schemeSet3[i]; // mapping the data to colors
      })
      .attr('d', arc as any);

    arcs2.append('path')
      .attr('fill', (data, i) => {
        return d3.schemeSet3[i]; // mapping the data to colors
      })
      .attr('d', arc as any);
  }
}
