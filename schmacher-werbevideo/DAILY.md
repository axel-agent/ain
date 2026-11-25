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

## Weitergabe an den Facebook-Gruppen-Agenten
- Die fertige **Schmacher-Version** (9:16, unter 100 MB) zusätzlich nach `/home/user/ain/werbevideos/JJJJ-MM-TT_<Titel>_9x16.mp4` kopieren, in `werbevideos/LISTE.md` eine Zeile mit Inhalt eintragen, committen und pushen (Branch `claude/schmacher-solutions-ad-video-5gp2vk`).

- `werbevideos/tagespakete/NEUESTES.txt` auf das neue Datum setzen (der Marketing-Agent liest es).
- Zusätzlich das **komplette Tagespaket** (beide Videos, beide Bilder, beide Posttexte) nach `/home/user/ain/werbevideos/tagespakete/JJJJ-MM-TT/` kopieren und mitpushen. Ziel beim Bauherrn: Ordner „Marketing\Werbevideos & Bilder Claude“ (OneDrive) – direkt erreichbar erst, wenn sein Computer per Remote Control freigegeben ist; dann dorthin kopieren.

## Startbild jedes Videos = Plakat (Wunsch Bauherr 20.11.)
- **Jedes Video beginnt mit dem Plakat im Hochformat** (ca. 2,2 s stehend, 0,3 s Überblendung, erst dann startet das Video). Es dient als Vorschaubild auf Facebook und muss sofort sagen: **Halle + Büro + Lager zu vermieten · Klagenfurt-Ebenthal · Telefonnummer**.
- Erzeugen: `V=1 node 3d/daily/poster.cjs <hero> "<Aufkleber>" "<Tageszeile>" 3d/out/coverV_<tag>` (optional `CUT=../out/<schnittbild>.jpg`), dann `3d/daily/prepend_cover.sh <cover.jpg> <video_ohneStartbild.mp4> <video.mp4>` für Schmacher und Russinov.
- **Startbild jeden Tag anders** (Wunsch Bauherr 20.11.): neues Hero-Bild (abwechselnd 3D-Render, echtes Foto, Luftbild, Detail), neuer Aufkleber, neue Tageszeile **und** ein anderes Design. Dafür `THEME=light|dark|orange|photo` reihum verwenden und bei Bedarf weitere Varianten in `poster.html` ergänzen, z. B. andere Farben, Hero groß bzw. klein oder Schnittbild links bzw. rechts. Gleich bleiben nur die Pflichtinhalte: „Halle + Büro + Lager zu vermieten“, Klagenfurt-Ebenthal, Fakten, Telefonnummer, Logo.
- **Videos immer als H.264 High, `yuv420p`** ausgeben (sonst spielen Handys sie nicht ab) und vor dem Versand mit `ffprobe` prüfen.
- Verwendete Startbild-Designs (nicht direkt wiederholen): 19.11. light (echtes Foto) · 20.11. light (Elektro-Render) · 21.11. dark (Winter-Render, Tor offen) · 22.11. orange (Hausnummern-Fassade) · 23.11. photo (Versand-Halle von oben) · 24.11. light (Abendfront) · 25.11. dark (Tor offen, Transporter) · **nächstes: orange** – bald neue Variante ergänzen (z. B. Schnittbild links/Fakten rechts getauscht, Gold/Navy).

## Werbebild: sofort verständlich (Wunsch Bauherr 19.11.)
- Wer das Bild auf Facebook sieht, muss in 1 Sekunde verstehen: **Halle mit Büro zu vermieten.** Das gehört groß und eindeutig aufs Bild, z. B. „ZU VERMIETEN · Halle + Lager + Büro“.
- Jedes Bild ist ein **fix-fertiger, vollständiger Post**: großer Titel „zu vermieten“, Ort „Klagenfurt-Ebenthal“, die wichtigsten Fakten (ca. 150 m², unten Lager/oben Büro, großes Sektionaltor, Fußbodenheizung), Telefonnummer groß, Logo.
- Kreative Ideen sind erlaubt, aber die Botschaft „zu vermieten“ darf nie hinter dem Gag verschwinden. Auch der Posttext beginnt mit der klaren Aussage („Halle mit Büro zu vermieten …“).
- **Feste Vorlage:** `3d/daily/poster.html` (Stil nach `referenz-fotos/werbebild-vorlagen/`): Kopf mit Logo + „Gewerbepark Klagenfurt-Ebenthal“ + Adresse, großes Tagesfoto/Render oben, „HALLE + BÜRO + LAGER ZU VERMIETEN“, „7 Einheiten je ca. 150 m²“, beschriftetes **seitliches** Schnittbild (Wunsch Bauherr; `3d/out/cut_side_poster.jpg`, neu erzeugen mit `SIDE=1 node cut.cjs 1000 800 4.5,10.5,3.5 24.4,2.0,-7.6 34 out/cut_side.jpg` und zuschneiden 40,80,990,778), Faktenliste daneben, orange Anruf-Leiste, Fußzeile Bezug/Mietpreis.
  Erzeugen: `node 3d/daily/poster.cjs <hero relativ zu daily/> "<Aufkleber>" "<Tageszeile>" <Ausgabe-Präfix>` → `_Schmacher.jpg`/`_Russinov.jpg`. **Täglich wechseln:** Hero-Bild, Aufkleber und Tageszeile (zur Videoidee passend); Rest bleibt gleich, damit man sofort erkennt: 7 Hallen zu vermieten + anrufen.

## Ort immer so nennen
„**Ebenthal bei Klagenfurt**“ oder „**Klagenfurt-Ebenthal**“. Klagenfurt soll sichtbar sein, Ebenthal muss vorkommen.

## Modell-Korrekturen (Bauherr)
- Lagerbühne: **kein Steher in der Mitte**, nur Randstützen (im Modell umgesetzt 19.11.).
- Sektionaltore: **3 Lichtreihen (Fensterreihen) in der Mitte** (im Modell umgesetzt 19.11.). Beim Einsetzen von Toren in Fotos ebenfalls 3 Fensterreihen zeichnen.

## Fakten – nur diese verwenden, nichts erfinden (keine Preise, Maße, Termine, Verfügbarkeiten)
- **Nie „noch frei“, „verfügbar“ o. Ä. schreiben** (keine Verfügbarkeitsangaben).
- Lage: Ebenthal, direkt an der Stadtgrenze von Klagenfurt.
- Adresse: Josef-Madersperger-Str. 2, 9065 Ebenthal (Kärnten).
- Zusätzliche Lagerbühne ca. 40–50 m² · WC & Waschmaschinenanschluss · Parkplätze je Einheit · Strom, Wasser, Heizung je eigener Zähler · Fußbodenheizung mit Luft-Wärmepumpe.
- Bezugsfertig voraussichtlich Q1/Q2 2027 (aus den Flyern des Bauherrn) · Mietpreis auf Anfrage.
- Zielgruppen laut Flyer: Handwerk, Online-Handel, Dienstleister & Start-ups.
- Posttext darf enden mit „Bitte teilen – gerne auch im WhatsApp-Status!“.
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
- **2026-11-20 · „06:58 – Ein Morgen im Elektrobetrieb“** – Branchen-Check/Uhr-Countdown: Röntgenblick von oben (Dach aufgeschnitten, `clip`), Sturzflug in die Halle, bodennahe Fahrt an Kabeltrommeln, Galerie-Blick auf Transporter mit Dachleiter + „ELEKTRO“-Aufkleber, Büro, Ausfahrt durchs Tor; laufende Uhr 06:58→07:30 und Häkchen-Checkliste; Fakten-Karte „zu vermieten“; Schluss „Elektriker, Installateur oder Onlineshop – hier hat dein Betrieb Platz“. Musik E-C#m-A-B, 1,9-s-Takt. Neu im Modell: `branche=elektro` (Kabeltrommeln statt Reifen/Paletten, kein Stapler, Van mit Leiter/Aufkleber), Tages-Shots mit `van`/`clip`. Werbebild: neue Vorlage mit Hallen-Render oben, Schnittbild mit Kabeltrommeln. Dateien `3d/daily/2026-11-20.js`, `d2_*`.
- **2026-11-21 · „Draußen −5 °C. Drinnen: Fußbodenheizung.“** – Winter-Special: Schneetreiben in der Dämmerung (`winter=1`: Schnee-Partikel, verschneite Wiesen/Bäume), Torseite – Sektionaltor öffnet sich ins warme Licht, **Röntgen-Boden** (`floorx`: Hallenboden wird durchsichtig, glühende Heizschleifen), Büro, Aufstieg über verschneite Anlage; Temperatur-Anzeige außen −5 °C → innen WARM; Fakten-Karte; Schluss „Warm arbeiten – auch im tiefsten Winter“. Musik F#m-D-A-E, 2,4-s-Takt. `branche=neutral` (Kabeltrommeln statt Reifen, kein Stapler). Startbild + Werbebild Design „dark“. Dateien `3d/daily/2026-11-21.js`, `d3_*`.
- **2026-11-22 · „7 Hallen. 7 Gründe.“** – Countdown: Nahaufnahme der Hausnummer 7, lineare Gleitfahrt an der Bürofront von 7 bis 1 (Sonne, blauer Himmel), je Nummer ein Grund (ca. 150 m² · Halle unten/Büro oben · Sektionaltor · Fußbodenheizung · eigene Zähler · Parkplätze · Stadtgrenze Klagenfurt), Kran-Aufstieg mit Karawanken, Rückwärtsflug vom Büro in die Halle, Torseite in der Sonne; Schluss „7 Gründe. 1 Anruf.“ Musik C-G-Am-F, Takt 2,31 s synchron zu den Nummern. Startbild/Werbebild „orange“. Dateien `3d/daily/2026-11-22.js`, `d4_*`.
- **2026-11-23 · „Paket für dich!“** – Branchen-Check Onlineshop/Versand: Push-Nachricht „Neue Bestellung!“ als Hook, Packtisch von oben, Fahrt zwischen Packplätzen und Transporter, Vogelperspektive von der Galerie, Beladen durchs offene Tor, Drohne folgt dem Transporter zur Zustellung; Bestellzähler oben (0→128); Fakten-Karte; Schluss „Mehr Platz für deinen Shop“. Musik D-Bm-G-A, 2,0-s-Takt. Neu: `branche=versand` (Packtische, Paketturm, Van mit „VERSAND“-Aufkleber, kein Hubwagen). Startbild/Werbebild „photo“. Dateien `3d/daily/2026-11-23.js`, `d5_*`.
- **2026-11-24 · „Ein Tag. 30 Sekunden.“** – Zeitraffer: Kamera kreist um die Anlage, während Licht von Morgengrauen über Mittag und Sonnenuntergang zur Nacht wechselt (`lookFn` animiert die Lichtstimmung pro Bild), Lichter gehen an; Nachtfahrt an der beleuchteten Front, Büro bei Nacht, Morgengrauen und Abheben; Sonnenbogen-Anzeige (Morgen/Mittag/Abend/Nacht); Fakten; Schluss „Dein Betrieb. Dein Tag. Deine Halle.“ Musik F-Dm-Bb-C, 2,6-s-Takt. Werbebild/Startbild „light“. Dateien `3d/daily/2026-11-24.js`, `d6_*`.
- **2026-11-25 · „Quiz: Was passt in eine Halle?“** – Quiz-Format: Frage + vier Antwortkarten (A Transporter · B Werkstatt · C Büro · D Alles), Tor öffnet sich (A ✓), Werkbank unter der Lagerbühne (B ✓), Büro (C ✓), Auflösung im Röntgenblick von oben „D – alles zusammen“; Fakten; Schluss „Und was stellst du hinein?“ (lädt zum Kommentieren ein). Musik Am-F-C-G, Ticken bis zur Auflösung. Werbebild/Startbild „dark“. Dateien `3d/daily/2026-11-25.js`, `d7_*`.
