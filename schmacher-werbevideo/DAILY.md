# Tägliches Social-Video – Gewerbepark Ebenthal bei Klagenfurt

Jeden Tag **ein neues, anderes Video plus ein Werbebild**, jeweils in **zwei Varianten**:
- **A – Schmacher Solutions GmbH:** Logo `3d/logo.png`, Tel. 0664 1200745, www.gewerbepark-klagenfurt.at, office@gewerbepark-klagenfurt.at
- **B – Russinov Immobilien (Makler):** Logo `3d/russinov_logo.png`, Tel. 0463 203520, www.russinov.at, immo@russinov.at.
  Kein Schmacher-Logo/-Kontakt; Fassadenschild neutral (`&sign=gpe`); Sprecher „Russinow Immobilien“ (Schreibweise im Bild: Russinov).

## Format
- Video **9:16, 1080×1920, 24 fps, ca. 45–50 s** (wie die bisherigen Filme, davon ca. 6–7 s Endkarte mit Anruf-Aufforderung), für WhatsApp-Status, Instagram/Facebook Reels und Stories. Ton mit Sprecher (ElevenLabs „Bill“, siehe `audio/`), Musik und Geräusche, Lautheit −14 LUFS. Zusätzlich eine `_web`-Fassung (crf 22).
- Bild **4:5, 1080×1350, JPG**, für den Feed und den Status.
- Ablage: `export/daily/JJJJ-MM-TT/` mit `Schmacher_…` und `Russinov_…` (Video und Bild), dazu ein kurzer Posttext (`Posttext_Schmacher.txt`, `Posttext_Russinov.txt`) mit Hashtags.
- Fertig bis **7:00 Uhr (Wien)**. Danach die vier Dateien und die Posttexte mit SendUserFile (status proactive) schicken, mit 2–3 Sätzen auf Deutsch (Du): Idee des Tages und was neu ist.

## Ort immer so nennen
„**Ebenthal bei Klagenfurt**“ oder „**Klagenfurt-Ebenthal**“. Klagenfurt soll sichtbar sein, Ebenthal muss vorkommen.

## Modell-Korrekturen (Bauherr)
- Lagerbühne: **kein Steher in der Mitte**, nur Randstützen (im Modell umgesetzt 19.11.).
- Sektionaltore: **3 Lichtreihen (Fensterreihen) in der Mitte** (im Modell umgesetzt 19.11.). Beim Einsetzen von Toren in Fotos ebenfalls 3 Fensterreihen zeichnen.

## Fakten – nur diese verwenden, nichts erfinden (keine Preise, Maße, Termine, Verfügbarkeiten)
- 7 Hallen mit Büro, Neubau, Gewerbepark Ebenthal bei Klagenfurt, Kärnten
- Unten Lager/Halle, oben Büro auf der Galerie (Lagerbühne), WC oben, Anschluss für Kaffeeküche/Kochecke optional
- Großes elektrisches Sektionaltor (**keine Maße nennen**), Gehtür, Fensterband im Büro
- Fußbodenheizung, Luft-Wärmepumpe, 3-fach-Verglasung, bis zu 7 m Raumhöhe
- ca. 150 m² Nutzfläche (Halle + Galerie, vom Bauherrn bestätigt; immer „ca.“ oder „rund“ davor)
- Zielgruppe: saubere Betriebe mit Lager + Büro (Elektriker, Installateur, Hausbetreuung, Versandhandel/Onlineshop, Logistik, Handel, Tischler optional). **Keine** Kfz-Werkstatt bzw. schmutzige Betriebe zeigen.

## Werkzeuge
- 3D-Modell `3d/scene.js` (three.js), Kameras in `3d/shots.js` (Film 1) und `3d/shots2.js` (Film 2); Rendern mit `3d/render.cjs` (VW/VH/QS, `--still`).
  Ein Bild 1080×1920 braucht ca. 15–20 s; ~1000 Bilder pro Video → in 2–3 parallelen Render-Läufen aufteilen (Zeitbereiche), Endkarte über Standbild ohne Rendern. **Früh starten** und Läufe mit `setsid nohup … & disown` abkoppeln.
  Lange Wartezeiten mit Hintergrund-Waitern (max. 2 h) überbrücken.
- Titel als HTML → transparente PNGs (Beispiele `3d/titlesV.html` und `3d/titlesVm.html`, Renderer `3d/make_titles.cjs`). Schnitt mit `compose()` aus `edit.py`, Ton mit `audio/sound.py`.
- Neue Sprecherzeilen per ElevenLabs (Schlüssel kommt über den Proxy, `mp3_44100_128`). Abbinder vorhanden: `09`/`10` (Schmacher) und `m09`/`m10` (Russinov).
- Für jeden Tag einen eigenen Kamera-/Szenen-Satz anlegen (z. B. `3d/daily/<datum>.js` oder ein neuer Shot-Modus), keine alten Videos einfach neu schneiden.



## Echte Baustellenfotos (Stand Nov. 2026) – `referenz-fotos/stand-2026-11/`
Die Fotos dürfen in Videos und Bildern verwendet werden, aber **nur aufbereitet**:
- Alles entfernen, was nach Baustelle aussieht: Hebebühne, Leitern, Latten, Säcke, Kabel, Baumaterial, Werkzeug, Personen. Werkzeug dafür: `retusche/lama.py` mit `inpaint()` und `poly_mask()` (LaMa-ONNX, Modell-Download siehe Kopf der Datei, `HF_HUB_DISABLE_XET=1`).
- Fehlende Sektionaltore (anthrazit) mit `warp_into()` und `sectional_door()` perspektivisch einsetzen. Die Ecken der Öffnungen vorher mit einem Raster bestimmen. Die Stiege fehlt auf den Fotos noch, deshalb nicht so zuschneiden oder beschriften, als wäre sie da.
- Schöner zuschneiden (Bildausschnitt, gerade Kanten), Licht und Farben leicht verbessern. Den Schotterboden möglichst wegschneiden.
- Kennzeichnen, dass es echte Bilder sind, z. B. „Echte Fotos · Baufortschritt“ oder „So weit sind wir schon“. Ergebnis immer selbst prüfen, bevor es verwendet wird.
- Beispiele: `retusche/out/test02.jpg` (Hebebühne weg), `test04.jpg` (Tore eingesetzt), `test09.jpg` (Halle aufgeräumt).

## Anspruch: jedes Video steht für sich
- **Keine Folgennummern und keine Verweise auf andere Videos** („Folge 2“, „Morgen: …“, „Teil 1“). Jedes Video muss einzeln gepostet werden können, in beliebiger Reihenfolge (Wunsch Bauherr 19.11.).
- Jedes Video hat ein eigenes Genre und eine eigene Stimmung: Action, Doku, Comedy, Krimi-Spannung, Zeitraffer, Countdown, Quiz, Vorher/Nachher, Kino-Trailer usw.
- **Hook in den ersten 1,5 s:** sofort etwas Überraschendes in Bild und Ton, nie langsam einsteigen.
- Mindestens ein **Wow-Moment** in der Mitte, etwa eine spektakuläre Kamerafahrt, eine Verwandlung oder eine Pointe.
- **Starker Abschluss statt Cliffhanger:** eine Pointe oder Frage, die zum Anrufen motiviert, z. B. „Welche der 7 Hallen wird deine?“.
- Jedes Video soll mindestens in einem Punkt besser oder überraschender sein als das vorige. Nie dieselbe Kamerafahrt, Musik oder Dramaturgie zweimal.
- Der Ton bleibt positiv und einladend: Freude, Stolz, „das könnte mein Betrieb sein“.

## Ideen-Logbuch (nie wiederholen!)
Jeden Tag eine **neue Idee** mit eigener Kamera, eigener Dramaturgie, eigenem Hook in den ersten 1,5 s und eigener Musikstimmung. Hier eintragen (Datum · Titel · Kurzbeschreibung), damit sich nichts wiederholt.

Bisher (Kampagne): Film 1 „Raus aus der Garage“ (Anflug, Fassade, Tor, Halle, Büro, Nacht) · Film 2 „Licht an.“ (Lichtschalter, Halle füllt sich, Tor + Transporter, Büro, Kaffeeküche).

Ideenspeicher (noch frei): Branchen-Tag (z. B. Elektriker, Onlineshop, Installateur, Hausbetreuung – Halle passend eingerichtet) · Countdown „7 Hallen – 7 Gründe“ · Garage-vs-Halle-Splitscreen · Drohnen-Sonnenaufgang mit Karawanken · Winter/Schnee außen, warm innen (Fußbodenheizung) · „Wie viel passt rein?“ Paletten-Zeitraffer · POV Transporter von der Autobahn bis ins Tor · Tag-und-Nacht-Zeitraffer · Röntgen-/Schnitt-Fahrt durchs Gebäude · Hausnummer-Tour 1→7 · Miniatur-/Tilt-Shift-Look · Büro-Moodboard „Dein Logo hier“ · Quiz „Was passt in Halle 3?“ · Musik-Beat-Schnitt · Weihnachts-/Jahreswechsel-Specials passend zum Datum.

### Logbuch
- **2026-11-19 · Folge 1 „Echt jetzt.“** – Doku/Reveal: Einstieg mit echtem Foto „Das ist kein Rendering.“ → Glitch zu 3D „Das hier schon.“ → Kran-Aufstieg bei Sonnenaufgang → Vergleichsschieber 3D-Plan/echtes Foto Torseite → echte Halle 7 m → Überblendung ins eingerichtete 3D-Büro → Beat-Montage echter Details → Fakten-Karte → Cliffhanger. Musik Dm9-Bb-F-C, 2,2-s-Takt. Werbebild: Split „Plan ✓ Realität ✓“. Dateien: `3d/daily/2026-11-19.js`, `d1_*`.
  Nachträglich ohne Folgennummer und ohne „Morgen …“ neu geschnitten. Nächste Idee (frei, nicht angekündigt): Branchen-Tag Elektriker.
