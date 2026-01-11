# Widget developer analysis (integrator POV)

Dato: 11. januar 2026

Dette dokumentet beskriver widgeten fra perspektivet til en utvikler som skal ta den i bruk i en app, og foreslår konkrete forbedringer (uten å endre UX unødvendig).

## 1) Slik widgeten brukes i dag

Minste vellykkede integrasjon består av:

- Import av styling
  - `@navikt/ds-css/darkside`
  - `@navikt/flexjar-widget/styles.css`
- Render av `FlexJarDock` med:
  - `surveyId`
  - `survey` (preset/builder/custom)
  - `transport.submit()` som sender `submission.transportPayload` (schemaVersion=1)

I tillegg kan integrator sende:

- `context.tags` (lav-kardinalitet segmentering som blir grafer)
- `context.debug` (høy-kardinalitet kun for detaljvisning)
- `events` for tracking
- `behavior.storageStrategy` for å velge consent/localStorage/none

## 2) Hva som er bra

- Transport er injisert (widgeten eier ikke nettverkslogikk), og payload er canonical.
- Skiller mellom `tags` (segmentering) og `debug` (feilsøking) – bra kontrakt for analytics.
- “Step mode” finnes allerede og håndterer branching logic robust.

## 3) Friksjon/pain points for integrator

### 3.1 Side-/rute-håndtering (SPA)

Mange apper er SPA (React Router, Next, etc). Hvis widgeten bare leser `window.location` én gang, kan payload ende opp med feil `url`/`pathname` hvis bruker navigerer uten full refresh.

Konsekvens:
- Segmentering og debugging kan peke på feil side.

### 3.2 "Alt på én side" vs "flere sider"

I dag er default:
- Ingen branching: alle synlige spørsmål vises på én side.
- Branching: step mode (ett spørsmål av gangen).

Integrator-behov:
- Noen vil ha step-basert flyt selv uten branching (mange spørsmål, mindre kognitiv last).
- Noen vil tvinge single-page for korte skjema.

Dette bør være et eksplisitt valg i API-et, ikke en implisitt konsekvens av branching.

### 3.3 README/API-konsistens

Det er lett at docs avviker fra faktiske props.
- Når integrator kopierer eksempel, bør det kompilere og gi riktig payload.

## 4) Foreslåtte endringer (konkrete)

### 4.1 Reaktiv side-/viewport-context (SPA)

- Auto-collect `context.url`, `context.pathname`, `viewport`, `deviceType` må oppdateres ved:
  - `history.pushState` / `history.replaceState`
  - `popstate` / `hashchange`
  - `resize`

Mål:
- Payload inneholder korrekt sideinfo ved submit, uten ekstra arbeid for integrator.

### 4.2 Ny param: `behavior.questionLayout`

Legg til en enkel enum:
- `"auto"` (default): step mode kun når branching logic finnes
- `"singlePage"`: vis alle synlige spørsmål på én side
- `"steps"`: vis ett spørsmål av gangen med Neste/Tilbake

Viktig avgrensning:
- Hvis branching logic finnes, må step mode brukes for korrekt navigasjon (selv om integrator har valgt `singlePage`).

## 5) Hva som er implementert nå

- Reaktiv side-/viewport-context som følger SPA-navigasjon.
- `behavior.questionLayout` for å tvinge step layout uten branching.

## 6) Neste forslag (ikke implementert her)

- Et tydelig «Integrasjon i Next/SPA» avsnitt i README.
- Eventuelt en `contextProvider` callback for apper som ikke ønsker å patche History (avansert).
