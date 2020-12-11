import {AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild} from '@angular/core';
import * as d3 from 'd3';
import {DataService} from '../core/services/data.service';
import {Co2Datapoint, Countries} from '../core/models/co2data.model';

@Component({
  selector: 'app-covid-graph',
  templateUrl: './covid-graph.component.html',
  styleUrls: ['./covid-graph.component.scss']
})
export class CovidGraphComponent implements OnInit, AfterViewInit {

  @ViewChild('graph') graph: ElementRef<SVGElement>;
  @Input() selectedCountry: Countries;
  @Input() co2Data: Co2Datapoint[];

  width = 100;
  height = 100;

  private graphSvg: SVGElement;

  constructor(private dataService: DataService) {
  }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    this.graphSvg = this.graph.nativeElement;
    this.initGraph();
  }

  initGraph(): void {

    const x = d3.scaleTime().range([0, this.width]);
    const y = d3.scaleLinear().range([this.height, 0]);

    x.domain();

    const xAxis = d3.svg.axis().scale(x).orient('bottom');
    const yAxis = d3.svg.axis().scale(y).orient('left');
    d3.select(this.graphSvg).append('rect')
      .attr('x', 10)
      .attr('y', 10)
      .attr('width', 50)
      .attr('height', 50)
      .style('fill', 'red');
  }

}
