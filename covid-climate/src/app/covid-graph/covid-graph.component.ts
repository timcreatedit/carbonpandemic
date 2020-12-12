import {AfterViewInit, Component, ElementRef, Input, OnChanges, OnInit, SimpleChanges, ViewChild, ViewEncapsulation} from '@angular/core';
import * as d3 from 'd3';
import {DataService} from '../core/services/data.service';
import {Co2Datapoint, Countries, Sectors} from '../core/models/co2data.model';
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

  showDifference: boolean;

  @Input() showSectors: boolean;

  // region size
  width = 960;
  height = 500;
  margin = 5;
  padding = 5;
  adj = 30;
  // endregion

  //region D3 Variables
  private readonly curve = d3.curveNatural;

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
    .curve(this.curve)
    .x(d => this.x19(d.date))
    .y(d => this.y(d.mtCo2));

  readonly line20 = d3.line<Co2Datapoint>()
    .curve(this.curve)
    .x(d => this.x20(d.date))
    .y(d => this.y(d.mtCo2));

  readonly areaBelow20 = d3.area<Co2Datapoint>()
    .curve(this.curve)
    .x(d => this.x20(d.date))
    .y0(this.height)
    .y1(d => this.y(d.mtCo2));

  readonly areaAbove20 = d3.area<Co2Datapoint>()
    .curve(this.curve)
    .x(d => this.x20(d.date))
    .y0(d => this.y(d.mtCo2))
    .y1(0);

  readonly areaBelow19 = d3.area<Co2Datapoint>()
    .curve(this.curve)
    .x(d => this.x19(d.date))
    .y0(this.height)
    .y1(d => this.y(d.mtCo2));

  readonly areaAbove19 = d3.area<Co2Datapoint>()
    .curve(this.curve)
    .x(d => this.x19(d.date))
    .y0(d => this.y(d.mtCo2))
    .y1(0);


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
    this.updateGraph();
    this.updateShowDifference(this.showDifference);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.graphSvg) {
      return;
    }
    this.updateGraph();
  }

  private initGraph(): void {
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

    for (const sector of Object.values(Sectors)) {
      this.svg.append('path')
        .attr('class', 'sectorArea ' + sector);

    }
  }

  private updateGraph(): void {
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

    this.updateAxes(data19, data20);
    this.updateLines(data19, data20);
    this.updateDifferenceArea(data19, data20);
    this.updateSectorStacks();
  }

  updateShowDifference(showDifference: boolean): void {
    const line19 = this.svg.select('.line19');
    const areaAbove = this.svg.select('.area-above');
    const areaBelow = this.svg.select('.area-below');

    if (showDifference) {
      line19.attr('class', 'line19 hidden');
      areaAbove.attr('class', 'area-above');
      areaBelow.attr('class', 'area-below');
    } else {
      line19.attr('class', 'line19');
      areaAbove.attr('class', 'area-above hidden');
      areaBelow.attr('class', 'area-below hidden');
    }
  }

  private updateAxes(data19: Co2Datapoint[], data20: Co2Datapoint[]): void {
    const maxValue = d3.max([...data19.map(d => d.mtCo2), ...data20.map(d => d.mtCo2)]);

    this.x19.domain(d3.extent(data19.map(dp => dp.date)));
    this.x20.domain(d3.extent(data20.map(dp => dp.date)));
    this.y.domain([0, maxValue]);

    this.svg.selectAll('#xAxis')
      .transition()
      .duration(1000)
      .call(this.xAxis as any);

    this.svg.selectAll('#yAxis')
      .transition()
      .duration(1000)
      .call(this.yAxis as any);
  }

  private updateLines(data19: Co2Datapoint[], data20: Co2Datapoint[]): void {
    const line19 = this.svg.select('.line19')
      .datum(data19);

    if (this.showDifference) {
      line19.attr('class', 'line19 hidden');
    } else {
      line19.attr('class', 'line19');
    }

    line19.enter()
      .merge(line19 as any)
      .transition()
      .duration(1000)
      .attr('d', this.line19);

    const line20 = this.svg.select('.line20')
      .datum(data20);

    line20.enter()
      .merge(line20 as any)
      .transition()
      .duration(1000)
      .attr('d', this.line20);
  }

  private updateDifferenceArea(data19: Co2Datapoint[], data20: Co2Datapoint[]): void {
    const clipAbove = this.svg.select('#clip-above')
      .select('path')
      .datum(data20);

    clipAbove
      .enter()
      .merge(clipAbove as any)
      .transition()
      .duration(1000)
      .attr('d', this.areaBelow20);

    const areaAbove = this.svg.select('.area-above')
      .datum(data19);

    areaAbove
      .enter()
      .merge(areaAbove as any)
      .transition()
      .duration(1000)
      .attr('d', this.areaAbove19);

    const clipBelow = this.svg.select('#clip-below')
      .select('path')
      .datum(data20);

    clipBelow
      .enter()
      .merge(clipBelow as any)
      .transition()
      .duration(1000)
      .attr('d', this.areaAbove20);

    const areaBelow = this.svg.select('.area-below')
      .datum(data19);

    areaBelow
      .enter()
      .merge(areaBelow as any)
      .transition()
      .duration(1000)
      .attr('d', this.areaBelow19);
  }

  private updateSectorStacks(): void {
    const data = this.dataService.getSectorsPerDay(this.selectedCountry);
    console.log(data);
    const sectorArea = d3.select('.sectorArea' );

  }

}
