import {AfterViewInit, Component, ElementRef, Input, OnChanges, OnInit, SimpleChanges, ViewChild, ViewEncapsulation} from '@angular/core';
import * as d3 from 'd3';
import {DataService} from '../core/services/data.service';
import {Countries} from '../core/models/co2data.model';
import {HistoricCo2Datapoint, PrognosisDataIndicators} from '../core/models/historicco2data.model';
import {isNotNullOrUndefined} from 'codelyzer/util/isNotNullOrUndefined';
import {Options} from '@angular-slider/ngx-slider';

@Component({
  selector: 'app-prognosis-graph',
  templateUrl: './prognosis-graph.component.html',
  styleUrls: ['./prognosis-graph.component.scss'],
  // Needed so that d3 components get styled correctly
  encapsulation: ViewEncapsulation.None,
})
export class PrognosisGraphComponent implements OnInit, AfterViewInit, OnChanges {
  constructor(private dataService: DataService) {
  }

  @ViewChild('prognosisGraph') prognosisGraph: ElementRef<SVGElement>;
  @Input() selectedCountry: Countries;
  @Input() scenario2degree = true;

  get remainingBudget(): number {
    return this.scenario2degree ? 1042800 : 293000;
  }

  // region size
  width = 1400;
  height = 600;
  adj = 60;
  // endregion

  // slider values
  sliderLowValue = 1750;
  sliderHighValue = 2055;
  options: Options = {
    floor: 1750,
    ceil: 2055
  };
  // endslider

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
  private sliderSvg: d3.Selection<SVGElement, unknown, null, undefined>;
  // en  dregion

  private prognosisGraphSvg: SVGElement;


  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    this.prognosisGraphSvg = this.prognosisGraph.nativeElement;
    this.initPrognosisGraph();
    this.initCo2BudgetLines();
    this.updatePrognosisGraph();
    this.updateCo2BudgetLines();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.prognosisGraphSvg) {
      return;
    }
    if (isNotNullOrUndefined(changes.selectedCountry)) {
      this.updatePrognosisGraph();
    }
    else if (isNotNullOrUndefined(changes.scenario2degree)) {
      this.updatePrognosisGraph();
    }
  }

  private initPrognosisGraph(): void {
    this.prognosisSvg = d3.select(this.prognosisGraphSvg);
    this.sliderSvg = this.prognosisSvg.append('g');

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

    this.sliderSvg = this.prognosisSvg.append('svg')
      .attr('class', 'sliderSvg')
      .attr('height', this.height)
      .attr('width', this.width);

    this.sliderSvg
      .append('path')
      .attr('class', 'lineHistoric');

    this.sliderSvg
      .append('path')
      .attr('class', 'linePrognosisLockdown');

    this.sliderSvg
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
    const maxValue = 120; // can be hardcoded because we only use one dataset (world)

    // this.x.domain(d3.extent(dataAll.map(dp => dp.year)));
    this.x.domain([this.sliderLowValue, this.sliderHighValue]);
    this.y.domain([0, maxValue * 1.1]);

    this.prognosisSvg.selectAll('#xAxis')
      .transition()
      .duration(1)
      .call(this.xAxis as any);

    this.prognosisSvg.selectAll('#yAxis')
      .transition()
      .duration(1)
      .call(this.yAxis as any);
  }

  private updatePrognosisLine(dataHistoric: HistoricCo2Datapoint[], dataPrognosis: HistoricCo2Datapoint[]): void {
    const lineHistoric = this.prognosisSvg.select('.lineHistoric')
      .datum(dataHistoric);

    lineHistoric.enter()
      .merge(lineHistoric as any)
      .transition()
      .duration(1)
      .attr('d', this.lineHistoric);

    const linePrognosisLockdown = this.prognosisSvg
      .select('.linePrognosisLockdown')
      .datum(dataPrognosis);

    linePrognosisLockdown.enter()
      .merge(linePrognosisLockdown as any)
      .transition()
      .duration(1)
      .attr('d', this.linePrognosisLockdown);

    const linePrognosisNoLockdown = this.prognosisSvg
      .select('.linePrognosisNoLockdown')
      .datum(dataPrognosis);

    linePrognosisNoLockdown.enter()
      .merge(linePrognosisNoLockdown as any)
      .transition()
      .duration(1)
      .attr('d', this.linePrognosisNoLockdown);
  }

  private initCo2BudgetLines(): void {
    this.sliderSvg.append('svg:line')
      .attr('class', 'budgetLine')
      .attr('id', 'budgetLineLockdowns')
      .attr('y1', 0)
      .attr('y2', this.height);
    this.sliderSvg.append('svg:line')
      .attr('class', 'budgetLine')
      .attr('id', 'budgetLineNoLockdowns')
      .attr('y1', 0)
      .attr('y2', this.height);
  }

  private updateCo2BudgetLines(): void {
    const lockdowns = true;

    const depletionYearLockdowns = this.x(this.calculateDepletionYear(lockdowns));
    this.sliderSvg
      .select('#budgetLineLockdowns')
      .attr('x1', depletionYearLockdowns)
      .attr('x2', depletionYearLockdowns);

    const depletionYearNoLockdowns = this.x(this.calculateDepletionYear(!lockdowns));
    this.sliderSvg
      .select('#budgetLineNoLockdowns')
      .attr('x1', depletionYearNoLockdowns)
      .attr('x2', depletionYearNoLockdowns);
  }

  private calculateDepletionYear(lockdowns: boolean): number {
    const prognosisData = this.dataService.getHistoricCo2Data({
      prognosisDataFilter: [PrognosisDataIndicators.prognosis],
    });
    const upcomingYears = prognosisData.map(dp => dp.year);
    let depletionYear;
    let co2Emissions;

    if (lockdowns) {
      co2Emissions = prognosisData.map(dp => dp.co2PrognosisLockdown);
    } else {
      co2Emissions = prognosisData.map(dp => dp.co2PrognosisNoLockdown);
    }

    let usedBudget = 0;
    let i;
    for (i = 1; usedBudget < this.remainingBudget; i++) { // i = 1 because our prognosis data begins with 2020 but the calculation should start with 2021
      usedBudget = usedBudget + (Number(co2Emissions[i]) * 365.25); // 365.25 to account for leap years
    }
    depletionYear = upcomingYears[i - 1];

    return depletionYear;

    /* without using our data and simply sticking to the mcc carbon clock source we would have:
    // 1.5°C scenario
    if(lockdowns){
      return 2027.5 //for 1.5°C scenario with lockdowns (38.341mtons ( = 91,29% of 42000mtons) CO2 annually, divided to the remaining 293000mtons)
    } else {
      return 2027 //for 1.5°C scenario without lockdowns (42000mtons CO2 annually, divided to the remaining 293000mtons)
    }
    //2°C scenario
    if(lockdowns) {
      return 2047 //for 2°C scenario with lockdowns (38.341mtons ( = 91,29% of 42000mtons) CO2 annually, divided to the remaining 1042800mtons)
    } else {
      return 2045 //for 2°C scenario without lockdowns (42000mtons CO2 annually, divided to the remaining 1042800mtons)
    } */
  }

  // slider onChange low
  valueChange(value: number): void {
    this.sliderLowValue = value;
    this.updatePrognosisGraph();
    this.updateCo2BudgetLines();
  }

  // slider onChange high
  valueChangeHigh(highValue: number): void {
    this.sliderHighValue = highValue;
    this.updatePrognosisGraph();
    this.updateCo2BudgetLines();
  }
}
