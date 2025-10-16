# Placzek Song Suite

Eine glasige Single-Page-Anwendung, die beim Laden sämtliche Songs aus der `Songs.md` einliest und als lyrikfokussierte Karten präsentiert. Kopieren aller Bestandteile gelingt über kompakte Icon-Schaltflächen; ein Variantenschalter ersetzt auf Wunsch jeden Placzek-Verweis live durch Platzek.

## Funktionen

- **Automatisches Markdown-Parsing** – Beim Start wird `Songs.md` per `fetch` geladen, nach Titeln, Styles und Lyrics zerlegt und sofort dargestellt. Ergänzungen an der Datei erscheinen automatisch; jede Fokussierung oder Rückkehr in den Tab ruft den aktuellen Stand erneut ab.
- **Lyrik im Fokus** – Jede Karte zeigt einen großzügigen Ausschnitt der Lyrics, Styles werden als dezente Chips zusammengefasst. Ein Glas-Dialog offenbart alle Inhalte vollständig.
- **Clipboard-Workflow** – Vier Icon-Schaltflächen kopieren Titel, Styles, Lyrics oder den kompletten Song. Eine zusätzliche globale Schaltfläche kopiert auf Wunsch die vollständige `Songs.md`. Die Aktionen stehen auch im Dialog bereit und liefern Toast-Feedback.
- **Placzek↔Platzek-Option** – Ein persistenter Switch ersetzt alle Vorkommen direkt in der Oberfläche, sodass beide Varianten jederzeit abrufbar bleiben.
- **Animierter Hell/Dunkel-Modus** – Ein transformierendes Sonne/Mond-SVG schaltet die Darstellung. Die Wahl wird gespeichert und automatisch wiederhergestellt.
- **Responsive Glas-UI** – Das Layout passt sich fließend an alle Viewports an, ohne Überlagerungen oder abgeschnittene Beschriftungen. GSAP sorgt für sanfte Einblendungen (mit Rücksicht auf `prefers-reduced-motion`).

## Nutzung

1. Starte einen lokalen Webserver im Projektverzeichnis, z. B. `python -m http.server 8000`.
2. Öffne `http://localhost:8000` im Browser. Ohne Webserver kann `fetch` die `Songs.md` nicht laden.
3. Suche nach Titeln, Styles oder Lyrics, öffne Karten per Klick oder nutze den Dialog für vollständige Inhalte.

## Anpassung

- Neue Songs werden ausschließlich in `Songs.md` ergänzt. Die Struktur (Titel, Styles-Block, Lyrics-Block in Codeblöcken) muss beibehalten werden.
- Farben, Glaseffekte und Animationen lassen sich zentral in `styles.css` anpassen. Die Komponenten verwenden CSS-Variablen.
- Zusätzliche Interaktionen (z. B. Sortierung) können in `script.js` ergänzt werden. Die Render-Pipeline arbeitet vollständig datengetrieben.

## Abhängigkeiten

- [GSAP](https://greensock.com/gsap/) via CDN für dezente Animationsabläufe
- Google Fonts für Typografie sowie Vivus für die Icon-Animationen

Weitere Build-Schritte sind nicht erforderlich.
