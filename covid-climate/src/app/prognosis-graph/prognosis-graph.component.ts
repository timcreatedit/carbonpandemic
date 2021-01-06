import {AfterViewInit, Component, ElementRef, Input, OnChanges, OnInit, SimpleChanges, ViewChild, ViewEncapsulation} from '@angular/core';
import * as d3 from 'd3';
import {DataService} from '../core/services/data.service';
import {Countries} from '../core/models/co2data.model';
import {HistoricCo2Datapoint, PrognosisDataIndicators} from '../core/models/historicco2data.model';
import {isNotNullOrUndefined} from 'codelyzer/util/isNotNullOrUndefined';

@Component({
  selector: 'app-prognosis-graph',
  templateUrl: './prognosis-graph.component.html',
  styleUrls: ['./prognosis-graph.component.scss'],
  // Needed so that d3 components get styled correctly
  encapsulation: ViewEncapsulation.None,
})
export class PrognosisGraphComponent implements OnInit, AfterViewInit, OnChanges {

  @ViewChild('prognosisGraph') prognosisGraph: ElementRef<SVGElement>;
  @Input() selectedCountry: Countries;

  // region size
  width = 1400;
  height = 600;
  adj = 60;
  // endregion

  //region D3 Variables
  private readonly curveHistoric = d3.curveLinear;

  private readonly curvePrognosisLockdown = d3.curveLinear;

  private readonly curvePrognosisNoLockdown = d3.curveLinear;

  readonly x = d3.scaleLinear()
    .range([0, this.width]);

  readonly y = d3.scaleLinear()
    .range([this.height, 0]);

  readonly xAxis = d3.axisBottom(this.x)
    .ticks(10)
    .tickFormat(d3.format('d'));

  readonly yAxis = d3.axisLeft(this.y)
    .ticks(5);

  readonly lineHistoric = d3.line<HistoricCo2Datapoint>()
    .curve(this.curveHistoric)
    .x(d => this.x(d.year))
    .y(d => this.y(d.mtCo2));

  readonly linePrognosisLockdown = d3.line<HistoricCo2Datapoint>()
    .curve(this.curvePrognosisLockdown)
    .x(d => this.x(d.year))
    .y(d => this.y(d.co2PrognosisLockdown));

  readonly linePrognosisNoLockdown = d3.line<HistoricCo2Datapoint>()
    .curve(this.curvePrognosisNoLockdown)
    .x(d => this.x(d.year))
    .y(d => this.y(d.co2PrognosisNoLockdown));

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

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.prognosisGraphSvg) {
      return;
    }
    if (isNotNullOrUndefined(changes.selectedCountry)) {
      this.updatePrognosisGraph();
    }
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

    this.prognosisSvg
      .append('path')
      .attr('class', 'lineHistoric');

    this.prognosisSvg
      .append('path')
      .attr('class', 'linePrognosisLockdown');

    this.prognosisSvg
      .append('path')
      .attr('class', 'linePrognosisNoLockdown');
  }

  private updatePrognosisGraph(): void {
    const historicData = this.dataService.getHistoricCo2Data({
      prognosisDataFilter: [PrognosisDataIndicators.historic],
    });
    const prognosisData = this.dataService.getHistoricCo2Data({
      prognosisDataFilter: [PrognosisDataIndicators.prognosis],
    });
    const allData = this.dataService.getHistoricCo2Data({
      prognosisDataFilter: null,
    });
    this.updatePrognosisAxes(prognosisData, allData);
    this.updatePrognosisLine(historicData, prognosisData);
  }

  private updatePrognosisAxes(dataPrognosis: HistoricCo2Datapoint[], dataAll: HistoricCo2Datapoint[]): void {
    //const maxValue = d3.max(dataPrognosis.map(d => d.co2PrognosisNoLockdown)); with this solution the maxValue is not correct
    //todo: for a correct functioning d3.max() implementation its data need to be parsed to int
    const maxValue = 120;
    console.log('maxValue' + maxValue);

    this.x.domain(d3.extent(dataAll.map(dp => dp.year)));
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

  private updatePrognosisLine(dataHistoric: HistoricCo2Datapoint[], dataPrognosis: HistoricCo2Datapoint[]): void {
    const lineHistoric = this.prognosisSvg.select('.lineHistoric')
      .datum(dataHistoric);

    lineHistoric.enter()
      .merge(lineHistoric as any)
      .transition()
      .duration(1000)
      .attr('d', this.lineHistoric);

    const linePrognosisLockdown = this.prognosisSvg
      .select('.linePrognosisLockdown')
      .datum(dataPrognosis);

    linePrognosisLockdown.enter()
      .merge(linePrognosisLockdown as any)
      .transition()
      .duration(1000)
      .attr('d', this.linePrognosisLockdown);

    const linePrognosisNoLockdown = this.prognosisSvg
      .select('.linePrognosisNoLockdown')
      .datum(dataPrognosis);

    linePrognosisNoLockdown.enter()
      .merge(linePrognosisNoLockdown as any)
      .transition()
      .duration(1000)
      .attr('d', this.linePrognosisNoLockdown);
  }

}
