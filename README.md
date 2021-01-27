# Will the Pandemic save our Climate?

### InfoVis Gruppe 13

[![build status](https://github.com/timcreatedit/infovis-gruppe-13/workflows/Build/badge.svg)](https://github.com/timcreatedit/infovis-gruppe-13/actions) [![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)

![Screenshot](./Screenshot.png)

>  Link to the current project status: https://carbonpandemic.info/



Lockdowns, travel bans, and a shutdown economy - 2020 was not only a unique year for people due to the COVID-19 pandemic, but also interesting in terms of its major contributors to Co2 emissions.
The hope is that the constraints imposed by this particular situation could be an important step in the right direction, at least for the prospects of a future Co2 phase-out.
But to what extent has the pandemic affected Co2 emissions in 2020 relative to 2019? What insights can be gleaned for the individual sectors that make up the emissions?
And how what impact would a continuation of these regulations have on our Co2 budget?

## Tips for an optimal Experience

- Open the [webpage](https://carbonpandemic.info/) using a desktop computer in a full-screen browser window. While the website is technically responsive and works on mobile, interactions like hovering over the graph require a computer.
- Use a modern browser (not Internet Explorer)

## Build Instructions

1. Clone the entire repository
2. Open the 'covid-climate' folder
3. Execute ``npm install``
4. If you just want to run the project locally, run the start script with  ``npm run start``. The Angular CLI will handle building and serving the project for you. Check the console to see where your local dev server is running (usually ``localhost:4200/``).
5. If you want to build the project, run the build script with ``npm run build:ci``. The resulting web page can be found in the 'dist' folder.

## Milestone 5

### Ziel 1: Fakten Darstellen

#### Must Have Features

- [x] Line Chart: CO2-Emissionen 2019/2020
- [x] Line Chart: COVID-19 Fälle
- [x] Länderauswahl - Dropdown Menü
- [x] Visualisierung der Lockdown Phasen
- [x] Scrollbasierte Änderungen am CO2 Graphen
  - [x] Anzeige der Änderung zum Vorjahr
  - [x] Aufteilung in Sektoren
- [X] Beschreibende und erklärende Texte
- [x] Dynamische Informationen im Erklärungstext je nach Länderwahl


#### Nice to Have Features

- [x] Animierte Änderungen
- [x] Detaillierte Informationen beim Hovern (Hover-Funktion)
- [x] Wechsel zwischen absoluten und relativen Daten
- [ ] Vergleichsmodus von 2 Ländern
- [ ] Wechsel in Covid Chart zwischen Faktoren 	(Neuinfektionen, Gesamt, R-Wert)

***

### Ziel 2: Einfluss verdeutlichen

#### Must Have Features

- [x] Sektoren visualisier als Stacked-area Chart
- [x] Detaillierte Informationen beim Hover - genauere Zahlenansicht, Prozentanzeige (Hover-Funktion)
- [x] Länderauswähl - Dropdown Menü
- [x] Beschreibende und erklärende Texte

#### Nice to Have Features

- [x] Animationen
- [ ] Anzeige der anteiligen Änderungen je Sektor

***

### Ziel 3: Erreichen der Klimaziele

#### Must Have Features

- [x] Line Chart: Überblick über den CO2 Ausstoßes seit 1750 
- [x] Regler für die angezeigten Jahre
- [x] Prognoselinien
  - [x] Es geht so weiter wie 2019
  - [x] Es geht so weiter wie 2020
- [x] Beschreibende und erklärende Texte


#### Nice to Have Features

- [x] Animationen
- [X] Anzeigen des voraussichtlichen Doomsday
- [X] Countdown bis zum Ablauf des CO2 Budgets in beiden Szenarien
- [x] Hover Interaktion

## Imprint