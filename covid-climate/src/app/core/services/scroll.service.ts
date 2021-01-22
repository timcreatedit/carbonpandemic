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
      section: [0, 0.23],
      config: {
        covidGraphShown: true,
      }
    },
    {
      section: [0.23, 0.47],
      config: {
        covidGraphShown: true,
        covidShowDifference: true,
      }
    },
    {
      section: [0.47, 0.8],
      config: {
        covidGraphShown: true,
        covidShowSectors: true,
      }
    },
    {
      section: [0.8, 1],
      config: {
        covidGraphShown: false,
        covidShowSectors: true,
        prognosisGraphShown: true,
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
