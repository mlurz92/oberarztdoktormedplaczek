# Oberarzt Dr. med. Placzek – Song-Kompendium

Eine schlanke, statische Web-App, die sämtliche Inhalte direkt aus der `Songs.md` einliest und die Hymnen über Oberarzt Dr. med. Placzek perfekt strukturiert darstellt.

## Funktionsumfang

- **Automatischer Import**: Beim Start wird `Songs.md` per `fetch` geladen, geparst und die Oberfläche ohne weitere Konfiguration mit allen Songs befüllt.
- **Kopieraktionen nach Bedarf**: Für jeden Song lassen sich Titel, Styles, Lyrics oder der komplette Datensatz einzeln per Klick in die Zwischenablage legen – auf Karten oder im Detaildialog.
- **Platzek-Umschaltung**: Ein globaler Schalter tauscht in den Lyrics „Placzek“ dynamisch gegen „Platzek“ aus, ohne die Originaldatei anzutasten.
- **Hell/Dunkel-Modus**: Ein Theme-Toggle schaltet live zwischen lichtem und dunklem Erscheinungsbild und merkt sich die Auswahl via `localStorage`.
- **Vollständig responsiv**: Karten, Dialog und Steuerlemente passen sich jeder Viewportbreite an – vom Smartphone bis zum großen Desktop.
- **Detailansicht mit Dialog**: Die Lyrics werden in einem modalen Dialog komfortabel lesbar. Separate Kopier-Buttons befinden sich direkt bei Styles und Lyrics sowie als „Alles kopieren“.
- **Suche in Echtzeit**: Titel, Styles und Lyrics lassen sich über eine zentrale Suchleiste filtern.

## Projektstruktur

```
.
├── index.html     # Markup und Komponenten-Struktur der Anwendung
├── styles.css     # Designsystem, Layout und responsives Verhalten
├── script.js      # Logik zum Einlesen, Rendern, Kopieren und zum Theme-Handling
└── Songs.md       # Quelle für alle Songs (nicht ändern)
```

## Lokale Entwicklung

1. Einen simplen Webserver starten (z. B. `python -m http.server 8000`).
2. `http://localhost:8000` im Browser öffnen.
3. Änderungen an `styles.css`, `script.js` oder `index.html` werden beim Neuladen sichtbar.

> **Hinweis:** Ein direktes Öffnen der `index.html` aus dem Dateisystem blockiert den `fetch`-Aufruf auf `Songs.md`. Die App muss daher über einen Webserver ausgeliefert werden.

## Lizenz

Interne Demo-Anwendung. Bitte vor externer Nutzung mit dem Team von Oberarzt Dr. med. Placzek abstimmen.
