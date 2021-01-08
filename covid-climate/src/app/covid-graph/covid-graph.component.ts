import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit, Output,
  SimpleChanges,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';
import * as d3 from 'd3';
import {DataService} from '../core/services/data.service';
import {Co2Datapoint, Countries, Sectors} from '../core/models/co2data.model';
import {isNotNullOrUndefined} from 'codelyzer/util/isNotNullOrUndefined';
import {CovidDatapoint} from '../core/models/coviddata.model';
import {LockdownDatapoint} from '../core/models/lockdowndata.model';

@Component({
  selector: 'app-covid-graph',
  templateUrl: './covid-graph.component.html',
  styleUrls: ['./covid-graph.component.scss'],
  // Needed so that D3 Elements get styled correctly
  encapsulation: ViewEncapsulation.None,
})
export class CovidGraphComponent implements OnInit, AfterViewInit, OnChanges {

  @ViewChild('graph') graph: ElementRef<SVGElement>;
  @ViewChild('covidGraph') covidGraph: ElementRef<SVGElement>;
  @Input() selectedCountry: Countries;
  @Input() showSectors: boolean;
  @Input() showDifference: boolean;

  @Output() worstDayOf20 = new EventEmitter<Co2Datapoint>();

  // region size
  width = 1400;
  height = 400;
  adj = 60;
  // endregion

  //region D3 Variables
  private readonly curve = d3.curveNatural;

  // scale 2019 data on x Axis
  readonly x19 = d3.scaleTime()
    .range([0, this.width]);

  // scale 2020 data on x Axis
  readonly x20 = d3.scaleTime()
    .range([0, this.width]);

  readonly y = d3.scaleLinear()
    .range([this.height, 0]);

  readonly xAxis = d3.axisBottom(this.x19)
    .tickFormat(d3.timeFormat('%b'));
  readonly yAxis = d3.axisLeft(this.y)
    .ticks(5);

  readonly line19 = d3.line<Co2Datapoint>()
    .curve(this.curve)
    .x(d => this.x19(d.date))
    .y(d => this.y(d.mtCo2));

  readonly line20 = d3.line<Co2Datapoint>()
    .curve(this.curve)
    .x(d => this.x20(d.date))
    .y(d => this.y(d.mtCo2));

  readonly lineCovid = d3.line<CovidDatapoint>()
    // .curve(this.curve)
    .x(d => this.x20(d.date))
    .y(d => this.y(d.cases));

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

  readonly areaLockdown = d3.area<LockdownDatapoint>()
    .x0(d => this.x20(d.date))
    .y0(d => this.height)
    .y1(d => d.lockdown ? this.height : 0);

  private svg: d3.Selection<SVGElement, unknown, null, undefined>;
  private covidSvg: d3.Selection<SVGElement, unknown, null, undefined>;
  // endregion

  private graphSvg: SVGElement;
  private covidGraphSvg: SVGElement;

  constructor(private dataService: DataService) {
  }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    this.graphSvg = this.graph.nativeElement;
    this.covidGraphSvg = this.covidGraph.nativeElement;
    this.initGraph();
    this.initCovidGraph();
    this.updateGraph();
    this.updateCovidGraph();
    this.updateShowDifference(this.showDifference);
    this.updateShowSectors(this.showSectors);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.graphSvg) {
      return;
    }
    if (isNotNullOrUndefined(changes.selectedCountry)) {
      this.updateGraph();
      this.updateCovidGraph();
    }
    if (isNotNullOrUndefined(changes.showSectors?.currentValue)) {
      this.updateShowSectors(changes.showSectors.currentValue);
    }
    if (isNotNullOrUndefined(changes.showDifference?.currentValue)) {
      this.updateShowDifference(changes.showDifference.currentValue);
    }
  }

  private initGraph(): void {
    this.svg = d3.select(this.graphSvg);

    this.svg.attr('preserveAspectRatio', 'xMinYMin meet')
      .attr('viewBox', '-'
        + this.adj + ' -'
        + this.adj + ' '
        + (this.width + this.adj * 3) + ' '
        + (this.height + this.adj * 3))
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
      .attr('dy', '.75em')
      .attr('y', -30)
      .attr('x', 30)
      .style('text-anchor', 'end')
      .text('in MtCO2/d');

    for (const sector of Object.keys(Sectors)) {
      this.svg.append('path')
        .attr('class', 'sectorArea')
        .attr('id', sector);
    }

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

  private initCovidGraph(): void {
    this.covidSvg = d3.select(this.covidGraphSvg);

    this.covidSvg.attr('preserveAspectRatio', 'xMinYMin meet')
      .attr('viewBox', '-'
        + this.adj + ' -'
        + this.adj + ' '
        + (this.width + this.adj * 3) + ' '
        + (this.height + this.adj * 3))
      .classed('svg-content', true);

    this.covidSvg.append('g')
      .attr('class', 'axis')
      .attr('id', 'xAxis')
      .attr('transform', 'translate(0,' + this.height + ')')
      .call(this.xAxis);

    this.covidSvg.append('g')
      .attr('class', 'axis')
      .attr('id', 'yAxis')
      .call(this.yAxis)
      .append('text')
      .attr('dy', '.75em')
      .attr('y', -30)
      .attr('x', 30)
      .style('text-anchor', 'end')
      .text('New cases');

    this.covidSvg.append('path')
      .attr('class', 'area-lockdown');

    this.covidSvg.append('path')
      .attr('class', 'lineCovid');

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

  private updateCovidGraph(): void {
    const covidData = this.dataService.getCovidData({
      countryFilter: [this.selectedCountry],
    });

    const lockdownData = this.dataService.getLockdownData({
      countryFilter: [this.selectedCountry],
    });

    this.updateCovidAxes(covidData);
    this.updateCovidLines(covidData);
    this.updateLockdownArea(lockdownData);
  }

  updateShowDifference(show: boolean): void {
    const line19 = this.svg.select('.line19');
    const areaAbove = this.svg.select('.area-above');
    const areaBelow = this.svg.select('.area-below');

    if (show) {
      line19.attr('class', 'line19 hidden');
      areaAbove.attr('class', 'area-above');
      areaBelow.attr('class', 'area-below');
    } else {
      if (!this.showSectors) {
        line19.attr('class', 'line19');
      }
      areaAbove.attr('class', 'area-above hidden');
      areaBelow.attr('class', 'area-below hidden');
    }
  }

  updateShowSectors(show: boolean): void {
    const line19 = this.svg.select('.line19');
    const sectors = this.svg.selectAll('.sectorArea');

    if (show) {
      line19.attr('class', 'line19 hidden');
      sectors.attr('class', 'sectorArea');
    } else {
      if (!this.showDifference) {
        line19.attr('class', 'line19');
      }
      sectors.attr('class', 'sectorArea hidden');
    }
  }

  private updateAxes(data19: Co2Datapoint[], data20: Co2Datapoint[]): void {
    const maxValue = d3.max([...data19.map(d => d.mtCo2), ...data20.map(d => d.mtCo2)]) * 1.1;

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

  private updateCovidAxes(data: CovidDatapoint[]): void {

    const maxValue = d3.max(data.map(d => d.cases)) * 1.1;

    this.y.domain([0, maxValue]);

    this.covidSvg.selectAll('#xAxis')
      .transition()
      .duration(1000)
      .call(this.xAxis as any);

    this.covidSvg.selectAll('#yAxis')
      .transition()
      .duration(1000)
      .call(this.yAxis as any);
  }

  private updateLines(data19: Co2Datapoint[], data20: Co2Datapoint[]): void {
    const line19 = this.svg.select('.line19')
      .datum(data19);

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

  private updateCovidLines(data: CovidDatapoint[]): void {
    const line = this.covidSvg.select('.lineCovid')
      .datum(data);

    line.enter()
      .merge(line as any)
      .transition()
      .duration(1000)
      .attr('d', this.lineCovid);

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
    const stack = d3.stack()
      .keys(Object.values(Sectors))(data as Iterable<{ [key: string]: any }>);

    const areaGen = d3.area<{ [key: string]: any }>()
      .x((d) => this.x20(d.data.date))
      .y0((d) => this.y(d[0]))
      .y1((d) => this.y(d[1]));

    this.svg.selectAll('.sectorArea')
      .data(stack)
      .transition()
      .duration(1000)
      .attr('d', areaGen);
  }

  private updateLockdownArea(lockdownData: LockdownDatapoint[]): void {
    const areaLockdown = this.covidSvg.select('.area-lockdown')
      .datum(lockdownData);

    areaLockdown
      .enter()
      .merge(areaLockdown as any)
      .transition()
      .duration(1000)
      .attr('d', this.areaLockdown);
  }
}
