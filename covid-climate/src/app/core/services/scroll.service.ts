import {Injectable} from '@angular/core';
import {BehaviorSubject, combineLatest, fromEvent, Observable} from 'rxjs';
import {distinctUntilChanged, filter, map, startWith, tap} from 'rxjs/operators';
import {isNotNullOrUndefined} from 'codelyzer/util/isNotNullOrUndefined';

export interface SiteScrollConfig {
  readonly covidGraphShown?: boolean;
  readonly covidShowDifference?: boolean;
  readonly covidShowSectors?: boolean;

  readonly pieGraphShown?: boolean;

  readonly prognosisGraphShown?: boolean;
  readonly prognosisSummedUp?: boolean;

  readonly topBarDropdownShown?: boolean;
}

export interface ScrollSection {
  readonly section: [number, number];
  readonly config: SiteScrollConfig;
}

@Injectable({
  providedIn: 'root'
})
export class ScrollService {

  // region Scroll Configs
  private readonly initialConfig: SiteScrollConfig = {
    covidGraphShown: true,
  };

  private readonly siteSections: ScrollSection[] = [
    {
      section: [0, 0.06],
      config: {}
    },
    {
      section: [0.06, 0.24],
      config: {
        covidGraphShown: true,
        topBarDropdownShown: true,
      }
    },
    {
      section: [0.24, 0.38],
      config: {
        covidGraphShown: true,
        covidShowDifference: true,
        topBarDropdownShown: true,
      }
    },
    {
      section: [0.38, 0.59],
      config: {
        covidGraphShown: true,
        covidShowSectors: true,
        topBarDropdownShown: true,
      }
    },
    {
      section: [0.59, .75],
      config: {
        covidGraphShown: false,
        covidShowSectors: true,
        prognosisGraphShown: true,
        topBarDropdownShown: true,
      }
    },
    {
      section: [0.75, 0.9],
      config: {
        covidGraphShown: false,
        covidShowSectors: true,
        prognosisGraphShown: true,
        prognosisSummedUp: true,
        topBarDropdownShown: true,
      }
    },
    {
      section: [0.9, 1],
      config: {
      }
    }
  ];

  //endregion

  private readonly currentScrollConfig$: BehaviorSubject<SiteScrollConfig> = new BehaviorSubject<SiteScrollConfig>(this.initialConfig);

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

  public readonly prognosisSummedUp$: Observable<boolean> = this.currentScrollConfig$.pipe(
    filter(isNotNullOrUndefined),
    map(c => c.prognosisSummedUp ?? false),
    distinctUntilChanged(),
  );

  public readonly showTopBarDropdown$: Observable<boolean> = this.currentScrollConfig$.pipe(
    filter(isNotNullOrUndefined),
    map(c => c.topBarDropdownShown ?? false),
    distinctUntilChanged(),
  );

  constructor() {
    combineLatest([
      fromEvent(window, 'scroll').pipe(startWith(0)),
      fromEvent(window, 'resize').pipe(startWith(0))])
      .pipe(
        map(() => window.scrollY / (ScrollService.getDocumentHeight() - window.innerHeight)),
        tap(console.log),
        map(s => this.getCurrentConfig(s)),
        distinctUntilChanged(),
      ).subscribe(c => this.currentScrollConfig$.next(c));
  }

  private static getDocumentHeight(): number {
    const body = document.body;
    const html = document.documentElement;

    return Math.max(body.scrollHeight, body.offsetHeight,
      html.clientHeight, html.scrollHeight, html.offsetHeight);
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
