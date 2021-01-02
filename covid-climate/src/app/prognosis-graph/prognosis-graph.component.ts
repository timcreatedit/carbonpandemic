import {Component, ElementRef, Input, OnInit, ViewChild} from '@angular/core';
import * as d3 from 'd3';
import {DataService} from '../core/services/data.service';
import {Countries} from '../core/models/co2data.model';
import {HistoricCo2Datapoint} from '../core/models/historicco2data.model';

@Component({
  selector: 'app-prognosis-graph',
  templateUrl: './prognosis-graph.component.html',
  styleUrls: ['./prognosis-graph.component.scss']
})
export class PrognosisGraphComponent implements OnInit {

  @ViewChild('prognosisGraph') prognosisGraph: ElementRef<SVGElement>;
  @Input() selectedCountry: Countries;

  // region size
  width = 1400;
  height = 400;
  adj = 60;
  // endregion

  //region D3 Variables
  private readonly curve = d3.curveNatural;

  readonly x = d3.scaleTime()
    .range([0, this.width]);

  readonly y = d3.scaleLinear()
    .range([this.height, 0]);

  readonly xAxis = d3.axisBottom(this.x)
    .tickFormat(d3.timeFormat('%b'));

  readonly yAxis = d3.axisLeft(this.y)
    .ticks(5);

  readonly line = d3.line<HistoricCo2Datapoint>()
    .curve(this.curve)
    .x(d => this.x(d.year))
    .y(d => this.y(d.mtCo2));

  private prognosisSvg: d3.Selection<SVGElement, unknown, null, undefined>;
  // endregion

  private prognosisGraphSvg: SVGElement;

  constructor(private dataService: DataService) { }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    this.prognosisGraphSvg = this.prognosisGraph.nativeElement;
    this.initPrognosisGraph();
    this.updatePrognosisGraph();
  }

  private initPrognosisGraph(): void {
    this.prognosisSvg = d3.select(this.prognosisGraphSvg);

    this.prognosisSvg.attr('preserveAspectRatio', 'xMinYMin meet')
      .attr('viewBox', '-'
        + this.adj + ' -'
        + this.adj + ' '
        + (this.width + this.adj * 3) + ' '
        + (this.height + this.adj * 3))
      .classed('svg-content', true);

    this.prognosisSvg.append('g')
      .attr('class', 'axis')
      .attr('id', 'xAxis')
      .attr('transform', 'translate(0,' + this.height + ')')
      .call(this.xAxis);

    this.prognosisSvg.append('g')
      .attr('class', 'axis')
      .attr('id', 'yAxis')
      .call(this.yAxis)
      .append('text')
      .attr('dy', '.75em')
      .attr('y', -30)
      .attr('x', 30)
      .style('text-anchor', 'end')
      .text('in MtCO2/d');

    this.prognosisSvg.append('path')
      .attr('class', 'linePrognosis');

  }

  private updatePrognosisGraph(): void {
    const prognosisData = this.dataService.getHistoricCo2Data({
      countryFilter: [null]
    });
    this.updatePrognosisAxes(prognosisData);
    this.updatePrognosisLines(prognosisData);
  }

  private updatePrognosisAxes(data: HistoricCo2Datapoint[]): void {
    const maxValue = d3.max(data.map(d => d.mtCo2)) * 1.1;

    this.y.domain([0, maxValue]);

    this.prognosisSvg.selectAll('#xAxis')
      .transition()
      .duration(1000)
      .call(this.xAxis as any);

    this.prognosisSvg.selectAll('#yAxis')
      .transition()
      .duration(1000)
      .call(this.yAxis as any);
  }

  private updatePrognosisLines(data: HistoricCo2Datapoint[]): void {
    const line = this.prognosisSvg.select('.line')
      .datum(data);

    line.enter()
      .merge(line as any)
      .transition()
      .duration(1000)
      .attr('d', this.line);
  }

}
