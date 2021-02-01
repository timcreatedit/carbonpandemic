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

## Final Feature List

### Ziel 1: Fakten Darstellen

#### Must Have Features

- [X] Line Chart: CO2-Emissionen 2019/2020
- [X] Line Chart: COVID-19 Fälle
- [X] Länderauswahl - Dropdown Menü
- [X] Visualisierung der Lockdown Phasen
- [X] Scrollbasierte Änderungen am CO2 Graphen (CO2, Unterschied, Sektoren, Überblick)
- [X] Beschreibende und erklärende Texte
- [X] Dynamische Informationen im Erklärungstext je nach Länderwahl


#### Nice to Have Features

- [X] Animierte Änderungen
- [X] Detaillierte Informationen beim Hovern in beiden Graphen
- [X] Line Chart Ansicht über Toggl-Button: Ansicht Absoluten Daten - Anteil an Welt
- [X] Line Chart Ansicht über Toggl-Button: Ansicht Daten pro Einwohner (per Capita) - im gewählten Land
- [X] Responsiv Layout
- [X] Weitere Formatierung der Texte (Zitate einbinden etc.)
- [ ] Wechsel in Covid Chart zwischen Faktoren (Neuinfektionen, Gesamt, R-Wert)
- [ ] Vergleichsmodus von 2 Ländern

***

### Ziel 2: Einfluss verdeutlichen

#### Must Have Features

- [x] Sektoren visualisiert als Stacked-area Chart
- [x] Detaillierte Informationen beim Hover - genauere Zahlenansicht, Prozentanzeige (Hover-Funktion)
- [x] Länderauswähl - Dropdown Menü
- [x] Beschreibende und erklärende Texte mit dynamischen Informationen

#### Nice to Have Features

- [x] Animationen
- [X] Dropdown-menu für Sektorauswahl - Graph 2019/2020 innerhalb des gewählten Sektors
- [X] Website benutzbar auch mit Farbenblindheit

***

### Ziel 3: Erreichen der Klimaziele

#### Must Have Features

- [x] Line Chart: Überblick über den CO2 Ausstoßes seit 1750 
- [x] Regler für die angezeigten Jahre
- [x] Prognoselinien
  - [x] Es geht so weiter wie 2019
  - [x] Es geht so weiter wie 2020
- [x] Beschreibende und erklärende Texte mit dynamischen Informationen


#### Nice to Have Features

- [x] Animationen
- [X] Anzeigen des voraussichtlichen Doomsday
- [X] Countdown bis zum Ablauf des CO2 Budgets in beiden Szenarien
- [x] Hover Interaktion
- [X] Aufsummieren der Co2 Werte als Graph
- [X] Line Chart: Aufsummierte Co2 Werte – vorhandenes Budget, erreichen der Klimaziele (2°-, 1.5°-Ziel)

## Imprint
