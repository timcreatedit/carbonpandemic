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
import {DecimalPipe} from '@angular/common';

@Component({
  selector: 'app-prognosis-graph',
  templateUrl: './prognosis-graph.component.html',
  styleUrls: ['./prognosis-graph.component.scss'],
  // Needed so that d3 components get styled correctly
  encapsulation: ViewEncapsulation.None,
})
export class PrognosisGraphComponent implements OnInit, AfterViewInit, OnChanges {
  constructor(private dataService: DataService,
              private hoverService: HoverService,
              private decimalPipe: DecimalPipe) {
  }

  @ViewChild('prognosisGraph') prognosisGraph: ElementRef<SVGElement>;
  @Input() selectedCountry: Countries;
  @Input() scenario2degree = true;
  @Input() isSum = true;

  get unit(): string {
    return this.isSum ? 'total MtCo2' : 'MtCo2/d';
  }

  // region size
  width = 1400;
  height = 800;

  // top right bottom left
  padding: [number, number, number, number] = [50, 0, 20, 80];
  // endregion

  // region slider values
  sliderLowValue = 1750;
  sliderHighValue = 2050;
  options: Options = {
    floor: 1750,
    ceil: 2050
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
    .y(d => this.y(this.isSum ? d.co2Sum : d.mtCo2));

  readonly linePrognosisLockdown = d3.line<HistoricCo2Datapoint>()
    .curve(this.curvePrognosisLockdown)
    .x(d => this.x(d.year))
    .y(d => this.y(this.isSum ? d.co2SumLockdown : d.co2PrognosisLockdown));

  readonly linePrognosisNoLockdown = d3.line<HistoricCo2Datapoint>()
    .curve(this.curvePrognosisNoLockdown)
    .x(d => this.x(d.year))
    .y(d => this.y(this.isSum ? d.co2SumNoLockdown : d.co2PrognosisNoLockdown));

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
      this.updateCo2BudgetLines();
    } else if (isNotNullOrUndefined(changes.isSum)) {
      this.updatePrognosisGraph();
      this.updateCo2BudgetLines();
    }
  }

  // endregion

  // region Prognosis Graph
  private initPrognosisGraph(): void {
    this.prognosisSvg = d3.select(this.prognosisGraphSvg);
    this.sliderSvg = this.prognosisSvg.append('g');

    this.prognosisSvg.attr('preserveAspectRatio', 'xMinYMin meet')
      .attr('viewBox', '-'
        + this.padding[3] + ' -'
        + this.padding[0] + ' '
        + (this.width + this.padding[1] + this.padding[3]) + ' '
        + (this.height + this.padding[0] + this.padding[2]))
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
      .style('text-anchor', 'end');

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

  private updatePrognosisGraph(animate: boolean = true): void {
    const historicData = this.dataService.getHistoricCo2Data({
      prognosisDataFilter: [PrognosisDataIndicators.historic],
    });
    const prognosisData = this.dataService.getHistoricCo2Data({
      prognosisDataFilter: [PrognosisDataIndicators.prognosis],
    });
    const allData = this.dataService.getHistoricCo2Data({
      prognosisDataFilter: null,
    });
    this.updatePrognosisAxes(prognosisData, allData, animate);
    this.updatePrognosisLine(historicData, prognosisData, animate);
  }

  private updatePrognosisAxes(dataPrognosis: HistoricCo2Datapoint[], dataAll: HistoricCo2Datapoint[], animate: boolean = true): void {
    const maxValue = this.isSum ? d3.max([
      ...dataAll.map(d => d.co2Sum),
      ...dataAll.map(d => d.co2SumNoLockdown),
      ...dataAll.map(d => d.co2SumLockdown),
    ]) : 120;
    // this.x.domain(d3.extent(dataAll.map(dp => dp.year)));
    this.x.domain([this.sliderLowValue, this.sliderHighValue]);
    this.y.domain([0, maxValue * 1.1]);

    this.prognosisSvg.selectAll('#xAxis')
      .transition()
      .duration(animate ? 1000 : 0)
      .call(this.xAxis as any);

    this.prognosisSvg.selectAll('#yAxis')
      .transition()
      .duration(animate ? 1000 : 0)
      .call(this.yAxis as any);

    this.prognosisSvg.select('#yAxis > text')
      .text('in ' + this.unit);

  }

  private updatePrognosisLine(dataHistoric: HistoricCo2Datapoint[], dataPrognosis: HistoricCo2Datapoint[], animate: boolean = true): void {
    const lineHistoric = this.prognosisSvg.select('.lineHistoric')
      .datum(dataHistoric);

    lineHistoric.enter()
      .merge(lineHistoric as any)
      .transition()
      .duration(animate ? 1000 : 0)
      .attr('d', this.lineHistoric);

    const linePrognosisLockdown = this.prognosisSvg
      .select('.linePrognosisLockdown')
      .datum(dataPrognosis);

    linePrognosisLockdown.enter()
      .merge(linePrognosisLockdown as any)
      .transition()
      .duration(animate ? 1000 : 0)
      .attr('d', this.linePrognosisLockdown);

    const linePrognosisNoLockdown = this.prognosisSvg
      .select('.linePrognosisNoLockdown')
      .datum(dataPrognosis);

    linePrognosisNoLockdown.enter()
      .merge(linePrognosisNoLockdown as any)
      .transition()
      .duration(animate ? 1000 : 0)
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

    const objCo2 = this.hoverService.getHistoricDatapointAtMousePosition(mousePosX, historicData, this.x, historicData.map(d => d.year));
    const year = this.x.invert(mousePosX).toFixed(0);

    if (!objCo2) {
      const objPrognosis =
        this.hoverService.getHistoricDatapointAtMousePosition(mousePosX, prognosisData, this.x, prognosisData.map((d => d.year)));

      tooltipSize[1] = 220;
      this.hoverSelectedDate = [{date: year}];

      this.hoverData = [
        {
          detail: 'Prognosis 1: ',
          text: this.decimalPipe.transform(this.isSum ? objPrognosis.co2SumNoLockdown : objPrognosis.co2PrognosisNoLockdown),
          unit: this.unit,
          fill: '#FF5889'
        },
        {
          detail: 'Prognosis 2: ',
          text: this.decimalPipe.transform(this.isSum ? objPrognosis.co2SumLockdown : objPrognosis.co2PrognosisLockdown),
          unit: this.unit,
          fill: '#85FFBB'
        }
      ];
    } else {
      this.hoverSelectedDate = [{date: year}];
      this.hoverData = [
        {
          detail: 'Emission',
          text: this.decimalPipe.transform(this.isSum ? objCo2.co2Sum : objCo2.mtCo2),
          unit: this.unit,
          fill: 'white'
        }
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
      .attr('y', (data, index) => this.dateTextHeight + (index) * this.bigLineHeight)
      .text(data => (data.text));
    valuesText
      .style('fill', data => data.fill)
      .attr('y', (data, index) => this.dateTextHeight + (index) * this.bigLineHeight)
      .text(data => (data.text));
    // - Units
    const unitsText = tooltipGroup.selectAll('.tooltipUnitsText').selectAll('text').data(tooltipData);
    unitsText.exit().remove();
    unitsText.enter().append('text')
      .attr('class', 'hoverUnitsText')
      .attr('x', 105)
      .attr('y', (data, index) => this.dateTextHeight + (index) * this.bigLineHeight)
      .text(data => (data.unit));
    unitsText
      .attr('y', (data, index) => this.dateTextHeight + (index) * this.bigLineHeight)
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

    const horizontalLineGroup = this.sliderSvg.append('g')
      .attr('class', 'budgetLine')
      .attr('id', 'budgetLineHorizontal');

    horizontalLineGroup
      .append('svg:line')
      .attr('x1', 0)
      .attr('x2', this.width);

    horizontalLineGroup.append('text')
      .attr('x', 10)
      .text('Text');
  }

  private updateCo2BudgetLines(animate: boolean = true): void {
    const total2020 = this.dataService.getTotalEmissionsUntilYear(2020);
    const totalBudget = total2020 + this.dataService.get2020RemainingBudget(this.scenario2degree);

    const depletionYearLockdowns = this.x(this.dataService.getDepletionYear(totalBudget, true));
    const depletionYearNoLockdowns = this.x(this.dataService.getDepletionYear(totalBudget, false));


    this.sliderSvg
      .select('#budgetLineHorizontal')
      .attr('class', this.isSum ? 'budgetLine' : 'budgetLine hidden')
      .select('line')
      .transition()
      .duration(animate ? 1000 : 0)
      .attr('y1', this.isSum ? this.y(totalBudget) : 0)
      .attr('y2', this.isSum ? this.y(totalBudget) : 0);

    this.sliderSvg
      .select('.budgetLine > text')
      .transition()
      .duration(animate ? 1000 : 0)
      .text(`${this.scenario2degree ? '2° C' : '1.5° C'} Budget`)
      .attr('y', this.isSum ? this.y(totalBudget) - 5 : 0);


    this.sliderSvg
      .select('#budgetLineLockdowns')
      .attr('class', this.isSum ? 'budgetLine' : 'budgetLine hidden')
      .transition()
      .duration(animate ? 1000 : 0)
      .attr('x1', depletionYearLockdowns)
      .attr('x2', depletionYearLockdowns);

    this.sliderSvg
      .select('#budgetLineNoLockdowns')
      .attr('class', this.isSum ? 'budgetLine' : 'budgetLine hidden')
      .transition()
      .duration(animate ? 1000 : 0)
      .attr('x1', depletionYearNoLockdowns)
      .attr('x2', depletionYearNoLockdowns);
  }

  // slider onChange low
  valueChange(value: number): void {
    this.sliderLowValue = value;
    this.updatePrognosisGraph(false);
    this.updateCo2BudgetLines(false);
  }

  // slider onChange high
  valueChangeHigh(highValue: number): void {
    this.sliderHighValue = highValue;
    this.updatePrognosisGraph(false);
    this.updateCo2BudgetLines(false);
  }
}
