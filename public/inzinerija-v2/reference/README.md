# Nuorodiniai maketai

- `Inzinerija-v2.dc.html` – /lt/inzinerija puslapio maketas (visos sekcijos, tikri duomenys, veikiantys filtrai ir forma).

Gyva peržiūra (savininkas): https://claude.ai/artifact/5mjiYvL3vAZhQ2ZGgG7zkT → puslapis „Inžinerija v2“.

## Kaip skaityti šiuos failus

Tai **ne gamybinis kodas**. Failai parašyti dizaino įrankio šablonų sintakse:

| Sintaksė | Reikšmė | Ką daryti projekte |
|---|---|---|
| `{{ kintamasis }}` | reikšmė iš `renderVals()` | React props / state |
| `<sc-for list="{{items}}" as="x">` | ciklas | `items.map(x => …)` |
| `<sc-if value="{{cond}}">` | sąlyga | `{cond && …}` |
| `onClick="{{fn}}"` | įvykis | `onClick={fn}` |
| `class Component extends DCLogic { renderVals() … }` | logika | perkelti į hooks / gryną funkciją |
| `/_blob/…` paveikslėliai | įrankio saugykla | naudoti `/studio-assets/projects/giles-darbas-XX.webp` (žr. `data/*.json`) |

Imkite iš jų: sekcijų tvarką, tekstus, išdėstymą (flex/grid, tarpai), spalvas ir būsenas.
Spalvos ir šriftai – `design/tokens.css`. Tekstai – `data/inzinerija-content.lt.json` (jie yra autoritetingi, jei skiriasi nuo maketo).
