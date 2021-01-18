import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';
import * as d3 from 'd3';
import {DataService} from '../core/services/data.service';
import {Countries} from '../core/models/co2data.model';
import {HistoricCo2Datapoint, PrognosisDataIndicators} from '../core/models/historicco2data.model';
import {isNotNullOrUndefined} from 'codelyzer/util/isNotNullOrUndefined';
import {Options} from '@angular-slider/ngx-slider';
import {HoverService} from '../core/services/hover.service';

@Component({
  selector: 'app-prognosis-graph',
  templateUrl: './prognosis-graph.component.html',
  styleUrls: ['./prognosis-graph.component.scss'],
  // Needed so that d3 components get styled correctly
  encapsulation: ViewEncapsulation.None,
})
export class PrognosisGraphComponent implements OnInit, AfterViewInit, OnChanges {
  constructor(private dataService: DataService, private hoverService: HoverService) {
  }

  @ViewChild('prognosisGraph') prognosisGraph: ElementRef<SVGElement>;
  @Input() selectedCountry: Countries;
  @Input() scenario2degree = true;

  get remainingBudget(): number {
    return this.scenario2degree ? 1042800 : 293000;
  }

  @Output() budgetDepletionYearWithRestrictions = new EventEmitter<number>();
  @Output() budgetDepletionYearWithoutRestrictions = new EventEmitter<number>();

  // region size
  width = 1400;
  height = 600;
  adj = 60;
  // endregion

  // region slider values
  sliderLowValue = 1750;
  sliderHighValue = 2055;
  options: Options = {
    floor: 1750,
    ceil: 2055
  };
  // endregion

  // region hover variables
  private hoverData = [
    {detail: '', text: '', unit: 'MtCo2', fill: 'white'}
  ];
  private hoverSelectedDate = [{date: '-'}];

  private dateTextHeight = 120;
  private bigLineHeight = 80;
  private smallLineHeight = 35;
  // endregion

  //region D3 Variables
  private readonly curveHistoric = d3.curveLinear;

  private readonly curvePrognosisLockdown = d3.curveLinear;

  private readonly curvePrognosisNoLockdown = d3.curveLinear;

  // scale data on x Axis
  readonly xTime = d3.scaleTime()
    .range([0, this.width]);

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
  // endregion

  private prognosisGraphSvg: SVGElement;

  // region ng Methods
  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    this.prognosisGraphSvg = this.prognosisGraph.nativeElement;
    this.initPrognosisGraph();
    this.initPrognosisHover();
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
    } else if (isNotNullOrUndefined(changes.scenario2degree)) {
      this.updatePrognosisGraph();
    }
  }
  // endregion

  // region Prognosis Graph
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
  // endregion

  // region Hover
  private initPrognosisHover(): void {
    // this is the vertical line to follow mouse
    this.prognosisSvg.append('svg:rect')
      .attr('class', 'mouseLine')
      .style('opacity', '0');

    // general group to hide or show the tooltip
    const tooltipPrognosisGroup = this.prognosisSvg.append('g')
      .attr('class', 'tooltipPrognosisGroup')
      .style('opacity', '0');

    // Tooltip for the Prognosis Graph
    this.initTooltipSvg(tooltipPrognosisGroup, this.hoverData);

    // append a rect to catch mouse movements on canvas
    this.prognosisSvg.append('svg:rect')
      .attr('class', 'hoverContainer')
      .attr('width', this.width)
      .attr('height', this.height)
      .attr('fill', 'none')
      .attr('pointer-events', 'all')
      .on('mouseout', () => { // on mouse out
        this.mouseout();
      })
      .on('mouseover', () => { // on mouse in
        this.mouseover();
      })
      .on('mousemove', () => {
        this.mousemovePrognosis();
      });
  }

  private initTooltipSvg(group: any, data: any): void {
    const tooltip = group.append('g');

    tooltip.selectAll('rect').data(data).enter().append('rect')
      .attr('class', 'tooltip');

    tooltip.append('g')
      .attr('class', 'tooltipDateGroup')
      .selectAll('text').data(data).enter().append('text')
      .attr('class', 'tooltipHoverDate')
      .attr('y', this.smallLineHeight)
      .attr('x', 80);

    tooltip.append('g')
      .attr('class', 'tooltipValuesText')
      .selectAll('text').data(data).enter().append('text')
      .attr('class', 'hoverValuesText')
      .attr('x', 100);

    tooltip.append('g')
      .attr('class', 'tooltipUnitsText')
      .selectAll('text').data(data).enter().append('text')
      .attr('class', 'hoverUnitsText')
      .attr('x', 105);

    tooltip.append('g')
      .attr('class', 'tooltipDescribeText')
      .selectAll('text').data(data).enter().append('text')
      .attr('class', 'hoverDescribeText')
      .attr('x', 20);

    tooltip.append('line')
      .attr('class', 'separationLine')
      .attr('x1', 20)     // x position of the first end of the line
      .attr('y1', 50)      // y position of the first end of the line
      .attr('x2', 200)     // x position of the second end of the line
      .attr('y2', 50);
  }

  private mouseover(): void {
    this.prognosisSvg.select('.tooltipPrognosisGroup')
      .style('opacity', '1');
    this.prognosisSvg.select('.mouseLine')
      .style('opacity', '0.7');
  }

  private mouseout(): void {
    this.prognosisSvg.select('.tooltipPrognosisGroup')
      .style('opacity', '0');
    this.prognosisSvg.select('.mouseLine')
      .style('opacity', '0');
  }

  private mousemovePrognosis(): void {
    // Data
    const historicData = this.dataService.getHistoricCo2Data({
      prognosisDataFilter: [PrognosisDataIndicators.historic],
    });
    const prognosisData = this.dataService.getHistoricCo2Data({
      prognosisDataFilter: [PrognosisDataIndicators.prognosis],
    });
    const allData = this.dataService.getHistoricCo2Data({
      prognosisDataFilter: null,
    });

    const tooltipSize = [220, 140]; // width, height

    const mouseCoordinates: [number, number] = d3.pointer(event);
    const mousePosX = mouseCoordinates[0];
    const mousePosY = mouseCoordinates[1];

    const objCo2 = this.hoverService.getObjectToMousePos(mousePosX, historicData, this.x, historicData.map(d => d.year));
    const year = this.x.invert(mousePosX).toFixed(0);

    if (!objCo2) {
      const objPrognosis = this.hoverService.getObjectToMousePos(mousePosX, prognosisData, this.x, prognosisData.map((d => d.year)));

      tooltipSize[1] = 220;
      this.hoverSelectedDate = [{date: year}];

      this.hoverData = [
        {detail: 'Prognosis 1: ', text: objPrognosis.co2PrognosisNoLockdown, unit: 'MtCo2/d', fill: '#FF5889'},
        {detail: 'Prognosis 2: ', text: objPrognosis.co2PrognosisLockdown, unit: 'MtCo2/d', fill: '#85FFBB'}
      ];
    } else {
      this.hoverSelectedDate = [{date: year}];
      this.hoverData = [
        {detail: 'Emission', text: objCo2.mtCo2, unit: 'MtCo2/d', fill: 'white'}
        ];
    }
    this.updateTooltip('tooltipPrognosisGroup', tooltipSize[1], tooltipSize[0], this.hoverData, this.hoverSelectedDate);
    // line and tooltip movement
    let translateX = (mousePosX + 20);
    let translateY = (mousePosY - 20);

    if (mousePosY + tooltipSize[1] - 20 > parseFloat(this.prognosisSvg.style('height'))) {
      translateY = (mousePosY - tooltipSize[1] + 20);
    }
    if (mousePosX + tooltipSize[0] + 20 > this.width) {
      translateX = (mousePosX - (tooltipSize[0] + 20));
    }

    this.prognosisSvg.select('.tooltipPrognosisGroup')
      .attr('transform', 'translate(' + translateX + ' , ' + translateY + ')');

    this.prognosisSvg.select('.mouseLine')
      .attr('x', mousePosX);
  }

  private updateTooltip(tooltipGroupName: string, tooltipHeight: number, tooltipWidth: number,
                        tooltipDataInput: any, tooltipDateInput: any): void {
    let tooltipData = this.hoverData;
    let tooltipDate = this.hoverSelectedDate;

    if (tooltipDataInput != null) {
      tooltipData = tooltipDataInput;
    }
    if (tooltipDateInput != null) {
      tooltipDate = tooltipDateInput;
    }
    // Tooltip Size
    const tooltipGroup = d3.select('.' + tooltipGroupName + '');
    const tooltip = tooltipGroup.selectAll('.tooltip');
    tooltip.attr('height', tooltipHeight);
    tooltip.attr('width', tooltipWidth);

    // Text
    // - Date
    tooltipGroup.selectAll('.tooltipDateGroup').selectAll('text').data(tooltipDate)
      .text(data => data.date);
    // - Values
    const valuesText = tooltipGroup.selectAll('.tooltipValuesText').selectAll('text').data(tooltipData);
    valuesText.exit().remove();
    valuesText.enter().append('text')
      .attr('class', 'hoverValuesText')
      .attr('x', 100)
      .style('fill', data => data.fill)
      .attr('y', (data, index) => this.dateTextHeight + (index ) * this.bigLineHeight)
      .text(data => (data.text));
    valuesText
      .style('fill', data => data.fill)
      .attr('y', (data, index) => this.dateTextHeight + (index ) * this.bigLineHeight)
      .text(data => (data.text));
    // - Units
    const unitsText = tooltipGroup.selectAll('.tooltipUnitsText').selectAll('text').data(tooltipData);
    unitsText.exit().remove();
    unitsText.enter().append('text')
      .attr('class', 'hoverUnitsText')
      .attr('x', 105)
      .attr('y', (data, index) => this.dateTextHeight + (index ) * this.bigLineHeight)
      .text(data => (data.unit));
    unitsText
      .attr('y', (data, index) => this.dateTextHeight + (index ) * this.bigLineHeight)
      .text(data => (data.unit));
    // - Details
    const describeText = tooltipGroup.selectAll('.tooltipDescribeText').selectAll('text').data(tooltipData);
    describeText.exit().remove();
    describeText.enter().append('text')
      .attr('class', 'hoverDescribeText')
      .attr('x', 20)
      .attr('y', (data, index) => this.dateTextHeight + index * this.bigLineHeight - this.smallLineHeight)
      .text(data => (data.detail));
    describeText
      .attr('y', (data, index) => this.dateTextHeight + index * this.bigLineHeight - this.smallLineHeight)
      .text(data => (data.detail));
  }
  // endregion

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
    for (i = 1; usedBudget < this.remainingBudget; i++) {
      // i = 1 because our prognosis data begins with 2020 but the calculation should start with 2021
      usedBudget = usedBudget + (Number(co2Emissions[i]) * 365.25); // 365.25 to account for leap years
    }
    if (i <= 30) {
      depletionYear = upcomingYears[i - 1];
    } else {
      depletionYear = upcomingYears[29]; // year 2050: the last datapoint entry
      console.log('CO2 budget will be depleted some time after 2050.');
    }
    if (lockdowns) {
      this.budgetDepletionYearWithRestrictions.emit(depletionYear);
    } else {
      this.budgetDepletionYearWithoutRestrictions.emit(depletionYear);
    }

    return depletionYear;

    /*// Without using our data and simply sticking to the mcc carbon clock source we would have:
    // 1.5°C scenario
    if (lockdowns) {
      return 2027.5;
      // for 1.5°C scenario with lockdowns (38.341mtons ( = 91,29% of 42000mtons) CO2 annually, divided to the remaining 293000mtons)
    } else {
      return 2027;
      // for 1.5°C scenario without lockdowns (42000mtons CO2 annually, divided to the remaining 293000mtons)
    }
    // 2°C scenario
    if (lockdowns) {
      return 2047;
      // for 2°C scenario with lockdowns (38.341mtons ( = 91,29% of 42000mtons) CO2 annually, divided to the remaining 1042800mtons)
    } else {
      return 2045;
      // for 2°C scenario without lockdowns (42000mtons CO2 annually, divided to the remaining 1042800mtons)
    }*/
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
