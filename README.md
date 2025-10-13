# Oberarzt Dr. med. Placzek – Song-Kompendium

Eine glasartige Single-Page-Anwendung, die beim Laden sämtliche Songs direkt aus der `Songs.md` importiert und sie mit eleganten
Karten, Kopierfunktionen und Variantenumschaltung präsentiert.

## Highlights

- **Automatisches Markdown-Ingest**: `Songs.md` wird beim Start der Seite per `fetch` geladen, geparst und in ansprechende Song-Karten
  überführt. Neue Einträge in der Datei erscheinen sofort nach einem Reload.
- **Sofort-Kopieraktionen**: Jede Karte stellt vier Quick-Actions für Titel, Styles, Lyrics und den komplett aufbereiteten Datensatz bereit.
  Zusätzlich enthält der Detaildialog dedizierte Copy-Buttons für Styles, Lyrics und „Alles“.
- **Platzek-Schalter**: Ein globaler Toggle ersetzt in den Lyrics „Placzek“ auf Wunsch durch „Platzek“, ohne die Datenquelle anzutasten.
- **Animierter Theme-Toggle**: Das animierte Sonne/Mond-SVG wechselt zwischen hellem und dunklem Glasdesign und speichert die Präferenz
  in `localStorage`.
- **Reaktive Suche & Responsivität**: Die Live-Suche filtert Titel, Styles und Lyrics in Echtzeit. Layout und Animationen passen sich
  an jede Viewport-Größe an – vom Smartphone bis zum Widescreen.
- **Dialog mit Lesemodus**: Der modale Detailbereich zeigt Styles als Chips, die Lyrics im Lesemodus sowie Kopieraktionen und reagiert
  ebenfalls auf die Placzek/Platzek-Umschaltung.

## Projektstruktur

```
.
├── index.html     # Struktur der Anwendung, inklusive Dialog und Control-Bar
├── styles.css     # Glasiges Designsystem, Animationen, Responsive Layouts und Theme-Varianten
├── script.js      # Markdown-Parsing, Rendering, Kopierlogik, Theme- und Variantenschalter
└── Songs.md       # Quelle aller Songs (nicht verändern)
```

## Lokale Entwicklung

1. Einen lokalen Webserver starten (z. B. `python -m http.server 8000`).
2. `http://localhost:8000` im Browser öffnen.
3. Änderungen an HTML, CSS oder JS speichern und die Seite neu laden.

> **Hinweis:** Durch die Nutzung von `fetch` kann die App nicht direkt über `file://` geöffnet werden. Ein Webserver ist Pflicht,
> damit `Songs.md` geladen wird.

## Lizenz

Interne Demo-Anwendung. Abstimmung mit dem Team von Oberarzt Dr. med. Placzek vor jeder externen Nutzung.
