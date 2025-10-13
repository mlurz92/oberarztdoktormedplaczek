# Placzek Song Suite

Eine hochwertige Einseiten-Anwendung, die automatisch alle Songs aus der `Songs.md` einliest und mit einem glasigen Interface präsentiert. Der Fokus liegt auf einer großzügigen Lyrics-Vorschau, schnellen Kopieraktionen und der Möglichkeit, zwischen Placzek- und Platzek-Varianten umzuschalten.

## Features

- **Automatisches Parsing** – Beim Start wird `Songs.md` via Fetch geladen und nach Titeln, Styles und Lyrics zerlegt. Neue Songs in der Datei erscheinen ohne weitere Arbeiten automatisch in der Oberfläche.
- **Lyrics im Vordergrund** – Jede Karte zeigt eine großflächige Vorschau der Lyrics (bis zu 14 Abschnitte) mit dezenter Style-Zusammenfassung.
- **Kopieren mit einem Klick** – Icon-basierte Buttons kopieren Titel, Styles, Lyrics oder den kompletten Song in die Zwischenablage. Im Detail-Dialog stehen dieselben Aktionen bereit.
- **Placzek ↔ Platzek Schalter** – Ein animierter Switch ersetzt auf Wunsch alle `Placzek` Vorkommen live durch `Platzek`. Die Entscheidung wird persistiert.
- **Dynamischer Dark/Light Mode** – Ein animiertes SVG wechselt fließend zwischen Sonne und Mond. Das gewählte Theme wird gespeichert und greift beim nächsten Besuch sofort.
- **Dialog für komplette Inhalte** – Ein modaler Glas-Dialog zeigt alle Styles als Chips und die vollständigen Lyrics ohne Kürzung.
- **Toasts & Animationen** – Dezente GSAP-Einstiegsanimationen und Glassmorphism-Toasts liefern haptisches Feedback ohne Unruhe. Bei `prefers-reduced-motion` werden Effekte automatisch reduziert.

## Entwicklung & Nutzung

1. Stelle sicher, dass du die Anwendung über einen lokalen Webserver ausführst, damit `fetch` auf `Songs.md` funktioniert (z. B. `python -m http.server 8000`).
2. Öffne `http://localhost:8000` in deinem Browser.
3. Die Oberfläche reagiert auf jede Viewport-Größe ohne Überlappungen. Karten lassen sich jederzeit öffnen, um Lyrics vollständig zu lesen.

## Anpassungen

- Neue Songs fügst du ausschließlich in `Songs.md` hinzu. Der Parser arbeitet nach dem Schema aus Titel, Styles-Block und Lyrics-Block in Codeblöcken.
- Das Styling nutzt ausschließlich Variablen in `styles.css`. Farbstimmungen oder Animationen lassen sich dort gezielt anpassen.
- Für weitere Interaktionen steht die modulare Struktur in `script.js` bereit (z. B. ergänzende Filter, Sortierungen oder Exportoptionen).

## Technologien

- **Vanilla JavaScript** für Parsing, Rendering und State-Management
- **GSAP** (via CDN) für sanfte Einstiegsanimationen
- **Material Symbols & Google Fonts** (CDN) für typografische und ikonografische Konsistenz

Die Anwendung verzichtet bewusst auf zusätzliche Build- oder Framework-Abhängigkeiten und bleibt dadurch wartungsfreundlich.
