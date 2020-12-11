import {Component, Input, OnInit} from '@angular/core';
import * as d3 from 'd3';
import {DataService} from '../core/services/data.service';
import {Countries} from '../core/models/co2data.model';

@Component({
  selector: 'app-prognosis-graph',
  templateUrl: './prognosis-graph.component.html',
  styleUrls: ['./prognosis-graph.component.scss']
})
export class PrognosisGraphComponent implements OnInit {

  @Input() selectedCountry: Countries;

  constructor(private dataService: DataService) { }

  ngOnInit(): void {
  }

}
