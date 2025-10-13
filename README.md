# Oberarzt Dr. med. Placzek · Song-Atlas

Eine elegante Frontend-Anwendung, die alle Songs über Oberarzt Dr. med. Placzek aus der Datei `Songs.md` automatisiert einliest
und in einer interaktiven Bibliothek darstellt. Das UI fokussiert sich komplett auf den Kernnutzen: Songs entdecken, Details
überblicken und Inhalte mit einem Klick in die Zwischenablage kopieren.

## Funktionsumfang

- **Automatisches Einlesen** der `Songs.md` beim Laden der Seite – neue Songs sind ohne Codeänderung sofort verfügbar.
- **Spotlight-Bereich** mit den vollständigen Informationen des aktuell ausgewählten Songs inklusive direkter Kopier-Buttons
  für Titel, Styles, Lyrics oder das komplette Paket.
- **Song-Karten** mit Vorschau, Style-Tags und Schnellaktionen zum Kopieren einzelner Segmente.
- **Suchfeld und Style-Filter** zum schnellen Eingrenzen der Ergebnisse. Tags können direkt in Karten oder im Spotlight
  aktiviert/deaktiviert werden.
- **Placzek → Platzek-Schalter**, der sämtliche Lyrics live mit der alternativen Schreibweise versieht – sowohl in der Ansicht
  als auch für Kopiervorgänge.
- **Themenwechsel (Hell/Dunkel)** inklusive sanfter GSAP-Animationen für einen modernen Look.
- **Responsive UI** mit fließenden Animationen, Glas-Effekten und optimierter Bedienbarkeit für Desktop, Tablet und Smartphone.

## Nutzung

1. Öffne `index.html` in einem beliebigen modernen Browser.
2. Warte einen kurzen Moment, bis die Inhalte aus `Songs.md` geladen sind.
3. Navigiere über die Karten oder den Spotlight-Bereich und nutze die Copy-Buttons für die gewünschten Textbausteine.
4. Verwende Suche, Style-Tags und den Namens-Schalter, um die Songs an deine Bedürfnisse anzupassen.

> Die Datei `Songs.md` dient als einzige Datenquelle. Solange das Format (`## Titel`, gefolgt von den Abschnitten `### Styles:`
> und `### Lyrics:` mit Markdown-Codeblöcken) eingehalten wird, verarbeitet die Anwendung beliebig viele Einträge automatisch.

## Entwicklung

- Es werden ausschließlich statische Assets genutzt – ein einfacher HTTP-Server genügt, z. B. `npx serve` oder `python -m
  http.server`.
- Externe Abhängigkeiten: [Phosphor Icons](https://phosphoricons.com) für die Iconografie und [GSAP](https://greensock.com/gsap/)
  für dezente Animations-Effekte (jeweils per CDN eingebunden).
- Der Code ist vollständig in Vanilla JavaScript implementiert, nutzt `navigator.clipboard` und fällt bei Bedarf auf eine
  Textarea-Lösung zurück.

## Struktur

```
├── index.html    # Layout-Struktur, Templates und Verknüpfung der Assets
├── styles.css    # Komplettes Styling inkl. Theme-Variablen und Responsive Design
├── script.js     # Daten-Parsing, Rendering, UI-Logik und Clipboard-Handling
├── Songs.md      # Quelle für Songs, Styles und Lyrics (nicht im Repo verändern)
└── README.md     # Dieses Dokument
```

Viel Freude beim Kuratieren der Songs über Oberarzt Dr. med. Placzek! 🎶
