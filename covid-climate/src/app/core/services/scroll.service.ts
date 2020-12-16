import {Injectable} from '@angular/core';
import {BehaviorSubject, fromEvent, Observable} from 'rxjs';
import {distinctUntilChanged, filter, map, tap} from 'rxjs/operators';
import {isNotNullOrUndefined} from 'codelyzer/util/isNotNullOrUndefined';

export interface SiteScrollConfig {
  readonly covidGraphShown?: boolean;
  readonly covidShowDifference?: boolean;
  readonly covidShowSectors?: boolean;

  readonly pieGraphShown?: boolean;

  readonly prognosisGraphShown?: boolean;
}

export interface ScrollSection {
  readonly section: [number, number];
  readonly config: SiteScrollConfig;
}

@Injectable({
  providedIn: 'root'
})
export class ScrollService {

  // region Scroll Thresholds
  private readonly siteSections: ScrollSection[] = [
    {
      section: [0, 500],
      config: {
        covidGraphShown: true,
      }
    },
    {
      section: [500, 900],
      config: {
        covidGraphShown: true,
        covidShowDifference: true,
      }
    },
    {
      section: [900, 1300],
      config: {
        covidGraphShown: true,
        covidShowSectors: true,
      }
    },
  ];
  //endregion

  private readonly currentScrollConfig$: BehaviorSubject<SiteScrollConfig> = new BehaviorSubject<SiteScrollConfig>(null);

  public readonly showCovidGraph$: Observable<boolean> = this.currentScrollConfig$.pipe(
    filter(isNotNullOrUndefined),
    map(c => c.covidGraphShown ?? false),
    distinctUntilChanged(),
  );

  public readonly covidShowDifference$: Observable<boolean> = this.currentScrollConfig$.pipe(
    filter(isNotNullOrUndefined),
    map(c => c.covidShowDifference ?? false),
    distinctUntilChanged(),
  );

  public readonly covidShowSectors$: Observable<boolean> = this.currentScrollConfig$.pipe(
    filter(isNotNullOrUndefined),
    map(c => c.covidShowSectors ?? false),
    distinctUntilChanged(),
  );

  public readonly showPieGraph$: Observable<boolean> = this.currentScrollConfig$.pipe(
    filter(isNotNullOrUndefined),
    map(c => c.pieGraphShown ?? false),
    distinctUntilChanged(),
  );

  public readonly showPrognosisGraph$: Observable<boolean> = this.currentScrollConfig$.pipe(
    filter(isNotNullOrUndefined),
    map(c => c.prognosisGraphShown ?? false),
    distinctUntilChanged(),
  );

  constructor() {
    fromEvent(window, 'scroll').pipe(
      map(() => window.scrollY),
      map(s => this.getCurrentConfig(s)),
      distinctUntilChanged(),
    ).subscribe(c => this.currentScrollConfig$.next(c));
  }

  private getCurrentConfig(scrollTop: number): SiteScrollConfig {
    const relevantSections = this.siteSections.filter(s => s.section[0] <= scrollTop && s.section[1] > scrollTop);
    if (relevantSections.length === 0) {
      return null;
    }
    if (relevantSections.length > 1) {
      throw new Error(`ScrollService found multiple relevant sections for scrollTop=${scrollTop}. This is illegal!`);
    }
    return relevantSections[0].config;
  }
}
