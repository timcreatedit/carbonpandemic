import {AfterViewInit, Component, ElementRef, Input, OnChanges, OnInit, SimpleChanges, ViewChild, ViewEncapsulation} from '@angular/core';
import * as d3 from 'd3';
import {DataService} from '../core/services/data.service';
import {Co2Datapoint, Countries} from '../core/models/co2data.model';

@Component({
  selector: 'app-covid-graph',
  templateUrl: './covid-graph.component.html',
  styleUrls: ['./covid-graph.component.scss'],
  // Needed so that D3 Elements get styled correctly
  encapsulation: ViewEncapsulation.None,
})
export class CovidGraphComponent implements OnInit, AfterViewInit, OnChanges {

  @ViewChild('graph') graph: ElementRef<SVGElement>;
  @Input() selectedCountry: Countries;
  @Input() co2Data: Co2Datapoint[];

  // region size
  width = 960;
  height = 500;
  margin = 5;
  padding = 5;
  adj = 30;
  // endregion

  //region D3 Variables
  readonly x = d3.scaleTime()
    .range([0, this.width]);
  readonly y = d3.scaleLinear()
    .range([this.height, 0]);

  readonly xAxis = d3.axisBottom(this.x)
    .tickFormat(d3.timeFormat('%b'));
  readonly yAxis = d3.axisLeft(this.y);

  readonly line = d3.line<Co2Datapoint>()
    .x(d => this.x(d.date))
    .y(d => this.y(d.mtCo2));

  private svg: d3.Selection<SVGElement, unknown, null, undefined>;
  // endregion

  private graphSvg: SVGElement;

  constructor(private dataService: DataService) {
  }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    this.graphSvg = this.graph.nativeElement;
    this.initGraph();
    this.update();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.graphSvg) {
      return;
    }
    this.update();
  }

  initGraph(): void {
    this.svg = d3.select(this.graphSvg);

    this.svg.attr('preserveAspectRatio', 'xMinYMin meet')
      .attr('viewBox', '-'
        + this.adj + ' -'
        + this.adj + ' '
        + (this.width + this.adj * 3) + ' '
        + (this.height + this.adj * 3))
      .style('padding', this.padding)
      .style('margin', this.margin)
      .classed('svg-content', true);

    this.svg.append('g')
      .attr('class', 'axis')
      .attr('id', 'xAxis')
      .attr('transform', 'translate(0,' + this.height + ')')
      .call(this.xAxis);

    this.svg.append('g')
      .attr('class', 'axis')
      .attr('id', 'yAxis')
      .call(this.yAxis)
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('dy', '.75em')
      .attr('y', 6)
      .style('text-anchor', 'end')
      .text('in MtCO2');

    this.svg.append('path')
      .attr('class', 'line');
  }

  update(): void {
    const data19 = this.co2Data.filter(dp => dp.date.getFullYear() === 2019)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
    const data20 = this.co2Data.filter(dp => dp.date.getFullYear() === 2020);
    const values19 = data19.map(dp => dp.mtCo2);
    const values20 = data20.map(dp => dp.mtCo2);

    console.log(data19);

    const dateExtent = d3.extent(data19.map(dp => dp.date));
    const valueExtent = d3.extent([...values19, ...values20]);

    this.x.domain(dateExtent);
    this.svg.selectAll('#xAxis')
      .transition()
      .duration(1000)
      .call(this.xAxis as any);

    this.y.domain(valueExtent);
    this.svg.selectAll('#yAxis')
      .transition()
      .duration(1000)
      .call(this.yAxis as any);

    const u = this.svg.select('.line')
      .datum(data19);

    u.enter()
      .append('path')
      .attr('class', 'line')
      .merge(u as any)
      .transition()
      .duration(1000)
      .attr('d', this.line)
      .attr('fill', 'none')
      .attr('stroke', 'steelblue')
      .attr('stroke-width', 2.5)
    ;

  }

}
