import {AfterViewInit, Component, ElementRef, Input, OnChanges, OnInit, SimpleChanges, ViewChild, ViewEncapsulation} from '@angular/core';
import * as d3 from 'd3';
import {DataService} from '../core/services/data.service';
import {Co2Datapoint, Countries} from '../core/models/co2data.model';
import {templateSourceUrl} from '@angular/compiler';

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

  // region size
  width = 960;
  height = 500;
  margin = 5;
  padding = 5;
  adj = 30;
  // endregion

  //region D3 Variables
  readonly x19 = d3.scaleTime()
    .range([0, this.width]);

  readonly x20 = d3.scaleTime()
    .range([0, this.width]);

  readonly y = d3.scaleLinear()
    .range([this.height, 0]);

  readonly xAxis = d3.axisBottom(this.x19)
    .tickFormat(d3.timeFormat('%b'));
  readonly yAxis = d3.axisLeft(this.y);

  readonly line19 = d3.line<Co2Datapoint>()
    .curve(d3.curveNatural)
    .x(d => this.x19(d.date))
    .y(d => this.y(d.mtCo2));

  readonly line20 = d3.line<Co2Datapoint>()
    .curve(d3.curveNatural)
    .x(d => this.x20(d.date))
    .y(d => this.y(d.mtCo2));

  readonly differenceArea = d3.area<[Co2Datapoint, Co2Datapoint]>()
    .curve(d3.curveNatural)
    .x(d => this.x19(d[0].date))
    .y0(d => this.y(d[0].mtCo2))
    .y1(d => this.y(d[1].mtCo2));


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

    this.svg.append('clipPath')
      .attr('id', 'clip-below')
      .append('path');

    this.svg.append('clipPath')
      .attr('id', 'clip-above')
      .append('path');

    this.svg.append('path')
      .attr('clip-path', 'url(#clip-above)')
      .attr('class', 'area-above');

    this.svg.append('path')
      .attr('clip-path', 'url(#clip-below)')
      .attr('class', 'area-below');

    this.svg.append('path')
      .attr('class', 'line19');

    this.svg.append('path')
      .attr('class', 'line20');
  }

  update(): void {
    const data19 = this.dataService.getCo2Data({
      yearFilter: [2019],
      countryFilter: [this.selectedCountry],
      sumSectors: true,
    });
    const data20 = this.dataService.getCo2Data({
      yearFilter: [2020],
      countryFilter: [this.selectedCountry],
      sumSectors: true,
    });
    const values19 = data19.map(dp => dp.mtCo2);
    const values20 = data20.map(dp => dp.mtCo2);

    console.log(data19);

    const dateExtent19 = d3.extent(data19.map(dp => dp.date));
    const dateExtent20 = d3.extent(data20.map(dp => dp.date));
    const valueExtent = d3.extent([0, ...values19, ...values20]);
    this.x19.domain(dateExtent19);
    this.x20.domain(dateExtent20);

    this.svg.selectAll('#xAxis')
      .transition()
      .duration(1000)
      .call(this.xAxis as any);

    this.y.domain(valueExtent);
    this.svg.selectAll('#yAxis')
      .transition()
      .duration(1000)
      .call(this.yAxis as any);

    const line19 = this.svg.select('.line19')
      .datum(data19);

    const line20 = this.svg.select('.line20')
      .datum(data20);

    line19.enter()
      .merge(line19 as any)
      .transition()
      .duration(1000)
      .attr('d', this.line19);

    line20.enter()
      .merge(line20 as any)
      .transition()
      .duration(1000)
      .attr('d', this.line20);

    const comparisonData = data19
      .map((dp, i) => [dp, data20[i]] as [Co2Datapoint, Co2Datapoint]);

    const clipAbove = this.svg.select('#clip-above')
      .select('path')
      .datum(comparisonData);

    clipAbove
      .enter()
      .merge(clipAbove as any)
      .transition()
      .duration(1000)
      .attr('d', this.differenceArea.y0(d => this.y(d[1].mtCo2)).y1(this.height));

    const areaAbove = this.svg.select('.area-above')
      .datum(comparisonData);

    areaAbove
      .enter()
      .merge(areaAbove as any)
      .transition()
      .duration(1000)
      .attr('d', this.differenceArea.y0(0).y1(d => this.y(d[0].mtCo2)));

    const clipBelow = this.svg.select('#clip-below')
      .select('path')
      .datum(comparisonData);

    clipBelow
      .enter()
      .merge(clipBelow as any)
      .transition()
      .duration(1000)
      .attr('d', this.differenceArea.y0(0).y1(d => this.y(d[1].mtCo2)));

    const areaBelow = this.svg.select('.area-below')
      .datum(comparisonData);

    areaBelow
      .enter()
      .merge(areaBelow as any)
      .transition()
      .duration(1000)
      .attr('d', this.differenceArea.y0(d => this.y(d[0].mtCo2)).y1(this.height));

  }

}
