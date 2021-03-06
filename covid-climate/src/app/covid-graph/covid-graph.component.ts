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
import {distinctUntilChanged} from 'rxjs/operators';
import {DataService} from '../core/services/data.service';
import {Co2Datapoint, Countries, Sectors} from '../core/models/data/co2data.model';
import {isNotNullOrUndefined} from 'codelyzer/util/isNotNullOrUndefined';
import {CovidDatapoint} from '../core/models/data/coviddata.model';
import {Lockdown, LockdownDatapoint} from '../core/models/data/lockdowndata.model';
import {DatePipe, DecimalPipe} from '@angular/common';
import {ScrollService} from '../core/services/scroll.service';
import {LockdownService} from '../core/services/lockdown.service';
import {HoverService} from '../core/services/hover.service';
import {HoverData} from '../core/models/hoverdata.model';
import {ColorService} from '../core/services/color.service';

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
  @Input() selectedSectors: Sectors[] = [Sectors.power];
  @Input() showSectors: boolean;
  @Input() showDifference: boolean;

  @Output() worstDayOf20 = new EventEmitter<Co2Datapoint>();

  private showAbsolute = 'absolute';
  private mouseOverGraph = false;
  private mouseCoordinates: [number, number] = [0, 0];

  toolX = 0;
  toolY = 0;
  // region size
  width = 1400;
  height = 400;

  // top right bottom left
  padding: [number, number, number, number] = [50, 0, 20, 100];

  // endregion
  yAxisText = 'in MtCO2/d';

  // region data
  private data19: Co2Datapoint[];
  private data20: Co2Datapoint[];

  private dataWorld19: Co2Datapoint[];
  private dataWorld20: Co2Datapoint[];

  private dataSectors;

  private dataCovid: CovidDatapoint[];
  private lockdownData: LockdownDatapoint[];

  private lockdowns: Lockdown[] = [];
  // endregion

  // hover options

  private hoverData: HoverData[] = [
    {text: '0', unit: 'MtCo2', percent: '', fill: '#63f2ff', xText: 0, xUnit: 0, xPercent: 0},
    {text: '0', unit: 'MtCo2', percent: '', fill: 'white', xText: 0, xUnit: 0, xPercent: 0}
  ];
  private hoverCovidData: HoverData[] = [
    {text: '0', unit: 'New cases', percent: '', fill: this.colorService.colorCovidCases, xText: 0, xUnit: 0, xPercent: 0}
  ];

  private hoverDate = [{date: '-'}];
  private hoverCovidDate = [{date: '-'}];

  // alignment
  private dateTextHeight = 40;
  private lineHeight = 30;

  private hoverDateX = 20;
  private hoverValuesX = 110;
  private hoverUnitsX = 115;
  private hoverPercentX = 180;
  private hoverDescribeX = 20;

  private tooltipDifferenceHeight = this.dateTextHeight + 45;
  private tooltipSectorsHeight = this.dateTextHeight + 20;

  private tooltipNormalHeight = this.dateTextHeight + 75;
  private tooltipNormalWidth = 200;
  private tooltipSectorWidth = 265;

  private tooltipCovidWidth = 240;
  private tooltipCovidHeight = this.dateTextHeight + 45 + 40;
  private tooltipCovidLockdownWidth = 345;
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

  constructor(private dataService: DataService,
              private lockdownService: LockdownService,
              private hoverService: HoverService,
              private scrollService: ScrollService,
              private colorService: ColorService,
              private decimalPipe: DecimalPipe,
              private datePipe: DatePipe,
  ) {
  }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    this.graphSvg = this.graph.nativeElement;
    this.covidGraphSvg = this.covidGraph.nativeElement;
    this.initOrUpdateData();
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
      this.initOrUpdateData();
      this.updateGraph();
      this.updateCovidGraph();
    }
    if (isNotNullOrUndefined(changes.selectedSectors)) {
      this.initOrUpdateData();
      this.updateGraph();
    }
    if (isNotNullOrUndefined(changes.showSectors?.currentValue)) {
      this.updateShowSectors(changes.showSectors.currentValue);
      this.updateGraph();
    }
    if (isNotNullOrUndefined(changes.showDifference?.currentValue)) {
      this.updateShowDifference(changes.showDifference.currentValue);
    }
    if (this.mouseOverGraph) {
      this.mousemoveGraphOne();
    }
  }

  onToggleChange(value): void {
    if (this.showAbsolute !== value) {
      this.showAbsolute = value;
      this.updateGraph();
      this.initOrUpdateData();
    } else {
      this.showAbsolute = value;
    }
  }

  private initOrUpdateData(): void {
    this.data19 = this.dataService.getCo2Data({
      yearFilter: [2019],
      countryFilter: [this.selectedCountry],
      sumSectors: true,
    });

    this.data20 = this.dataService.getCo2Data({
      yearFilter: [2020],
      countryFilter: [this.selectedCountry],
      sumSectors: true,
    });

    this.dataSectors = this.dataService.getSectorsPerDay(this.selectedCountry, this.selectedSectors, this.showAbsolute);

    this.dataCovid = this.dataService.getCovidData({
      countryFilter: [this.selectedCountry]
    });

    this.lockdownData = this.lockdownService.getLockdownData({
      countryFilter: [this.selectedCountry],
    });

    this.lockdowns = this.lockdownService.getLockdowns(this.selectedCountry);

    this.dataWorld19 = this.dataService.getCo2Data({
      yearFilter: [2019],
      countryFilter: [Countries.world],
      sumSectors: true,
    });
    this.dataWorld20 = this.dataService.getCo2Data({
      yearFilter: [2020],
      countryFilter: [Countries.world],
      sumSectors: true,
    });

    switch (this.showAbsolute) {
      case 'absolute':
        this.yAxisText = 'in MtCO2/d';
        break;
      case 'relativeToWorld':
        this.yAxisText = 'in %';
        this.data19 = this.data19.map((d, i) => {
          d.mtCo2 = (d.mtCo2 / this.dataWorld19[i].mtCo2) * 100;
          return d;
        });

        this.data20 = this.data20.map((d, i) => {
          d.mtCo2 = (d.mtCo2 / this.dataWorld20[i].mtCo2) * 100;
          return d;
        });

        break;
      case 'relativeToPopulation':
        this.yAxisText = 'in tCO2/d p.P.';
        const countryPopulation = this.dataService.getPopulation(this.selectedCountry);

        this.data19 = this.data19.map((d, i) => {
          d.mtCo2 = (d.mtCo2 / countryPopulation) * 1000000;
          return d;
        });
        this.data20 = this.data20.map((d, i) => {
          d.mtCo2 = (d.mtCo2 / countryPopulation) * 1000000;
          return d;
        });
        break;
      default:
        break;
    }
  }

  private initGraph(): void {
    this.svg = d3.select(this.graphSvg);

    this.svg.attr('preserveAspectRatio', 'xMinYMin meet')
      .attr('viewBox', '-'
        + this.padding[3] + ' -'
        + this.padding[0] + ' '
        + (this.width + this.padding[1] + this.padding[3]) + ' '
        + (this.height + this.padding[0] + this.padding[2]))
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
      .attr('id', 'yAxisText')
      .attr('dy', '.75em')
      .attr('y', -30)
      .attr('x', 30)
      .style('text-anchor', 'end')
      .text(this.yAxisText);

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
        + this.padding[3] + ' -'
        + this.padding[0] + ' '
        + (this.width + this.padding[1] + this.padding[3]) + ' '
        + (this.height + this.padding[0] + this.padding[2]))
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
      .attr('x', this.hoverDateX);

    tooltip.append('g')
      .attr('class', 'tooltipValuesText')
      .selectAll('text').data(data).enter().append('text')
      .attr('class', 'hoverValuesText')
      .attr('x', this.hoverValuesX);

    tooltip.append('g')
      .attr('class', 'tooltipUnitsText')
      .selectAll('text').data(data).enter().append('text')
      .attr('class', 'hoverUnitsText')
      .attr('x', this.hoverUnitsX);

    tooltip.append('g')
      .attr('class', 'tooltipPercentText')
      .selectAll('text').data(data).enter().append('text')
      .attr('class', 'hoverPercentText')
      .attr('x', this.hoverPercentX);
  }

  private initGraphOneHover(): void {
    // this is the vertical line to follow mouse
    const line = this.svg.append('svg:rect')
      .attr('class', 'mouseLine')
      .attr('height', this.height)
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
    const tooltipSize = [this.tooltipNormalWidth, this.tooltipNormalHeight]; // width, height
    let unit = '';
    switch (this.showAbsolute) {
      case 'absolute':
        unit = 'MtCo2';
        break;
      case 'relativeToWorld':
        unit = '%';
        break;
      case 'relativeToPopulation':
        unit = 'tCO2/d';
        break;
      default:
        break;
    }

    // Only update mouseCoordinates when d3 actually has any
    this.mouseCoordinates = d3.pointer(event)[0] ? d3.pointer(event) : this.mouseCoordinates;
    const mousePosX = this.mouseCoordinates[0];
    const mousePosY = this.mouseCoordinates[1];

    // Values to mousePos
    const obj19 = this.hoverService.getCo2DataAtMousePosition(mousePosX, this.data19, this.x19);
    const obj20 = this.hoverService.getCo2DataAtMousePosition(mousePosX, this.data20, this.x20);
    const obj20Sectors = this.hoverService.getSectorStackAtDatapoint(mousePosX, this.dataSectors, this.x20);

    // recover coordinate we need
    if (this.showDifference) {
      // DIFFERENCE BETWEEN YEARS
      tooltipSize[1] = this.tooltipDifferenceHeight;
      tooltipSize[0] = this.tooltipSectorWidth;

      const difference = obj20.mtCo2 - obj19.mtCo2;
      const percent = ((Math.abs(obj20.mtCo2 - obj19.mtCo2) / obj19.mtCo2) * 100).toFixed(1);
      const fill = difference < 0 ? this.colorService.colorPositive : this.colorService.colorNegative;
      const prefix = difference < 0 ? '' : '+';
      this.hoverData = [
        {
          text: `${prefix}${this.decimalPipe.transform(difference)}`,
          unit,
          percent: '(' + percent + '%)',
          fill,
          xText: this.hoverValuesX,
          xUnit: this.hoverUnitsX,
          xPercent: this.hoverPercentX
        }
      ];

      this.hoverDate = [{date: this.getDateString(mousePosX, this.data20, ' 19/20')}];
      this.updateTooltip('tooltipGroup', tooltipSize[1], tooltipSize[0], this.hoverData, this.hoverDate);
    }
    if (this.showSectors) {
      this.hoverDate = [{date: this.getDateString(mousePosX, this.data20, ' 2020')}];
      this.hoverData = [];
      const sectorsInDate = Object.keys(obj20Sectors).filter(k => k !== 'date').reverse();
      const sectorSum: number = Object.keys(obj20Sectors)
        .filter(k => k !== 'date')
        .map(k => obj20Sectors[k] as number)
        .reduce((a, b) => a + b);

      for (const sector of sectorsInDate) {
        const value = obj20Sectors[sector] as number;
        this.hoverData.push(
          {
            text: this.decimalPipe.transform(value),
            unit,
            percent: sectorsInDate.length > 1 ? '(' + ((value / sectorSum) * 100).toFixed(1).toString() + '%)' : '',
            fill: this.colorService.getColorForSector(sector as Sectors),
            xText: this.hoverValuesX,
            xUnit: this.hoverUnitsX,
            xPercent: this.hoverPercentX
          }
        );
      }
      tooltipSize[1] = this.tooltipSectorsHeight + 30 * sectorsInDate.length;
      tooltipSize[0] = this.tooltipSectorWidth;
      this.updateTooltip('tooltipGroup', tooltipSize[1], tooltipSize[0], this.hoverData, this.hoverDate);
    }
    if (!this.showSectors && !this.showDifference) {
      tooltipSize[1] = this.tooltipNormalHeight;

      this.hoverDate = [{date: this.getDateString(mousePosX, this.data20, ' 19/20')}];
      this.hoverData = [
        {
          text: this.decimalPipe.transform(obj19.mtCo2), unit, percent: '', fill: this.colorService.colorLine19,
          xText: this.hoverValuesX, xUnit: this.hoverUnitsX, xPercent: this.hoverPercentX
        },
        {
          text: this.decimalPipe.transform(obj20.mtCo2), unit, percent: '', fill: this.colorService.colorLine20,
          xText: this.hoverValuesX, xUnit: this.hoverUnitsX, xPercent: this.hoverPercentX
        }
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
      .attr('height', this.height)
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
    const tooltipSize = [this.tooltipCovidWidth, this.tooltipCovidHeight]; // width, height

    const mouseCoordinates: [number, number] = d3.pointer(event);
    const mousePosX = mouseCoordinates[0];
    const mousePosY = mouseCoordinates[1];

    const objCovid = this.hoverService.getCovidDataAtMousePosition(mousePosX, this.dataCovid, this.x20);

    if (this.selectedCountry === 'WORLD' || this.selectedCountry === 'ROW' || this.selectedCountry === 'EU27 & UK') {
      tooltipSize[1] = this.tooltipCovidHeight - 40;
      this.hoverCovidData = [
        {
          text: this.decimalPipe.transform(objCovid.cases), unit: 'New cases', percent: '', fill: this.colorService.colorCovidCases,
          xText: this.hoverValuesX, xUnit: this.hoverUnitsX, xPercent: this.hoverPercentX
        }
      ];
    } else {
      tooltipSize[1] = this.tooltipCovidHeight;

      const objLockdown = this.hoverService.getLockdownDataAtMousePosition(mousePosX, this.lockdownData, this.x20);
      let xV = this.hoverValuesX;
      let xU = this.hoverUnitsX;

      let lockdownStatus = 'No';
      if (objLockdown.lockdown) {
        const lockdown: Lockdown = this.lockdowns
          .find(l => l.start.date.getTime() <= objLockdown.date.getTime() && l.end.date.getTime() >= objLockdown.date.getTime());
        const start = this.datePipe.transform(lockdown.start.date, 'MMM d');
        const end = this.datePipe.transform(lockdown.end.date, 'MMM d');
        lockdownStatus = start + ' - ' + end;

        tooltipSize[0] = this.tooltipCovidLockdownWidth;
        xV = 215;
        xU = 220;
      }

      this.hoverCovidData = [
        {
          text: this.decimalPipe.transform(objCovid.cases), unit: 'New cases', percent: '', fill: this.colorService.colorCovidCases,
          xText: xV, xUnit: xU, xPercent: this.hoverPercentX
        },
        {
          text: lockdownStatus, unit: 'Lockdown', percent: '', fill: this.colorService.colorCovidLockdown,
          xText: xV, xUnit: xU, xPercent: this.hoverPercentX
        }
      ];
    }
    this.hoverCovidDate = [{date: this.getDateString(mousePosX, this.dataCovid, ' 2020')}];

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
  private getDateString(mousePosX: number, data: { date: Date }[], year: string): string {
    return this.datePipe.transform(this.hoverService.getDateAtPos(mousePosX, data, this.x20), 'MMM d') + year;
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
      .attr('x', data => data.xText)
      .style('fill', data => data.fill)
      .attr('y', (data, index) => this.dateTextHeight + (index + 1) * this.lineHeight)
      .text(data => (data.text));
    valuesText
      .style('fill', data => data.fill)
      .attr('x', data => data.xText)
      .attr('y', (data, index) => this.dateTextHeight + (index + 1) * this.lineHeight)
      .text(data => (data.text));
    // - Units
    const unitsText = tooltipGroup.selectAll('.tooltipUnitsText').selectAll('text').data(tooltipData);
    unitsText.exit().remove();
    unitsText.enter().append('text')
      .attr('class', 'hoverUnitsText')
      .attr('x', data => data.xUnit)
      .attr('y', (data, index) => this.dateTextHeight + (index + 1) * this.lineHeight)
      .text(data => (data.unit));
    unitsText
      .attr('y', (data, index) => this.dateTextHeight + (index + 1) * this.lineHeight)
      .attr('x', data => data.xUnit)
      .text(data => (data.unit));
    // - Percent
    const percentText = tooltipGroup.selectAll('.tooltipPercentText').selectAll('text').data(tooltipData);
    percentText.exit().remove();
    percentText.enter().append('text')
      .attr('class', 'hoverPercentText')
      .attr('x', data => data.xPercent)
      .style('fill', data => data.fill)
      .attr('y', (data, index) => this.dateTextHeight + (index + 1) * this.lineHeight)
      .text(data => (data.percent));
    percentText
      .style('fill', data => data.fill)
      .attr('x', data => data.xPercent)
      .attr('y', (data, index) => this.dateTextHeight + (index + 1) * this.lineHeight)
      .text(data => (data.percent));
  }

  // HOVER END

  private updateGraph(): void {
    let data19 = this.dataService.getCo2Data({
      yearFilter: [2019],
      countryFilter: [this.selectedCountry],
      sumSectors: true,
    });
    let data20 = this.dataService.getCo2Data({
      yearFilter: [2020],
      countryFilter: [this.selectedCountry],
      sumSectors: true,
    });
    const sectorData = this.dataService.getSectorsPerDay(this.selectedCountry, this.selectedSectors, this.showAbsolute, true);

    // RELATIVE DATA
    const dataWorld19 = this.dataService.getCo2Data({
      yearFilter: [2019],
      countryFilter: [Countries.world],
      sumSectors: true,
    });
    const dataWorld20 = this.dataService.getCo2Data({
      yearFilter: [2020],
      countryFilter: [Countries.world],
      sumSectors: true,
    });

    const countryPopulation = this.dataService.getPopulation(this.selectedCountry);

    switch (this.showAbsolute) {
      case 'absolute':
        this.yAxisText = 'in MtCO2/d';
        break;
      case 'relativeToWorld':
        this.yAxisText = 'in %';
        data19 = data19.map((d, i) => {
          d.mtCo2 = (d.mtCo2 / dataWorld19[i].mtCo2) * 100;
          return d;
        });

        data20 = data20.map((d, i) => {
          d.mtCo2 = (d.mtCo2 / dataWorld20[i].mtCo2) * 100;
          return d;
        });

        break;
      case 'relativeToPopulation':
        this.yAxisText = 'in tCO2/d p.P.';
        data19 = data19.map((d, i) => {
          d.mtCo2 = (d.mtCo2 / countryPopulation) * 1000000;
          return d;
        });
        data20 = data20.map((d, i) => {
          d.mtCo2 = (d.mtCo2 / countryPopulation) * 1000000;
          return d;
        });
        break;
      default:
        break;
    }
    // END RELATIVE DATA

    this.updateAxes(data19, data20);
    this.updateLines(data19, data20);
    this.updateDifferenceArea(data19, data20);
    this.updateSectorStacks(sectorData);
  }

  private updateCovidGraph(): void {
    const covidData = this.dataService.getCovidData({
      countryFilter: [this.selectedCountry],
    });

    this.updateCovidAxes(covidData);
    this.updateCovidLines(covidData);
    this.updateLockdownArea(this.lockdownData);
  }

  private updateShowDifference(show: boolean): void {
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

  private updateShowSectors(show: boolean): void {
    const line19 = this.svg.select('.line19');
    const line20 = this.svg.select('.line20');
    const sectors = this.svg.selectAll('.sectorArea');

    if (show) {
      line19.attr('class', 'line19 hidden');
      line20.attr('class', 'line20 hidden');
      sectors.attr('class', 'sectorArea');
    } else {
      if (!this.showDifference) {
        line19.attr('class', 'line19');
      }
      line20.attr('class', 'line20');
      sectors.attr('class', 'sectorArea hidden');
    }
  }

  private updateAxes(data19: Co2Datapoint[], data20: Co2Datapoint[]): void {
    const data = this.showSectors
      ? this.dataService.getCo2Data({
        yearFilter: [2020],
        countryFilter: [this.selectedCountry],
        sectorFilter: this.selectedSectors,
        sumSectors: true
      }).map(dp => dp.mtCo2)
      : [...data19.map(d => d.mtCo2), ...data20.map(d => d.mtCo2)];
    const maxValue = d3.max(data) * 1.1;
    this.x19.domain(d3.extent(data19.map(dp => dp.date)));
    this.x20.domain(d3.extent(data20.map(dp => dp.date)));

    switch (this.showAbsolute) {
      case 'absolute':
        this.y.domain([0, maxValue]);
        break;
      case 'relativeToWorld':
        this.y.domain([0, 100]);
        break;
      case 'relativeToPopulation':
        this.y.domain([0, 0.07]);
        break;
      default:
        break;
    }

    this.svg.select('#xAxis')
      .transition()
      .duration(1)
      .call(this.xAxis as any);

    this.svg.select('#yAxis')
      .transition()
      .duration(1000)
      .call(this.yAxis as any);

    document.getElementById('yAxisText').textContent = this.yAxisText;
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
    // Red Area
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

    // Green Area
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

  private updateSectorStacks(data: { [p: string]: number | Date }[]): void {
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
