import {AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild} from '@angular/core';
import * as d3 from 'd3';
import {DataService} from '../core/services/data.service';
import {Co2Datapoint, Countries} from '../core/models/co2data.model';

@Component({
  selector: 'app-covid-graph',
  templateUrl: './covid-graph.component.html',
  styleUrls: ['./covid-graph.component.scss']
})
export class CovidGraphComponent implements OnInit, AfterViewInit {

  @ViewChild('graph') graph: ElementRef<SVGElement>;
  @Input() selectedCountry: Countries;
  @Input() co2Data: Co2Datapoint[];

  width = 960;
  height = 500;
  margin = 5;
  padding = 5;
  adj = 30;

  private graphSvg: SVGElement;

  constructor(private dataService: DataService) {
  }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    this.graphSvg = this.graph.nativeElement;
    this.initGraph();
  }

  initGraph(): void {
    const data19 = this.co2Data.filter(dp => dp.date.getFullYear() === 2019);
    const data20 = this.co2Data.filter(dp => dp.date.getFullYear() === 2020);
    const values19 = data19.map(dp => dp.mtCo2);
    const values20 = data20.map(dp => dp.mtCo2);

    const dateExtent = d3.extent(data19.map(dp => dp.date));
    const valueExtent = d3.extent([...values19, ...values20]);

    const x = d3.scaleTime()
      .domain(dateExtent)
      .range([0, this.width]);
    const y = d3.scaleLinear()
      .domain(valueExtent)
      .range([this.height, 0]);

    const xAxis = d3.axisBottom(x)
      .tickFormat(d3.timeFormat('%b'));
    const yAxis = d3.axisLeft(y);

    const graph = d3.select(this.graphSvg);

    graph.attr('preserveAspectRatio', 'xMinYMin meet')
      .attr('viewBox', '-'
        + this.adj + ' -'
        + this.adj + ' '
        + (this.width + this.adj * 3) + ' '
        + (this.height + this.adj * 3))
      .style('padding', this.padding)
      .style('margin', this.margin)
      .classed('svg-content', true);

    graph.append('g')
      .attr('class', 'axis')
      .attr('transform', 'translate(0,' + this.height + ')')
      .call(xAxis);

    graph.append('g')
      .attr('class', 'axis')
      .call(yAxis);
  }

}
