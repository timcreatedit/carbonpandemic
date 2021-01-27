import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {Countries} from '../core/models/data/co2data.model';
import {ScrollService} from '../core/services/scroll.service';
import {filter} from "rxjs/operators";

@Component({
  selector: 'app-top-bar',
  templateUrl: './top-bar.component.html',
  styleUrls: ['./top-bar.component.scss']
})
export class TopBarComponent implements OnInit {

  @Output() selectCountry: EventEmitter<Countries> = new EventEmitter<Countries>();

  countries: string[] = Object.keys(Countries).map(k => Countries[k]);
  sectorKeys: any;

  selectedCountry: string = Countries.world;

  constructor(readonly scrollService: ScrollService) {
  }

  ngOnInit(): void {
    this.selectedCountry = Countries.world.toString();
    this.updateCountry(this.selectedCountry);
  }

  updateCountry(countryName: string): void {
    this.scrollService.showPrognosisGraph$.pipe(
      filter(d => d)
    ).subscribe( () => this.selectedCountry = Countries.world.toString());
    this.selectCountry.emit(countryName as Countries);
  }

  // TODO
  // sectorKeysChanged(value): void {
  //   this.sectorKeys = value;
  // }
}
