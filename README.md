# Oberarzt Dr. med. Placzek – Song-Kompendium

Eine schwebende Glas-Oberfläche, die alle Songs beim Laden direkt aus der `Songs.md` zieht und mit fokussierten Karten, Icon-Aktionen und Variantenschalter präsentiert.

## Highlights

- **Automatisches Markdown-Ingest**: `Songs.md` wird beim Start per `fetch` geladen, geparst und ohne Zwischenschritte als Songkarten dargestellt. Neue Einträge erscheinen nach einem Reload sofort in der Übersicht.
- **Komprimierte Copy-Icons**: Jede Karte besitzt vier grafische Symbole für Titel, Styles, Lyrics und den vollständigen Datensatz. Der Detaildialog hält zusätzliche Copy-Shortcuts bereit.
- **Placzek ↔ Platzek Switch**: Ein globaler Toggle ersetzt die Lyrics live, aktualisiert Karten, Dialog und Statistik-Kachel und merkt sich die Präferenz per `localStorage`.
- **Animiertes Sonne/Mond-Icon**: Der Theme-Button wechselt mit einer SVG-Transformation zwischen hellem und dunklem Glasdesign und speichert die Wahl persistent.
- **Responsives Float-Layout**: Hero-Sektion, Karten und Dialog bleiben bei allen Viewports sauber lesbar – keine Überlagerungen, klare Typografie und weiche Animationen.

## Projektstruktur

```
.
├── index.html     # Struktur mit Hero, Control-Bar, Song-Grid, Dialog und Toast
├── styles.css     # Glasiges Designsystem, Responsivität, Animationen und Theme-Varianten
├── script.js      # Markdown-Parsing, Rendering, Kopierlogik, Theme- und Variantenschalter
└── Songs.md       # Quelle aller Songs (nicht verändern)
```

## Lokale Entwicklung

1. Einen lokalen Webserver starten (z. B. `python -m http.server 8000`).
2. `http://localhost:8000` im Browser öffnen.
3. Änderungen an HTML, CSS oder JS speichern und die Seite neu laden.

> **Hinweis:** Durch die Nutzung von `fetch` kann die App nicht direkt über `file://` geöffnet werden. Ein Webserver ist Pflicht, damit `Songs.md` geladen wird.

## Lizenz

Interne Demo-Anwendung. Abstimmung mit dem Team von Oberarzt Dr. med. Placzek vor jeder externen Nutzung.
