import {AfterViewInit, Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import * as d3 from 'd3';
import {DataService} from '../core/services/data.service';

@Component({
  selector: 'app-covid-graph',
  templateUrl: './covid-graph.component.html',
  styleUrls: ['./covid-graph.component.scss']
})
export class CovidGraphComponent implements OnInit, AfterViewInit {

  @ViewChild('graph') graph: ElementRef<SVGElement>;

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
    d3.select(this.graphSvg).append('rect')
      .attr('x', 10)
      .attr('y', 10)
      .attr('width', 50)
      .attr('height', 50)
      .style('fill', 'red');
  }

}
