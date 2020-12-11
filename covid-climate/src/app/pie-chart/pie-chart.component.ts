import {Component, OnInit} from '@angular/core';
import * as d3 from 'd3';
import { DataService } from '../core/services/data.service';

@Component({
  selector: 'app-pie-chart',
  templateUrl: './pie-chart.component.html',
  styleUrls: ['./pie-chart.component.scss']
})
export class PieChartComponent implements OnInit {

  constructor(private dataService: DataService) {
  }

  ngOnInit(): void {
    this.drawTest();
  }

  drawTest(): void {

    const data2019 = [1.1, 2.2, 4.46, 2.12, 1.36, 5.002445, 4.1242];
    const data2020 = [10, 20, 30, 10, 5, 5, 20];

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
      .data(pie(data2019))
      .enter()
      .append('g');
    const arcs2 = g2.selectAll('arc')
      .data(pie(data2020))
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
