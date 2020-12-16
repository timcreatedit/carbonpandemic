import {AfterViewInit, Component, ElementRef, EventEmitter, OnInit, Output, ViewChild} from '@angular/core';
import {Countries, Sectors} from '../core/models/co2data.model';

@Component({
  selector: 'app-top-bar',
  templateUrl: './top-bar.component.html',
  styleUrls: ['./top-bar.component.scss']
})
export class TopBarComponent implements OnInit{

  @Output() selectCountry: EventEmitter<Countries> = new EventEmitter<Countries>();

  countries: string[] = Object.keys(Countries).map(k => Countries[k]);
  sectorKeys: any;

  selectedCountry: string;

  ngOnInit(): void {
    this.selectedCountry = Countries.world.toString();
    this.updateCountry(this.selectedCountry);
  }

  updateCountry(countryName: string): void {
    this.selectCountry.emit(countryName as Countries);
  }

  // TODO
  // sectorKeysChanged(value): void {
  //   this.sectorKeys = value;
  // }
}
