import { Component, OnInit } from '@angular/core';
import * as d3 from 'd3';
import {DataService} from '../core/services/data.service';

@Component({
  selector: 'app-prognosis-graph',
  templateUrl: './prognosis-graph.component.html',
  styleUrls: ['./prognosis-graph.component.scss']
})
export class PrognosisGraphComponent implements OnInit {

  constructor(private dataService: DataService) { }

  ngOnInit(): void {
  }

}
