# Drehbuch – „Mietpark Schmacher“ · Werbefilm Schmacher Solutions

**Format:** Master 60 s · 16:9 · 4K-Look, 24 fps · Cutdowns: 30 s (16:9) und 20 s (9:16 Social)
**Look:** fotoreal, Architektur-Film im Stil eines Premium-Immobilienspots. Goldene Stunde → blaue Stunde. Weiche Drohnen-Moves, Gimbal-Fahrten, flache Schärfentiefe bei Details.
**Ton:** ruhig, selbstbewusst, hochwertig. Keine Marktschreierei.
**Tools:** Higgsfield (Keyframes/Startbilder, Bild-zu-Bild mit Referenzfotos) → Seedance 2.5 (Bild-zu-Video, 5–8 s je Shot) → ElevenLabs (Sprecher DE, männlich warm, ca. 35–45) → Musik + SFX → Schnitt/Grading/Titel mit ffmpeg.

---

## 1. Faktenbasis (aus Einreichplan, Baubeschreibung, Fotos)

| | |
|---|---|
| Standort | Zell bei Ebenthal, Kärnten – Gewerbegebiet, Felder, Bergkulisse (Karawanken-/Sattnitz-Panorama) |
| Grundstück | 3.000 m², 2 parallele Baukörper, 8 m breite Durchfahrt, Überdachung am Ende der Durchfahrt (Gemeinschaftsfläche) |
| **Bauteil 1** | 48,5 × 15 m · **7 Einheiten** mit Hausnummern 1–7 · **EG: reine Lager-/Hallenfläche** mit Sektionaltor, Raumhöhe bis ~7 m · **OG (auf der Lagerbühne): Büro + WC** (Planänderung ggü. Einreichplan, dort noch Büro/WC im EG) |
| **Bauteil 2** | 49 × 20 m · **14 Lager-/Garagenboxen** (je ~40 m² + ~27 m², je 2 Lagerbühnen à 13,6 m²) · Sektionaltore entlang der Längsseite |
| Konstruktion | Leimholz-Tragwerk (sichtbare Holzträger innen!), gedämmte Sandwichpaneele, Pultdach 3° mit Attika, geglättete Betonbodenplatte |
| Tore | Industrie-Sektionaltore, 42 mm PU-gedämmt, **Codetaster**, EPDM-Dichtungen, Notentriegelung, TÜV-abgenommen (lt. Baubeschreibung RAL 9006 Weißaluminium) |
| Technik | **Luft-Wärmepumpe**, LED-Beleuchtung, 3-fach-verglaste Fenster, Wasser/Strom/Kanal |
| Außen | Asphalt-Zufahrten (2× Süd, 1× Ost), Stellplätze (je Büro einer), ~322 m² Grünflächen |
| Fassade | Rillenpaneele im Wechsel **Holzdekor (Kupfer-Teak)** / **Anthrazit**, große schwarze Hausnummern, Fensterbänder |
| Zielgruppen | Gewerbe (Handwerk, Start-ups, Online-Händler, Lager) **und** Privat (Oldtimer, Wohnmobil, Motorrad, Hobbywerkstatt) |

**Verbesserungen ggü. Baustellenfotos (in jedem Prompt):** alle Tore und Türen montiert · keine Hebebühne, Kran, Transporter, Leiter, Personen von der Baustelle · Schotter → frischer dunkler Asphalt mit weißen Stellplatzmarkierungen, Pflasterstreifen vor Türen · gepflegte Rasenflächen, Hecken, junge Bäume · Wandleuchten (warmweiß, Up/Down) über jeder Tür, LED-Poller · Hausnummern in Schwarz matt · dezentes Schild „Schmacher Solutions · Mietpark“ an der Stirnseite.

---

## 2. Dramaturgie

**Idee: „Dein Raum wartet schon.“** Ein Mensch (ambitionierter Handwerker / Gründer, 30–40) fährt bei Sonnenaufgang zum ersten Mal in den Mietpark. Die Kamera nimmt uns mit: vom Bergpanorama über die Anlage, durch die Durchfahrt, zum Tor seiner Einheit, das sich öffnet. Innen: Licht flutet die hohe Halle mit Holzgalerie. Wir zeigen in kurzen Montagen, was hier alles möglich ist. Am Abend leuchtet die Anlage in der blauen Stunde → Logo + CTA.

Akte: **Ankommen (0–15 s) → Öffnen (15–28 s) → Möglichkeiten (28–48 s) → Versprechen (48–60 s)**

---

## 3. Shotliste (Master 60 s)

Jeder Shot: **[H] Higgsfield-Keyframe-Prompt** (Startbild, 16:9, mit Referenzfotos aus `referenz-fotos/` und Plan-Isometrie als Bild-Referenz) → **[S] Seedance-2.5-Motion-Prompt**.
Globaler Stil-Suffix für alle [H]-Prompts:
> *photorealistic architectural photography, shot on ARRI Alexa 35, 35mm anamorphic, natural light, subtle film grain, high dynamic range, crisp details, realistic materials, no people unless described, no text artifacts, no construction equipment*

### AKT 1 – Ankommen

**01 · 0:00–0:05 · Establishing – Bergmorgen** (Drohne)
- [H] Wide aerial at sunrise over the Carinthian countryside near Klagenfurt, golden fog over fields, Karawanken mountains on the horizon, in the mid-ground a modern commercial park of two long parallel flat-roofed buildings with copper-wood and anthracite panel facades, fresh black asphalt, green lawns.
- [S] Slow drone push-in forward and slight descent, fog drifting, first sun rays hitting the facades, birds in distance. Camera smooth, cinematic, 6s.
- SFX: Wind, ferne Vögel, tiefer Synth-Pad setzt ein.

**02 · 0:05–0:09 · Top-Down Reveal**
- [H] Perfect top-down aerial of the property (use Lageplan layout): two rectangular buildings 48 m long, 8 m wide asphalt driveway between them, standing-seam grey roofs, white parking markings, green lawn strips on the west and east, shadows long from sunrise.
- [S] Top-down drone rotates slowly 20° clockwise while rising, a dark premium SUV enters the driveway from the south. 4s.
- SFX: Reifen auf Asphalt (leise).

**03 · 0:09–0:15 · Fassaden-Fahrt Bauteil 1** (Ref: Fotos 07, 08, Ansicht Ost)
- [H] Eye-level 3/4 view of the office front: alternating vertical copper-wood and anthracite ribbed panels, large black house numbers 1, 2, 3, aluminum entrance doors, ribbon windows on upper floor, warm wall lights, clean paved walkway, manicured lawn, morning light.
- [S] Low gimbal tracking shot gliding parallel along the facade, numbers 1 → 4 passing by, light reflections in windows, slight parallax with a young tree in foreground. 6s.
- VO-Start.

### AKT 2 – Öffnen

**04 · 0:15–0:19 · Durchfahrt** (Ref: Foto 05, 09)
- [H] View down the 8 m wide asphalt driveway between both buildings, on the left a row of large anthracite-framed industrial sectional doors, wood-decor pilasters between units, covered canopy at the far end, morning sun flare.
- [S] Car-mounted POV slowly rolling forward through the driveway, stops in front of a sectional door. 4s.

**05 · 0:19–0:22 · Detail Codetaster**
- [H] Macro close-up of a sleek stainless keypad code switch mounted on anthracite ribbed facade panel, a hand with a work watch entering a code, shallow depth of field, bokeh of sunlight.
- [S] Finger presses last digit, keypad LED switches green. 3s.
- SFX: Tastenklicks, Bestätigungs-Beep, Musik-Beat 1.

**06 · 0:22–0:28 · Das Tor öffnet sich** (Hero-Shot, Ref: Foto 05 + 04)
- [H] Low wide angle from outside, one insulated industrial sectional door in white aluminium (RAL 9006) halfway open, warm light and morning sun spilling out from inside a tall hall with exposed glulam timber beams and a wooden mezzanine gallery.
- [S] Sectional door rises smoothly and completely, camera slowly dollies forward into the opening, dust particles glowing in light rays. 6s.
- SFX: elektrisches Torsurren, Dichtungsgeräusch, Musik baut auf.

### AKT 3 – Möglichkeiten

**07 · 0:28–0:33 · Innenraum Reveal** (Ref: Foto 04, Schnitt)
- [H] Interior of a finished unit, 7 m high, bright white sandwich panel walls, exposed light glulam beams and diagonal bracing, completely open ground-floor storage hall with polished concrete floor, LED light bars; above at 2.6 m a wooden mezzanine gallery with timber railing carrying a small glazed office box (office + WC) with warm light behind the glass, a timber staircase leading up, absolutely clean and empty, sunlight streaming in.
- [S] Slow crane-up from floor level up the staircase to the gallery railing, revealing the full height, the timber structure and the office on the gallery. 5s.
- **Drop:** Musik setzt voll ein.

**08–11 · 0:33–0:46 · Montage „Ein Raum. Viele Möglichkeiten.“** (je ~3 s, Match-Cut über Tor/Kamera-Position)
- 08 [H] Same unit as a craftsman workshop: workbench, tools on wall, woodworking machines, warm light. [S] slow lateral slide.
- 09 [H] Same unit with a polished classic car (no brand logos) and a motorcycle, gallery used for storage boxes. [S] slow orbit around the car.
- 10 [H] Same unit as e-commerce storage: neat shelves with cardboard boxes on the gallery, packing table below, laptop. [S] push-in.
- 11 [H] Small modern office on the mezzanine gallery, desk at the ribbon window with view over fields and mountains, glass partition looking down into the storage hall below, bright and calm. [S] gentle dolly from the gallery railing into the office, revealing the view down into the hall.
- SFX: kurze Whooshes je Schnitt, dezente Raum-Atmos (Werkzeug, Motor-Tick, Tape-Abroller, Kaffeemaschine).

**12 · 0:46–0:48 · Detail Qualität**
- [H] Macro detail of a glulam beam joint with steel connector and the triple-glazed window edge, soft light.
- [S] slow rack focus from beam to window. 2s.

### AKT 4 – Versprechen

**13 · 0:48–0:54 · Blaue Stunde** (Drohne, Ref: Fotos 10, 11, Iso)
- [H] Aerial at blue hour of the complete park, all facade wall lights glowing warm, light seeping from a few open sectional doors, illuminated house numbers, wet asphalt reflections, mountains silhouette and deep blue sky.
- [S] Slow drone pull-back and rise, lights flicker on one by one. 6s.

**14 · 0:54–1:00 · Endcard**
- Logo „Schmacher Solutions“ fügt sich aus warmem Licht über dem letzten Frame zusammen, darunter:
  **Mietpark Zell bei Ebenthal · Büro · Lager · Garage**
  **Jetzt Einheit sichern: [Telefon] · [Website]**
- SFX: Musik-Endakkord, tiefer Sub-Hit, Ausklang.

---

## 4. Sprechertext (ElevenLabs, Deutsch, ~95 Wörter)

> (03) Manche Ideen brauchen nur eines: **Platz.**
> (04) Platz zum Anpacken. Zum Wachsen. Zum Durchstarten.
> (06) Willkommen im **Mietpark Schmacher** in Zell bei Ebenthal.
> (07) Bis zu sieben Meter Raumhöhe. Sichtbares Holztragwerk. Eigene Galerie. Und ein Tor, das sich mit einem Code öffnet – rund um die Uhr.
> (08–11) Unten: volle Fläche für deine Werkstatt, dein Lager, deinen Oldtimer. Oben: dein eigenes Büro – mit WC und Blick über das Tal.
> (13) Modern gebaut. Wärmepumpe. Gedämmt. Bereit für alles, was du vorhast.
> (14) **Schmacher Solutions.** Dein Raum wartet schon.

**ElevenLabs-Setup:** Modell Multilingual v2 / v3 · Stimme warm, männlich, leicht rauchig, ruhiges Tempo · Stability 0,45 · Similarity 0,8 · Style 0,25 · pro Satz einzeln generieren, Pausen im Schnitt setzen.

## 5. Musik & Sound

- **Musik:** cinematischer Build-up – Ambient-Pad + Piano-Ostinato (0–15 s), Pulse/Percussion (15–28 s), Drop mit modernen Drums und Streichern ab Torrise/Innen (28 s), Höhepunkt Montage, ruhiges Outro mit Endakkord. 100–110 BPM, Schnitte auf den Beat. (Generierung über ElevenLabs Music bzw. Higgsfield-Audio, sonst lizenzfreie Library.)
- **SFX-Layer:** Wind/Vögel, Reifen, Tastenbeep, Tormotor, Raumhall, Whooshes, Sub-Hits auf Titeln.
- **Mix:** Sprache −14 LUFS integriert Master, Musik Ducking −8 dB unter VO.

## 6. Postproduktion

- Farblook: warm-neutral, Holz betont, Anthrazit satt; leichter Teal/Orange nur im Himmel.
- Titel: schlanke Grotesk (z. B. Inter / Manrope), Weiß + Akzent Kupfer `#B5703A`, Anthrazit `#2E3135`.
- Übergänge: Match-Cuts, Licht-Wipes durch Tor, keine Spielerei-Effekte.
- Exporte: `master_16x9_60s.mp4`, `cut_16x9_30s.mp4`, `social_9x16_20s.mp4` (Shots 01, 05, 06, 07, 09, 13, 14).

## 7. Offene Punkte / Entscheidungen

1. **Torfarbe:** Baubeschreibung sagt RAL 9006 Weißaluminium – Fotos/Plan wirken anthrazit. → Im Video: ? (Vorschlag: so wie tatsächlich bestellt)
2. **„Rolltore“ vs. Sektionaltore:** Plan sagt Sektionaltor – Video zeigt Sektionaltor.
3. Logo, Telefonnummer, Website für Endcard.
4. Preise / Aktion (z. B. „ab € … / Monat“, „Erstbezug 2026“)?
5. Sprecher: männlich oder weiblich? Du/Sie-Ansprache (aktuell: Du)?
