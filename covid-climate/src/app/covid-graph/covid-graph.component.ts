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

  private mouseOverGraph = false;

  toolX = 0;
  toolY = 0;
  // region size
  width = 1400;
  height = 300;
  adj = 70;
  // endregion

  // hover options
  private hoverData = [
    {text: '0', unit: 'MtCo2', percent: '', fill: '#63f2ff'},
    {text: '0', unit: 'MtCo2', percent: '', fill: 'white'}
  ];
  private hoverCovidData = [
    {text: '0', unit: 'New cases', percent: '', fill: '#FF5889'}
  ];

  private hoverDate = [{date: '-'}];
  private hoverCovidDate = [{date: '-'}];

  private dateTextHeight = 40;
  private lineHeight = 30;
  // end hover options

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
    .y1(d => d.lockdown ? 0 : this.height);

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
    // hover
    this.initGraphOneHover();
    this.initGraphCovidHover();
    // updates
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
    if (this.mouseOverGraph) {
      this.mousemoveGraphOne();
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

  // HOVER START
  private initTooltipSvg(group: any, data: any): void {
    const tooltip = group.append('g');

    tooltip.selectAll('rect').data(data).enter().append('rect')
      .attr('class', 'tooltip');

    tooltip.append('g')
      .attr('class', 'tooltipDateGroup')
      .selectAll('text').data(data).enter().append('text')
      .attr('class', 'tooltipHoverDate')
      .attr('y', this.lineHeight)
      .attr('x', 20);

    tooltip.append('g')
      .attr('class', 'tooltipValuesText')
      .selectAll('text').data(data).enter().append('text')
      .attr('class', 'hoverValuesText')
      .attr('x', 90);

    tooltip.append('g')
      .attr('class', 'tooltipUnitsText')
      .selectAll('text').data(data).enter().append('text')
      .attr('class', 'hoverUnitsText')
      .attr('x', 95);

    tooltip.append('g')
      .attr('class', 'tooltipPercentText')
      .selectAll('text').data(data).enter().append('text')
      .attr('class', 'hoverPercentText')
      .attr('x', 160);
  }

  private initGraphOneHover(): void {
    // this is the vertical line to follow mouse
    const line = this.svg.append('svg:rect')
      .attr('class', 'mouseLine')
      .style('opacity', '0');

    // general group to hide or show the tooltip
    const tooltipGroup = this.svg.append('g')
      .attr('class', 'tooltipGroup')
      .style('opacity', '0');

    // Tooltip for year 2019 and 2020
    this.initTooltipSvg(tooltipGroup, this.hoverData);

    // append a rect to catch mouse movements on canvas
    this.svg.append('svg:rect')
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
        this.mousemoveGraphOne();
        this.mousemoveCovid();
      });
  }

  private mousemoveGraphOne(): void {
    // Data
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
    const dataSectors = this.dataService.getSectorsPerDay(this.selectedCountry);

    const tooltipSize = [240, 0]; // width, height

    const mouseCoordinates: [number, number] = d3.pointer(event);
    const mousePosX = mouseCoordinates[0];
    const mousePosY = mouseCoordinates[1];

    const obj19 = this.getObjectToMousePos(mousePosX, data19, true);
    const obj20 = this.getObjectToMousePos(mousePosX, data20, false);
    const obj20Sectors = this.getObjectToMousePos(mousePosX, dataSectors, false);

    // recover coordinate we need
    if (this.showDifference) {
      // DIFFERENCE BETWEEN YEARS
      tooltipSize[1] = this.dateTextHeight + 45;

      let difference = (obj20.mtCo2 - obj19.mtCo2).toFixed(3);
      const percent = (Math.abs(obj20.mtCo2 - obj19.mtCo2) / obj19.mtCo2).toFixed(2);
      let fill = '#FF5889';
      if (parseFloat(difference) < 0) {
        fill = '#84ffbb';
      } else {
        difference = '+' + difference;
      }
      this.hoverData = [
        {text: difference, unit: 'MtCo2', percent: '(' + percent.toString() + '%)', fill}
      ];

      this.hoverDate = [{date: this.getDateString(mousePosX, ' 19/20')}];
      this.updateTooltip('tooltipGroup', tooltipSize[1], tooltipSize[0], this.hoverData, this.hoverDate);
    }
    if (this.showSectors) {
      // SECTOR LAYERS
      tooltipSize[1] = this.dateTextHeight + 165;

      this.hoverDate = [{date: this.getDateString(mousePosX, ' 2020')}];
      this.hoverData = [
        {
          text: (obj20Sectors['Domestic Aviation']).toFixed(3), unit: 'MtCo2',
          percent: '(' + (obj20Sectors['Domestic Aviation'] / obj20.mtCo2).toFixed(2).toString() + '%)', fill: '#3497F1'
        },
        {
          text: (obj20Sectors.Residential).toFixed(3), unit: 'MtCo2',
          percent: '(' + (obj20Sectors.Residential / obj20.mtCo2).toFixed(2).toString() + '%)', fill: '#F63078'
        },
        {
          text: (obj20Sectors.Industry).toFixed(3), unit: 'MtCo2',
          percent: '(' + (obj20Sectors.Industry / obj20.mtCo2).toFixed(2).toString() + '%)', fill: '#941EF1'
        },
        {
          text: (obj20Sectors['Ground Transport']).toFixed(3), unit: 'MtCo2',
          percent: '(' + (obj20Sectors['Ground Transport'] / obj20.mtCo2).toFixed(2).toString() + '%)', fill: '#20E74B'
        },
        {
          text: (obj20Sectors.Power).toFixed(3), unit: 'MtCo2',
          percent: '(' + (obj20Sectors.Power / obj20.mtCo2).toFixed(2).toString() + '%)', fill: '#FFDB21'
        }
      ];

      this.updateTooltip('tooltipGroup', tooltipSize[1], tooltipSize[0], this.hoverData, this.hoverDate);
    }
    if (!this.showSectors && !this.showDifference) {
      // LINES
      tooltipSize[1] = this.dateTextHeight + 75;
      tooltipSize[0] = 200;

      this.hoverDate = [{date: this.getDateString(mousePosX, ' 19/20')}];
      this.hoverData = [
        {text: (obj19.mtCo2).toFixed(3), unit: 'MtCo2', percent: '', fill: '#63f2ff'},
        {text: (obj20.mtCo2).toFixed(3), unit: 'MtCo2', percent: '', fill: 'white'}
      ];

      this.updateTooltip('tooltipGroup', tooltipSize[1], tooltipSize[0], this.hoverData, this.hoverDate);
    }
    let translateX = (mousePosX + 20);
    let translateY = (mousePosY - 20);
    if (mousePosY + tooltipSize[1] - 20 > parseFloat(this.svg.style('height'))) {
      translateY = (mousePosY - tooltipSize[1] + 20);
    }
    if (mousePosX + tooltipSize[0] + 20 > this.width) {
      translateX = (mousePosX - (tooltipSize[0] + 20));
    }
    this.svg.select('.tooltipGroup')
      .attr('transform', 'translate(' + translateX + ' , ' + translateY + ')');

    this.svg.select('.mouseLine')
      .attr('x', mousePosX);
  }

  private mouseover(): void {
    this.mouseOverGraph = true;
    this.svg.select('.tooltipGroup')
      .style('opacity', '1');
    this.svg.select('.mouseLine')
      .style('opacity', '0.7');
    this.covidSvg.select('.tooltipCovidGroup')
      .style('opacity', '1');
    this.covidSvg.select('.mouseLine')
      .style('opacity', '0.7');
  }

  private mouseout(): void {
    this.mouseOverGraph = false;
    this.svg.select('.tooltipGroup')
      .style('opacity', '0');
    this.svg.select('.mouseLine')
      .style('opacity', '0');
    this.covidSvg.select('.tooltipCovidGroup')
      .style('opacity', '0');
    this.covidSvg.select('.mouseLine')
      .style('opacity', '0');
  }

  // covid hover
  private initGraphCovidHover(): void {
    // this is the vertical line to follow mouse
    const line = this.covidSvg.append('svg:rect')
      .attr('class', 'mouseLine')
      .style('opacity', '0');

    // general group to hide or show the tooltip
    const tooltipCovidGroup = this.covidSvg.append('g')
      .attr('class', 'tooltipCovidGroup')
      .style('opacity', '0');
    // Tooltip for year 2019 and 2020
    this.initTooltipSvg(tooltipCovidGroup, this.hoverCovidData);

    // append a rect to catch mouse movements on canvas
    this.covidSvg.append('svg:rect')
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
        this.mousemoveGraphOne();
        this.mousemoveCovid();
      });
  }

  private mousemoveCovid(): void {
    // Data
    const dataCovid = this.dataService.getCovidData({
      countryFilter: [this.selectedCountry]
    });

    const tooltipSize = [220, this.dateTextHeight + 45]; // width, height

    const mouseCoordinates: [number, number] = d3.pointer(event);
    const mousePosX = mouseCoordinates[0];
    const mousePosY = mouseCoordinates[1];

    const objCovid = this.getObjectToMousePos(mousePosX, dataCovid, false);

    this.hoverCovidDate = [{date: this.getDateString(mousePosX, ' 2020')}];
    this.hoverCovidData = [{text: objCovid.cases, unit: 'New cases', percent: '', fill: '#FF5889'}];

    this.updateTooltip('tooltipCovidGroup', tooltipSize[1], tooltipSize[0], this.hoverCovidData, this.hoverCovidDate);

    // line and tooltip movement
    let translateX = (mousePosX + 20);
    let translateY = (mousePosY - 20);

    if (mousePosY + tooltipSize[1] - 20 > parseFloat(this.svg.style('height'))) {
      translateY = (mousePosY - tooltipSize[1] + 20);
    }
    if (mousePosX + tooltipSize[0] + 20 > this.width) {
      translateX = (mousePosX - (tooltipSize[0] + 20));
    }

    this.covidSvg.select('.tooltipCovidGroup')
      .attr('transform', 'translate(' + translateX + ' , ' + translateY + ')');

    this.covidSvg.select('.mouseLine')
      .attr('x', mousePosX);
  }

  // Helper functions
  private getDateString(mousePosX: number, year: string): string {
    const dateToMousePosX = this.x20.invert(mousePosX).toDateString();
    const removeFirstWord = dateToMousePosX.substr(dateToMousePosX.indexOf(' ') + 1);
    const resultString = removeFirstWord.substr(0, removeFirstWord.lastIndexOf(' '));
    return resultString + year;
  }

  private getObjectToMousePos(xPos: number, data: any, is19Data: boolean): any {
    if (is19Data) {
      const x19i = this.x19.invert(xPos);
      const dataDates = data.map(dp => dp.date);
      const sub = d3.bisect(dataDates, x19i);
      return data[sub];
    } else {
      const x20i = this.x20.invert(xPos);
      const dataDates = data.map(dp => dp.date);
      const sub = d3.bisect(dataDates, x20i);
      return data[sub];
    }
  }

  private updateTooltip(tooltipGroupName: string, tooltipHeight: number, tooltipWidth: number,
                        tooltipDataInput: any, tooltipDateInput: any): void {
    let tooltipData = this.hoverData;
    let tooltipDate = this.hoverDate;
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
      .attr('x', 90)
      .style('fill', data => data.fill)
      .attr('y', (data, index) => this.dateTextHeight + (index + 1) * this.lineHeight)
      .text(data => (data.text));
    valuesText
      .style('fill', data => data.fill)
      .attr('y', (data, index) => this.dateTextHeight + (index + 1) * this.lineHeight)
      .text(data => (data.text));
    // - Units
    const unitsText = tooltipGroup.selectAll('.tooltipUnitsText').selectAll('text').data(tooltipData);
    unitsText.exit().remove();
    unitsText.enter().append('text')
      .attr('class', 'hoverUnitsText')
      .attr('x', 95)
      .attr('y', (data, index) => this.dateTextHeight + (index + 1) * this.lineHeight)
      .text(data => (data.unit));
    unitsText
      .attr('y', (data, index) => this.dateTextHeight + (index + 1) * this.lineHeight)
      .text(data => (data.unit));
    // - Percent
    const percentText = tooltipGroup.selectAll('.tooltipPercentText').selectAll('text').data(tooltipData);
    percentText.exit().remove();
    percentText.enter().append('text')
      .attr('class', 'hoverPercentText')
      .attr('x', 160)
      .style('fill', data => data.fill)
      .attr('y', (data, index) => this.dateTextHeight + (index + 1) * this.lineHeight)
      .text(data => (data.percent));
    percentText
      .style('fill', data => data.fill)
      .attr('y', (data, index) => this.dateTextHeight + (index + 1) * this.lineHeight)
      .text(data => (data.percent));
  }

  // HOVER END

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
