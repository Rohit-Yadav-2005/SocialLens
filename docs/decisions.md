# Engineering decisions

Running log of notable decisions and why they were made. Newest first.

## UI redesign #4: delete the skeleton, not the paint

Feedback after redesign #3 and the two passes that followed it: *"it
still looks thrash with the same structure... I keep bringing out the
same page with barely any changes. I want you to entirely REDESIGN the
UI."* That criticism was correct and worth recording plainly: rounds
#2 and #3 and the two color/typography passes all changed tokens,
fonts, and colors while leaving the same information architecture
underneath — masthead, hero split, boxed feature card, boxed CTA. A
palette swap on an unchanged skeleton reads as "barely any changes"
because it *is* barely any change, no matter how much the tokens move.

So this round changed structure only, and the check was mechanical
rather than aesthetic — **zero shadcn `Card` components on the landing
page** (`document.querySelectorAll('[data-slot="card"]').length === 0`,
verified live), because every prior round had reached for a bordered,
shadowed card as the default container for anything.

The page is now a single top-down "manuscript": dateline → headline →
the sample post set directly on the page → action row → pull quote →
"continued" dateline → drop-cap paragraph → metrics → colophon.
Concretely:

- **Header** (`layout/header.tsx`): dropped `sticky top-0 z-40` and the
  `.glass` backdrop blur; it's a static masthead now. The filled
  `Button` CTA became a bordered monospace text link — a document
  command, not a marketing button.
- **`landing/annotated-example.tsx`**: was a legend list underneath a
  boxed widget; now a real margin-note side column
  (`lg:grid-cols-[1fr_260px]`) beside text that sits directly on the
  page with no border or shadow. Verified genuinely side-by-side at
  1440px (columns at x=299–831 and x=871–1131, same baseline), not
  stacked.
- **`landing/capability-demo.tsx`**: was a dashboard panel; now a
  top-ruled stat grid and a bottom-ruled numbered list, in page flow.
- **`app/page.tsx`**: filled pill CTAs replaced with bracket-style
  bordered text links throughout.

**The page-sheet fix.** Follow-up feedback: wide viewports left "blank
wide margin which makes the page look slightly empty." Root cause is
specific to the single-column manuscript structure — a centered column
on a full-bleed background has nothing to terminate the eye at the
edges. Fixed by bounding the page in a `max-w-6xl` container with
`lg:border-x`, so past ~1152px you get a visible sheet edge instead of
open void (verified: at a 1440px viewport the sheet renders 1152px wide
with rules at x=139 and x=1291). Below that width the border is
off-screen and nothing changes, so mobile is untouched.

## Palette: indigo ink + antique gold, and why the first fix wasn't enough

"I do not like the current red-orangish color theme." Replaced the
rust/terracotta primary with a deep indigo ink
(`oklch(0.42 0.14 264)` light / `0.75 0.13 264` dark) and the teal
accent-2 with an antique gold (`0.48 0.14 75` / `0.8 0.13 80`).
Contrast computed from the OKLCH values before committing to them, not
eyeballed: 8.4:1 and 6.5:1 in light, 8.8:1 and 10.4:1 in dark.

Two follow-up rounds were needed, and the reason each was needed is the
useful part:

1. **The dark background was still hue 32.** The dark neutrals
   (`--background`, `--card`, `--muted`, ...) were a warm espresso
   left over from the rust palette, so the new cool indigo sat on a
   warm maroon field and fought it. Moved every dark neutral to a cool
   ink-blue (hue 258). Recoloring a primary is not enough when the
   neutrals were themselves tinted toward the *old* primary — that
   tint is easy to miss because it reads as "the background," not as a
   color decision.
2. **The quality-scale red/amber clashed on chroma, not hue.** First
   attempt only shifted their hues away from the discarded rust. Still
   wrong, because the real mismatch was intensity: the red and amber
   were lighter and more saturated than the deliberately restrained
   indigo and gold, so they read as bright warning stickers next to a
   muted palette. Pulled both deeper and down to the same chroma family
   (`#ef6661` → `#d85164` wine red, `#ee9b58` → `#d2833b` brass amber
   in dark mode; matching adjustment in light mode, which had the same
   latent clash). **Hue distance alone doesn't make colors coexist —
   they also have to agree on how loud they are.**

The four-step quality scale stays deliberately separate from both brand
colors (data color, not brand color, per the earlier color pass), and
still shares no hue with either.

Verification for all of the above read *rendered* computed styles off
the live page via a canvas-based color normalizer, not the CSS custom
properties — `getComputedStyle` returns `lab()`/`oklch()` strings for
this palette, which naive regex parsing silently corrupts (the same
trap documented in the earlier color pass).

## Grounded the design in real data instead of another aesthetic guess

Still "bad" after the color pass. At this point four rounds of "try
again" on pure aesthetic judgment had diminishing returns — the user
pointed at two external references
(`github.com/nextlevelbuilder/ui-ux-pro-max-skill`, `21st.dev`) instead
of describing the problem again, which is itself a signal: stop
guessing, go get real reference data. Pulled the actual structured
data from the first repo (`products.csv`, `styles.csv`,
`typography.csv`, `colors.csv` — 192 product-category rows, 88 style
definitions, 74 font pairings) rather than just reading its README
description, since the README alone wouldn't have surfaced anything
actionable.

**Category match, concretely, not vibes.** Cross-referenced SocialLens
against the product taxonomy: closest matches are Magazine/Blog
("Swiss Modernism 2.0", typography-focused), Notes & Writing App, and
Bookmark/Read-Later ("paper warm white + ink + minimal accent" — which
the redesign already happened to land on independently, a useful cross-
check). The font-pairing data had a near-exact match for what this
product actually is (B2B SaaS + analytics + editorial + human warmth):
row 61, "SaaS Mobile Boutique" — Calistoga display / Inter body / mono
labels, with italic explicitly reserved for pull quotes and editorial
callouts, never regular headings.

**The concrete, actionable gap this surfaced**: the Editorial Grid /
Magazine style's own checklist requires pull quotes and drop caps —
real print-journalism devices — and this page had neither, on any of
the three previous passes. That's a more specific, checkable finding
than "make it feel more premium." Added both:

- **Font**: replaced Newsreader with Calistoga (`app/layout.tsx`) — a
  warm slab-serif validated by the actual data for this exact product
  category, not another personal pick. Hit a real, different
  `next/font/google` gap this time: Calistoga has a true italic on
  Google Fonts' own catalog, but next/font/google's registry only lists
  a "normal" style for it (`Unknown style italic for font Calistoga.
  Available styles: normal` — caught by loading the page, same as the
  Fraunces and Newsreader font errors earlier). Worth remembering:
  next/font/google's available-styles list doesn't always match Google
  Fonts' own catalog for a given family — check by loading the page,
  not by trusting the family's Google Fonts page. Fixed by requesting
  only `style: "normal"` and applying `italic` as a Tailwind class on
  top — a browser-synthesized slant on the regular weight, not a true
  italic design, but a normal and imperceptible fallback for a single
  pull-quote use.
- **Pull quote**: a new section between the hero and the capability
  demo, "Most weak posts don't need a rewrite. They need one sentence
  fixed." — set in italic Calistoga, large, centered, breaking the
  page's rhythm on purpose (the classic function of a magazine pull
  quote: a resting point, not more content).
- **Drop cap**: new `.drop-cap` utility (`::first-letter`, set in the
  display face, sized against the paragraph's own line-height) applied
  to the capability section's opening paragraph.

Verified live, not assumed: `.drop-cap`'s `::first-letter` computed
style (54px, colored in primary) and the pull quote's actual `font-style:
italic` both confirmed via `getComputedStyle` in a real browser; zero
horizontal overflow; contrast on the pull quote text still 16.8:1.
85/85 tests, ESLint, and `tsc --noEmit` pass.

## Color pass: two real brand colors instead of one sparse one

Feedback on redesign #3: "looks bland." Fair — the one-sparse-accent
rule from redesign #2 (kill the gradient, use the brand color only on
truly interactive elements, neutral everywhere else) was correct as far
as it went, but taken with the also-correct "no glow blobs" rule, the
result had almost no color left anywhere. Restraint and blandness aren't
the same thing; overcorrected past the former into the latter.

**Two real solid brand colors, still never blended into a gradient.**
Kept `--primary` (rust/terracotta, the "act on this" color — buttons,
focus rings, links) and added `--accent-2` (a deep teal, the "here's the
result" color). The distinction is deliberate, not decorative: applied
`accent-2` to the AI-improved-content card border/heading in
`content-comparison.tsx`, which previously used `primary` — meaning the
"open a card" affordance and "here's the payoff" result used to look
identical, and now don't. Two distinct solids used for two distinct
meanings is a different thing from a five-stop gradient used as
wallpaper; the first redesign's mistake was the latter, not "any color
beyond one."

**Deepened the base palette itself**, not just the accents — this is
most of where "bland" actually lived. Light background went from
`oklch(0.983 0.004 60)` (chroma 0.004 — barely a color at all) to
`oklch(0.96 0.012 55)`; dark background from `oklch(0.16 0.012 40)` to
`oklch(0.15 0.026 32)`, more than doubling the chroma. Verified live in
the browser, not just in the token file: dark mode's rendered
`background-color` is genuinely `rgb(21, 7, 5)` — a real saturated
espresso-red-black — and light mode is `rgb(249, 240, 234)`, a real warm
cream, not off-white-that-happens-to-have-a-hue-value.

**New token needed registering in `@theme inline`, not just `:root`/
`.dark`.** Tailwind v4 only generates utilities (`text-accent-2`,
`border-accent-2`, etc.) for tokens explicitly mapped under
`--color-*` in the `@theme` block — adding `--accent-2` to `:root`
alone doesn't do that. Caught a real verification pitfall while
confirming this worked: testing `border-accent-2` (no opacity suffix) in
the live DOM came back as the *default* border color, looking exactly
like a registration bug — but the actual source only ever uses
`border-accent-2/45`, and Tailwind's JIT scanner generates CSS for the
exact class strings it finds in source, not every theoretically-valid
variant. Re-tested with the literal string used in code
(`border-accent-2/45`) and it resolved correctly. Worth remembering:
testing a Tailwind utility class needs the *exact* string from source,
including modifiers — a plausible-looking near-miss string can fail for
reasons that have nothing to do with whether the real usage works.

All 85 frontend tests, ESLint, and `tsc --noEmit` still pass. Contrast
re-verified in both themes after the change (canvas-based, real
rendered colors): headline 16.8:1 (light) / 18.1:1 (dark), primary
button 6.4:1 / 8.0:1 — both comfortably clear of AA's 4.5:1 floor even
after the richer, higher-chroma values.

## UI redesign #3: rebuild the structure, not just the skin

Direct pushback on redesign #2 (below), and correct: "you did not change
much, it looks like it just changed the color code." True — the skeleton
was untouched: navbar -> centered hero (headline+CTA / supporting
visual) -> 4-icon-square feature grid -> 3-step numbered list -> closing
CTA card. That arrangement is itself the tell (`AI-generated frontends
... predictable wireframe scaffolding`, per the reference material the
user supplied), independent of color or font. Recoloring it or reserifing
the headings doesn't touch the actual problem.

**Audited the codebase against the supplied tell list before changing
anything** (grepped for console-log noise, `any` escapes, submit-handler
naming drift, missing effect cleanup) — genuinely clean on every one.
Worth recording precisely because it means the fix is 100% in structure/
composition, not code hygiene; no manufactured findings to pad the
response.

**Font, again.** Fraunces (redesign #2's choice) is itself a "quirky
variable soft-serif" that's become a recognizable AI-template default —
picking a different flavor of the same category doesn't fix the
category. Replaced with Newsreader: a genuine long-form/publication
reading serif, not a startup-landing-page face. Hit the same
`next/font/google` "axes requires weight: variable" error as before on
first attempt (fixed identically) — worth noting this is now a known
constraint for any future font swap in this project, not a one-off fluke.

**Structural rebuild, not rearrangement:**

- **Dissolved both the 4-icon feature grid and the 3-step "how it
  works" list.** Their content (extract/analyze/improve/track) was
  genuinely redundant between the two sections, and "icon in a bordered
  square times four" is arguably *the* single most recognized
  component-library default that exists. Replaced with one section built
  on the *same* sample post from the hero, taken one step further:
  `components/landing/capability-demo.tsx` shows that post's actual
  deterministic metrics (word count, hashtags, a readability number) and
  the two recommendations it would actually generate. The page now reads
  as one continuous demonstration — headline, then the post, then what
  the post's own numbers and fixes look like — instead of four
  disconnected abstract blurbs.
- **New `components/landing/sample-post.ts`** is the shared source of
  truth for that one example (text, annotations, metrics,
  recommendations), imported by both the hero and the capability
  section — the continuity is structural (one `const`), not just a
  copy-writing choice that could drift.
- **The example is the dominant hero element, not a decorative aside.**
  Inverted the previous side-by-side ratio: the annotated post now sits
  in a 7-of-12-column span with the subhead/CTA in the remaining 5,
  instead of matched ~50/50 columns with the visual as a supporting
  element beside the "real" text content. Confirmed in a real browser at
  1440px: the example renders at 621px inside the ~1088px content width
  — genuinely 7/12, not eyeballed.
- **Motion cut from 10 scroll-reveals to 1.** Staggering every grid item
  by a uniform delay was itself a pattern — motion applied because it was
  easy to apply everywhere, not because any specific element earned it.
  Confirmed via `document.querySelectorAll('.reveal').length` before
  (10) and after (1) the rebuild.
- **Closing section de-boxed.** Was a centered, bordered, padded card
  with its own heading+subhead pair (redundant with the hero's own
  heading+subhead pattern) — now a plain, asymmetric heading+button row
  with no card wrapper, and copy that names the actual action ("Upload
  your own draft and see what it finds") instead of generic
  "Ready to improve your next post?" phrasing.
- **Copy pass**: cut "A complete content review, in seconds" and similar
  near-boilerplate lines flagged in the user's own brief; replaced with
  sentences that only make sense next to the specific example they sit
  beside (e.g. "computed directly from the text above, not guessed at").

All 85 frontend tests, ESLint, and `tsc --noEmit` still pass; verified
live in-browser (not assumed): zero horizontal overflow, the 7/12
column ratio at desktop width, and the reveal-element count dropping
from 10 to 1.

## UI redesign #2: away from "Prism", toward a restrained editorial mark

Direct user feedback on the "Prism" redesign (below): the landing page
read as generic/AI-generated specifically because of the pattern that
redesign leaned into — a violet-to-cyan gradient on the badge, headline,
and CTA at once; glowing blurred background blobs; a pill badge with a
pulsing dot; a "Turn X into Y" headline with a gradient word; a floating
generic score-gauge mockup; two equal-weight hero buttons; a centered
symmetric two-column layout; default-feeling type. Each of those is
individually a known "AI/template" tell, and Prism had all of them at
once. The brief was explicit: fix the tells, but land somewhere premium
and deliberate, not stripped-down.

**One brand accent, chosen for a reason, used sparingly.** Replaced the
five-stop spectral gradient with a single burnt terracotta
(`oklch(0.52 0.16 42)` light / `oklch(0.74 0.15 55)` dark) — an editor's-
mark color, not a generic SaaS violet/teal/blue, and it appears only on
truly interactive elements (the primary button, focus rings, the nav
underline, one bordered card). Verified by computing actual WCAG contrast
ratios (not eyeballed) before committing to values: button-fill-plus-text
sits at 5.9:1 (light) / 7.5:1 (dark), both well past AA.

**Quality-scale colors are a separate palette from the brand accent.**
Found and fixed a real bug this surfaced: `scoreLabel()` in
`lib/score-utils.ts` mapped "Good" scores to `var(--primary)` — meaning
under the new one-accent system, a "Good" score would have rendered in
the *exact same color* as the CTA button, the opposite of the intended
separation. Re-pointed the whole four-step scale (needs-work/fair/good/
excellent) to dedicated `chart-2..5` tokens (red -> amber -> teal ->
green) that share no hue with the brand accent. Same fix applied to two
Recharts gradient defs that referenced `--chart-1` (which now mirrors the
brand accent) — replaced with flat single-color fills, which also reads
more precise/intentional than a gradient on a data series.

**Landing hero rebuilt against every specific point raised:** no badge;
headline rewritten away from the "Turn X into Y" formula
("Every post has a weak line. Find it before you publish."); the
gauge-mockup replaced with `components/landing/annotated-example.tsx` —
a realistic sample post with three specific flagged phrases and reasons,
which is what "show real analyzed content, not a mockup" actually asked
for; one primary CTA plus a plain de-emphasized text link, not two equal
buttons; asymmetric 7/5 column split with the example rotated and not
vertically centered against the headline, instead of the old centered
grid; glow blobs removed in favor of a faint `grid-lines` texture that
fades out toward the bottom of the hero.

**Typography: Fraunces (display) + Geist (body), not Space Grotesk.**
Space Grotesk paired with Geist is itself a very common
"AI-generated-site" pairing at this point. Fraunces is a variable serif
with real optical-size/soft-axis character, and — since SocialLens is
fundamentally a close-reading/critique tool — a serif display face is
thematically apt, not just different-for-its-own-sake. Hit a real
Next.js constraint building this: `next/font/google` rejects a `weight`
array combined with `axes` ("Axes can only be defined for variable fonts
when the weight property is nonexistent or set to `variable`") — only
caught by actually loading the page (a 500 the whole time until fixed),
not by `tsc`/tests/lint, none of which touch font-loading config. Fixed
by setting `weight: "variable"` instead of a fixed array.

**Elevation instead of glow.** Every `--glow-primary`/`--glow-cyan`
blurred-blob usage (14 files) and the `--spectral` gradient utilities
(`bg-spectral`/`text-spectral`/`.spectral-ring`, 18 files) were removed
from `globals.css` outright — not just unused, deleted — which meant
sweeping every call site rather than leaving them silently unstyled.
Replaced with a real 3-level shadow scale (`--shadow-1/2/3`, precise
layered shadows, no color tint) and neutral bordered surfaces. Caught by
this same sweep: `badge.tsx` used `rounded-4xl`, and `--radius-4xl` was
one of the tokens trimmed from the new radius scale — would have quietly
gone square-cornered. Found by grepping for `rounded-3xl|rounded-4xl`
project-wide after trimming the token, not by visual inspection.

**Motion:** micro-interactions tightened to 150-200ms (buttons: solid
fill + `hover:bg-primary/90`, `active:scale-[0.98]`, existing
`focus-visible` ring kept as-is since it was already correct); a real
`useInView`/`Reveal` (`hooks/use-in-view.ts`,
`components/layout/reveal.tsx`) IntersectionObserver pair drives
scroll-triggered fade+translateY reveals, staggered per grouped item;
`useCountUp` (`hooks/use-count-up.ts`) animates `OverallScoreCard`'s
score number and its ring's arc off the *same* animated value, so they
resolve in sync — an improvement over the old version, where the ring's
CSS animation and the (static, non-counting) number were unsynced.

Both new hooks read `prefers-reduced-motion` once via a `useState` lazy
initializer and branch on that stored value, rather than calling
`setState` synchronously inside `useEffect` for the reduced-motion case —
the obvious-looking version of that fails a real lint rule
(`react-hooks/set-state-in-effect`) precisely because effect-triggered
setState causes an extra render pass; deriving it once and reading `?
target : value` at the return site avoids the extra render entirely
rather than just silencing the warning.

**jsdom needed a `matchMedia` polyfill** (`vitest.setup.ts`) once these
hooks shipped — jsdom doesn't implement it, so every test touching
`OverallScoreCard` failed with `window.matchMedia is not a function`
until added. Defaulted the polyfill to "reduced motion" for tests (not
"no preference") on purpose: tests assert on final rendered content, not
animation timing, and reduced-motion mode resolves both hooks to their
final value immediately, so existing assertions needed no `waitFor`
changes at all.

All 85 frontend tests, ESLint, and `tsc --noEmit` pass. Verified beyond
that in a real browser rather than assumed: computed WCAG contrast via a
canvas-based color normalizer (not raw `getComputedStyle` string
parsing, which silently produces garbage on `lab()`/`oklch()` computed
values — caught this the hard way when a first attempt reported
nonsensical ~1.4:1 contrast on clearly-readable dark-on-light text) in
both themes; confirmed all 10 scroll-reveal elements fire on scroll;
confirmed zero horizontal overflow at 375px; confirmed the font-loading
500 was real by watching the page actually fail before the fix, not just
inferring it from the error text.

## Real deploy failure: a builtin-shadowing bug only Python <3.14 hits

The first actual Render deploy crashed at container startup —
`TypeError: 'function' object is not subscriptable` — inside
`AnalysisRepository`, evaluating `list_trend_and_weaknesses`'s own return
annotation `list[tuple[datetime, int, list[str]]]`. Root cause:
`AnalysisRepository.list()` (an earlier method in the same class) binds
the name `list` in the class body's namespace; Python evaluates function
annotations eagerly by default, in whatever scope is active when the
`def` statement executes — which, for a method defined later in the same
class body, is that same namespace. So `list[...]` in the later method's
annotation doesn't resolve to the builtin, it resolves to the `list`
*method* sitting right above it, and subscripting a function object
fails.

This reproduced live on Render (`python:3.12-slim`, per the Dockerfile)
but never once locally, across 141 passing test runs, on the dev
machine's Python 3.14 — confirmed by a fresh `python -c "from
app.repositories.analysis_repository import AnalysisRepository"` import
with all `__pycache__` cleared, no caching involved. The reason: PEP 649
(Python 3.14) made annotation evaluation lazy by default, so the
subscript expression is never actually evaluated at class-definition
time on 3.14 — only on 3.12 and earlier, which is what every real
deployment target (and this project's own Dockerfile, deliberately
pinned to 3.12 for wider availability — see the Docker/deployment entry
below) actually runs. This is exactly the kind of bug "verified by
careful static review, not an actual `docker build`" (README section 15,
same entry below) was flagged as unable to catch — and didn't.

Fixed with `from __future__ import annotations` (PEP 563 — stable since
Python 3.7, not just a 3.14 thing) in every file with the same hazard
shape: a method named after a builtin (`list`) followed by any method
whose own annotation references that builtin generically. Grepped for
`def list(`/`def dict(`/etc. across `backend/app` and found four:
`AnalysisRepository`, `DocumentRepository`, `AnalysisService`,
`DocumentService`. Only `AnalysisRepository` was actually crashing today
— the other three have the identical shadowing shape but no method after
`list()` currently uses a bare `list[...]` annotation, so they were
latent, not live. Fixed all four rather than just the one that happened
to crash first, since the other three are one future method addition
away from the exact same failure. All 141 backend tests, ruff, and black
still pass — that was never in doubt, since 3.14 doesn't hit this at all;
the actual fix is only provable by a real deploy on <3.14, which is
next.

## Docker/deployment (Phase 9), rebuilt after the code-review pass

This work was done once already, then deliberately reverted at the
user's request before the code-review pass (below) — the artifacts here
are a fresh rebuild against the post-review codebase, not a restore of
the old ones, since e.g. the rate limiter and the two new exception
handlers didn't exist yet the first time.

**Rate limiter vs. reverse proxy — the one thing worth catching before
deploying.** `app/core/rate_limit.py`'s `RateLimiter` keys on
`request.client.host`, which is the raw ASGI transport peer address.
Render/Railway/Fly all place a reverse proxy in front of every container
— there is no path from the public internet directly to the app — so
without telling uvicorn to trust that proxy's `X-Forwarded-For`, every
request's `client.host` would resolve to the proxy's own address, and
the per-IP limiter added in the code-review pass would silently become
one shared limit across every real user instead of an individual one.
Fixed by starting uvicorn with `--proxy-headers
--forwarded-allow-ips='*'` in the Dockerfile's `CMD`. Trusting `*` is
specifically safe here — and would be specifically unsafe (a spoofing
vector) for a server reachable directly from the internet — because in
this deployment shape that direct path never exists; the container's
only inbound connection is the one from the platform's own ingress.

**Python 3.12 in the image, not 3.14.** The dev environment used 3.14
(see "Python 3.14 for the backend" below), but 3.12 is a more
conservative, more widely-available target for something that has to
build reliably on a deploy platform's infrastructure, and nothing in the
codebase requires 3.14-only syntax — already noted as expected-to-work
when that decision was first made.

**`alembic upgrade head` runs on every container start,** not as a
separate manual step — standard for a deployed single-instance service,
and means a fresh deploy (or the 3 existing migrations plus the new
`created_at` index migration from the review pass) is always applied
without an extra deploy-time script.

**SQLite on a named volume for Compose, ephemeral for a bare
`docker run`.** Local Compose use mounts a named volume at `/app/data`
and overrides `DATABASE_URL` to point there, so the database survives
`docker compose down`. A bare `docker run` (no Compose) has no volume —
the SQLite file lives in the container's writable layer and is lost with
the container, which is documented as expected rather than treated as a
bug to fix. The same tradeoff applies to Render's free tier in
production: the disk is ephemeral there too, and adding a persistent
disk (or moving to Postgres, already just a `DATABASE_URL` change per
"SQLite now, Postgres-compatible later" below) is a deliberate upgrade a
reader can make, not something "no unnecessary infrastructure" called
for by default.

**Verification: still couldn't run Docker itself.** Same constraint as
the first attempt — no Docker Desktop / `docker` binary in this sandbox,
confirmed again via both Bash and PowerShell. Didn't retry the WSL2
fallback this time; it already failed on process-spawning the first time
(the same sandbox restriction Vitest and Playwright hit in Phase 8 — see
"Both Vitest and Playwright needed non-default process/pool settings"
below), and re-attempting an approach with a known root cause would just
burn time to confirm the same failure. Verified instead by careful static
review against the real app: `app/core/config.py` for every setting the
container needs, the actual `/api/v1/health` route for both
`HEALTHCHECK` targets, `requirements.txt` (not `requirements-dev.txt`)
for what the image installs, and — new this time — actually tracing
through how the reverse-proxy-vs-rate-limiter interaction would behave
in production rather than assuming it would just work. That last part is
exactly the kind of bug static review is good at catching and a
same-machine `docker compose up` wouldn't have caught either, since
there's no reverse proxy in front of a local container. Whoever runs
this next with real Docker available should still treat `docker compose
up --build` as the actual first verification, not this review.

## Code review pass: Low findings fixed

The 8 Low findings left over from the High/Medium pass (below), fixed as
a follow-up:

- **Unused dependencies.** `react-hook-form` and `@hookform/resolvers`
  were never imported anywhere — `npm uninstall`'d rather than just
  deleted from `package.json`, so `package-lock.json` stays consistent.
- **Dead generated UI components.** `tabs.tsx`, `progress.tsx`,
  `separator.tsx`, `label.tsx`, `dropdown-menu.tsx` — standard
  shadcn-scaffolding leftovers, unimported anywhere. Deleted; `tsc
  --noEmit` confirmed nothing referenced them.
- **Duplicated pagination-param building.** `listDocuments`/
  `listAnalyses` in `lib/api.ts` each rebuilt the same skip/limit
  `URLSearchParams` logic. Extracted `buildPageParams()`.
- **Unencoded path segments.** `documentId`/`analysisId` were
  interpolated directly into fetch URLs. Wrapped in
  `encodeURIComponent()` — harmless today since IDs are server-generated
  UUIDs, but no longer depends on that staying true.
- **Missing indexes on `created_at`.** Both `documents.created_at` and
  `analyses.created_at` are ordered on by every list endpoint (and now
  also by the insights aggregate/trend queries) but weren't indexed.
  Added `index=True` to both columns and generated a real Alembic
  migration (`45d04701d86c`) rather than hand-writing DDL — applied to
  the dev database and confirmed via `sqlite_master`.
- **Hardcoded card corner-radius in three places.** `Card`, `CardHeader`,
  and `CardFooter` each hardcoded `rounded-2xl`/`rounded-t-2xl`/
  `rounded-b-2xl` independently (introduced in the Prism redesign, below).
  Now one `--card-radius` custom property set on `Card` and inherited by
  its sub-slots, the same pattern already used for `--card-spacing` in
  this file. Confirmed the computed `border-radius` is byte-identical
  (21.6px) before and after.
- **`AnalysisService.analyze_document`'s bare `except Exception`.**
  Treated an expected AI-provider failure and a genuine programming bug
  (e.g. a regression in `blend_scores`) identically, with nothing logged
  at the point of catch. Split into `except AppError` (a `logger.warning`
  — this is an expected, already-categorized failure) and `except
  Exception` (a `logger.exception` — this is not), so the two are
  distinguishable in logs. Behavior (revert status, re-raise) is
  unchanged in both branches.
- **Inconsistent endpoint docstrings.** Only `get_document_analysis` had
  one; the rest of `/docs`' Swagger UI had no description. Added a
  docstring to every route handler — confirmed live via `/openapi.json`
  that every path now has a real, non-empty `description`.

All 141 backend tests (ruff/black clean) and all 85 frontend tests
(ESLint/`tsc --noEmit` clean) still pass.

## Code review pass: High/Medium findings fixed

A senior-engineer-style review of the whole codebase surfaced 18 ranked
findings across security, architecture, error handling, a11y, and test
coverage (Critical/High/Medium/Low). None were Critical — no auth bypass,
no data loss, no secret leakage. The 3 High and 7 Medium findings were
fixed; the 8 Low findings (unused deps, dead UI components, minor
duplication) were left as a follow-up list rather than expanding scope.
One finding from the initial pass (a suspected prompt-template crash on a
bare `$` in extracted text) turned out to be a false alarm on empirical
verification — `string.Template.substitute()` only re-scans the template
string for placeholders, never the values being substituted in, so a `$`
inside uploaded content is inert. Worth remembering as a pattern: verify
a suspected bug by running it, not by reasoning about stdlib internals
from memory.

**Fixed:**

- **No rate limit on cost-incurring endpoints.** `POST /documents` and
  `POST /documents/{id}/analyze` (the one that spends real Gemini quota)
  were open to unlimited calls from anyone who could reach the backend.
  Added `app/core/rate_limit.py` — an in-memory, per-IP fixed-window
  counter, no new dependency (consistent with "no infrastructure beyond
  what's needed" — see "Modular monolith, no task queue" below). 20
  req/5min on upload, 10 req/5min on analyze (stricter since it's the
  paid one). Disabled via `app.dependency_overrides` in the `client`
  fixture so the functional test suite's repeated calls never trip it;
  the limiter has its own dedicated tests (`test_rate_limit.py`) against
  a fresh instance instead. Not a substitute for real auth — a basic
  abuse guard for a single-instance deployment, documented as such.
- **Uploads weren't size-capped before being received.** `await
  file.read()` buffered the whole body before `validate_upload()` ever
  checked the 20MB limit. Now checks `Content-Length` first (rejects
  before reading anything, for well-behaved clients) and reads
  `max_size + 1` bytes as a backstop for clients that omit it — an
  oversized file is never fully buffered.
- **History links to unanalyzed/failed documents dead-ended on a generic
  "not found" error.** Every History row links to `/analyze/{id}`
  regardless of status, and a document that was never analyzed 404s on
  `GET .../analysis` — a completely normal path (upload, get distracted,
  check History later, click the row). `useDocumentAnalysis` now
  distinguishes "analysis genuinely doesn't exist yet" (`NOT_FOUND` on
  the analysis fetch specifically, document loaded fine) from a real
  error, and the results page renders a new `NotAnalyzedYet` state with
  an inline "Analyze this document" button — verified end-to-end against
  the real Gemini API, not mocked, including the actual in-place
  transition from that state to the full results dashboard.
- **Two incompatible error-response shapes.** Hand-raised `AppError`s
  return `{error_code, message}`; FastAPI's own validation errors
  returned `{"detail": [...]}` — confirmed live (`platform=nonsense` on
  `/analyze` returned the FastAPI shape), and the frontend's
  `parseErrorBody()` only understood the former, so a validation failure
  surfaced as generic "Something went wrong" despite FastAPI already
  having a specific message. Added `RequestValidationError` and
  `StarletteHTTPException` handlers in `main.py` that reshape both into
  the app's one envelope (`VALIDATION_ERROR` / `HTTP_ERROR`), verified
  live against `/analyze?platform=nonsense`, `/analyses?limit=99999`, and
  an unmatched route.
- **Insights aggregation loaded every analysis row into Python.**
  `AnalysisRepository.list_all()` + `sum(...)/total` in Python, previously
  justified as "fine at this scale." Replaced with
  `aggregate_stats()` (one SQL query, `COUNT`/`AVG`) for the three
  averages, and `list_trend_and_weaknesses()` (three columns, not every
  column of every row) for the trend chart and weakness categorization —
  the two things that genuinely need per-row data. `list_all()` is gone;
  nothing else used it.
- **Prompt injection surface.** Extracted document text is interpolated
  directly into the Gemini prompt, delimited only by triple-quotes. Added
  an explicit rule telling the model to treat anything inside the
  delimited block as content to evaluate, never as instructions to obey,
  plus a reminder line immediately after the block (belt-and-suspenders
  placement, not just one mention up top). Numeric scores were always
  schema-constrained via Pydantic regardless; this closes the softer gap
  where the AI's free-text fields (tone/strengths/weaknesses/
  improved_content) had no explicit defense at all.
- **`PlatformSelect` didn't implement radiogroup keyboard semantics.**
  `role="radiogroup"`/`role="radio"` were correct for screen-reader
  labeling, but every option was individually tabbable — WAI-ARIA
  authoring practices expect one tab stop with arrow-key navigation
  (roving tabindex). Implemented roving tabindex + Arrow/Home/End
  handling, with a new test file covering both the ARIA attributes and
  the keyboard behavior.
- **CORS wider than the API needs.** `allow_methods=["*"]`,
  `allow_headers=["*"]` alongside `allow_credentials=True`. Narrowed to
  `["GET", "POST"]` and `["Content-Type"]` — everything the app actually
  sends.
- **Duplicated empty-state markup.** History and Insights each hand-rolled
  a near-identical icon-square + heading + description + CTA block for
  their zero-data state, while `ComingSoon` already existed for their
  *error* state with an older, undesigned look — the redesign had been
  applied inconsistently. Replaced both with one `EmptyState` component
  (`components/layout/empty-state.tsx`, `ComingSoon` deleted), used for
  History/Insights empty and error states, `ResultsError`, and the new
  `NotAnalyzedYet` state. Renders `<h2>`, not `<h1>` — every page that
  uses it already has its own page-level `<h1>` above it; the old
  `ComingSoon` rendering `<h1>` inside a page that already had one was a
  real duplicate-heading bug this incidentally fixed.
- **Zero test coverage for any custom hook.** Added
  `use-analyze-flow.test.tsx` (the `failedPhase` tracking logic —
  the bug fix called out below under "Two real bugs found") and
  `use-history.test.tsx` (the client-side document/analysis join,
  including the re-analyze/first-seen-wins edge case), both using
  `renderHook` + a real `QueryClientProvider` with `@/lib/api` mocked at
  the module boundary.

Left as a follow-up (Low severity, not expanded into this pass): unused
`react-hook-form`/`@hookform/resolvers` dependencies, unused generated
shadcn primitives (`tabs`, `progress`, `separator`, `label`,
`dropdown-menu`), duplicated pagination-param building in `lib/api.ts`,
missing indexes on `created_at` columns, hardcoded card corner-radius in
three places, unencoded path segments in `lib/api.ts` fetch URLs, the
bare `except Exception` in `AnalysisService.analyze_document`, and
inconsistent endpoint docstrings.

## Visual identity: "Prism", derived from the product name

The UI was a stock shadcn install — `oklch(1 0 0)` white, the default
violet-blue primary, flat `ring-1` cards, Geist at `font-semibold
tracking-tight`, and a four-identical-icon-squares feature grid. Every one
of those is a default you get for free, which is exactly why the result
read as generic: nothing on the page was a *choice*.

Rather than swap in a different arbitrary accent colour, the identity is
derived from the product's own name. SocialLens → a lens refracts light
into a spectrum. That gives one idea the whole system follows from:

- **Spectral gradient** (`--spectral`, violet → indigo → cyan → teal) as
  the brand signature — logo mark, primary buttons, section eyebrows,
  active nav underline, the improved-content card.
- **Score scale mapped onto the spectrum**: rose (needs work) → amber
  (fair) → violet (good) → teal (excellent), so `chart-1..5` and
  `scoreLabel()` are the same visual language rather than unrelated
  palettes. A score's colour now *means* something.
- **Never pure black or white**: both themes carry a blue-violet cast
  (`oklch(0.155 0.021 279)` dark / `oklch(0.982 0.005 285)` light). Pure
  neutrals are the single biggest "default template" tell.
- **Space Grotesk for display**, Geist for body, Geist Mono for figures —
  headings previously differed from body text only by weight, which is
  what made the type feel flat.
- **Texture and depth**: an SVG-noise grain overlay, drifting blurred
  glow orbs, a masked grid floor in the hero, gradient hairline borders
  (`.spectral-ring`, via `mask-composite: exclude` — a gradient
  `border-image` can't do rounded corners), and colour-tinted shadows.

Two constraints were deliberately preserved through the redesign:

1. **`DashboardPreview` still shows `--/100` and no fabricated scores.**
   It's more visually elaborate now, but the rule from the landing-page
   decision below still holds — marketing art must not look like a real
   result.
2. **`ProcessingStages`' icon classes were left untouched.** Its tests
   assert on literal `bg-primary` / `text-primary` / `border-destructive`
   class names, so only the surrounding container was restyled. Worth
   knowing before refactoring that component: the class names are load-
   bearing.

All 71 frontend tests and ESLint still pass, and both themes plus mobile
were verified in a real browser (no horizontal overflow at 375px; every
animation confirmed running).

## Testing stack: Vitest + React Testing Library, plus one Playwright test

Vitest (not Jest) for unit/component tests — it shares Vite's transform
pipeline, needs near-zero config for a TypeScript + React 19 project, and
is the de facto default for new Vite-adjacent projects. React Testing
Library on top, since it tests behavior (what's on screen, what a user
can click) rather than component internals.

For the one required end-to-end test, Playwright drives the *real* app in
a *real* browser rather than simulating the flow in jsdom — this is the
one test in the suite that would have caught two real bugs found earlier
by manual browser testing (Phase 5's Base UI `nativeButton` warning,
Phase 6's TanStack retry/focus-pause bug) automatically. Scoped to
exactly one test, per the assessment's "at least one" ask and the
project's "don't over-engineer" principle — broader E2E coverage would
duplicate what the component tests and backend integration tests already
cover more cheaply.

## E2E test mocks the backend at the network layer, not a real stack

`page.route()` intercepts the frontend's calls to `/api/v1/*` and returns
canned JSON rather than running a real FastAPI + Gemini + Tesseract
backend during the test. This E2E test's job is to verify the frontend's
own wiring — component composition, TanStack Query, client-side routing,
rendering — not to re-prove backend correctness, which the backend's 136
pytest tests already do far more thoroughly and cheaply. It also means
the test needs no `GEMINI_API_KEY`, no Tesseract, and no backend process
running at all, so it's fast and fully deterministic.

## Both Vitest and Playwright needed non-default process/pool settings

Vitest's default "forks" pool (spawns child OS processes to isolate test
files) hung indefinitely on worker startup in this sandboxed dev
environment — fixed with `pool: "threads"` in `vitest.config.mts`
(worker threads instead of child processes). Separately, Playwright's
`webServer` auto-spawn of `npm run dev` timed out the same way, even
though running `npm run dev` directly worked fine in under 2 seconds —
same underlying class of issue (this specific sandbox restricting some
child-process-spawning paths), unrelated to Vitest's. The `webServer`
config block was kept as-is (it's the correct setup for a normal
machine, and `reuseExistingServer: true` already provides a working
fallback — start the dev server yourself first, and Playwright reuses
it) rather than removed, since removing it would only trade convenience
on a normal machine for no benefit here.

## Two real bugs found and fixed while writing tests, not just reported

1. **`ProcessingStages`'s error-state logic was dead and wrong.** Writing
   a test for the "analysis failed after upload succeeded" case revealed
   two problems at once: `analyze/page.tsx` never actually rendered
   `ProcessingStages` when `stage === "error"` (so the branch was
   unreachable), and even if it had, the logic didn't know *which* phase
   had failed — it unconditionally showed upload steps as "active" and
   analyze steps as "pending" regardless of whether analysis is what
   actually failed. Fixed by having `useAnalyzeFlow` track `failedPhase`
   (captured from a ref right before the failing call), adding a real
   "failed" step status (distinct from "pending"/"active"/"done"), and
   wiring the page to render `ProcessingStages` during errors too. Now a
   user who gets this far sees exactly how far the pipeline got.
2. **`DocumentRepository.delete()` was dead code.** No API endpoint or
   service method ever called it — nothing in the app exposes document
   deletion. Removed rather than given a test, per "if you're certain
   something is unused, delete it" — a test would have just documented
   that dead code works, not that it's needed.

## jsdom-specific test gotchas worth remembering

- `navigator.clipboard` is a getter-only stub in jsdom 30 — mocking it
  needs `Object.defineProperty(navigator, "clipboard", {...})`, not
  `Object.assign`.
- A `setTimeout` callback that triggers a React state update (like the
  copy-button's "revert after 2s" behavior) needs its timer advancement
  wrapped in `act()` explicitly when using fake timers — Testing
  Library's automatic `act()` wrapping only covers user-event/fireEvent
  calls, not code that runs later on its own.
- `userEvent.upload()` respects the file input's `accept` attribute, the
  same way a real OS file picker would — a wrong-file-type test needs to
  go through a `drop` event instead, since drag-and-drop bypasses `accept`
  entirely (both in real browsers and in this test).
- Base UI's `Button` composed with `render={<Link/>}` reports
  `role="button"`, not the browser-default `role="link"` an `<a href>`
  normally gets — matches its visual/keyboard button semantics
  intentionally, not a bug. Query it in tests accordingly.

## Document.created_at/updated_at also moved to a client-side default

The same bug fixed for `Analysis.created_at` in Phase 6 (SQLite's
`CURRENT_TIMESTAMP` server_default only has second resolution) turned out
to affect `Document` too — found by seeding several documents in quick
succession for History-page testing and noticing the display order
didn't match creation order at all. Applied the identical fix
(`default=lambda: datetime.now(UTC)` instead of `server_default`) to both
`created_at` and `updated_at`. Worth remembering as a pattern: any
`server_default=func.now()` on SQLite is a latent ordering bug waiting
for two writes in the same second — which batch seeding, tests, or a
user uploading several files quickly can all trigger.

## History joins documents + analyses client-side, not via a new endpoint

Unlike the results page (which got a dedicated `GET /documents/{id}/
analysis` endpoint in Phase 6), History reuses the existing `GET
/documents` and `GET /analyses` list endpoints as-is and joins them in
the browser (`useHistory`, mapping `analysis.document_id` to
`overall_score`, first-seen-wins since the list is already newest-first).
No backend change needed here, unlike the results page — the two lists
were already exactly the data required, just not yet combined, and
document-centric semantics (show every upload, analyzed or not) are
naturally what falling back to the documents list gives for free. Fetches
`limit=200` (the backend's max) rather than paginating — the spec
explicitly says "pagination only if necessary," and that's well past
what an assessment-scale history needs.

## "Common weaknesses" categorization is a documented heuristic

The AI returns free-form weakness text, not a category — there was never
a structured field to read a "Weak CTA" label from. Rather than leave a
real, useful signal out entirely, `InsightsService.categorize_weakness`
keyword-matches each weakness string against five categories tied to the
app's own score dimensions (hook, clarity→"unclear messaging",
engagement, CTA, readability). A weakness can match zero, one, or several
categories; unmatched weaknesses simply don't count toward any bucket
rather than being forced into a misleading catch-all. This is the same
category of choice as the CTA-phrase detection already in
`ScoringService` — a transparent, deterministic heuristic over real data,
not something presented as more precise than it is. Both the API
response's framing and the Insights page's caption say "grouped by
keyword," not "AI-categorized."

## "Average improvement" (spec's suggested stat) is not implemented

Spec section 25 lists it alongside average overall/hook/CTA score, but
nothing in the app computes a real value for it — doing so would mean
re-scoring `improved_content` with a second AI call per analysis, which
this phase never asked for and would roughly double Gemini API cost per
analysis for a stat of unclear value. Rather than fabricate a number
(explicitly against this phase's instructions) or invent a strained
reinterpretation of "improvement," it's omitted, with the reasoning
recorded here and in the README rather than silently dropped.

## TanStack Query: `retry: false`, `networkMode: "always"` app-wide

Found via a real, reproducible bug while building the results page:
navigating to a document that doesn't exist rendered a permanently blank
page — no skeleton, no error, nothing — with the query stuck at
`status: "pending"`, `fetchStatus: "paused"` forever. Root cause, traced
into `@tanstack/query-core`'s `retryer.ts`: a scheduled retry only resumes
when `canContinue()` is true, and that check requires
`focusManager.isFocused()` in addition to being online — a retry attempt
scheduled while the tab lacks focus pauses indefinitely waiting for a
`focus` event that may never come. `networkMode: "always"` alone doesn't
fix this (it only bypasses the *online* half of that check). Setting
`retry: false` avoids the retry-scheduling path entirely — a failed
request rejects immediately instead of ever reaching the pausable state.
This app only talks to its own local backend, so automatic retries were
buying little resilience anyway; failing fast and letting the user
explicitly retry (a "Start over" button, a page reload) is more
predictable than a retry that can silently hang. Worth knowing if this
codebase ever adds a genuinely flaky/remote dependency — the fix would
need to be more targeted than a blanket `retry: false` at that point.

## GET /documents/{id}/analysis, not a document_id filter on /analyses

The results page only knows the document id (from the URL) and needs
"the analysis for this document." Rather than extend `GET /analyses` with
a `document_id` query filter (which raises pagination-semantics questions
for a filtered list that's really just fetching one thing), a dedicated
nested endpoint returns the single most-recent `Analysis` for that
document directly — reusing `AnalysisRepository.get_by_document_id`,
already built in Phase 2. 404s with `NOT_FOUND` if the document exists
but hasn't been analyzed yet, distinct from the document itself not
existing (also 404, but the document lookup happens first).

## Analysis.created_at moved from server_default to a Python-side default

A document can be re-analyzed (e.g. for a different platform), so
"the most recent analysis for this document" needed a real ordering
guarantee. SQLite's `CURRENT_TIMESTAMP` (used via `server_default`) only
has second resolution — two analyses created within the same second would
tie, and `ORDER BY created_at DESC LIMIT 1` on a tie is not guaranteed to
return the one that was actually inserted last. Switched `created_at` to
a client-side `default=lambda: datetime.now(UTC)`, which has microsecond
resolution. No migration was needed — Alembic doesn't autogenerate
`server_default` removal by default (`compare_server_default` is off), so
the change is Python/ORM-level only; a fresh `CREATE TABLE` never had a
literal default baked into the DDL beyond what SQLAlchemy already omits.

## Deterministic metrics are persisted on the Analysis row, not recomputed

The `documents`/`analyses` schema originally had no way to return the
deterministic `ContentMetrics` (word count, hashtag count, etc.) that
`ScoringService` already computes internally to blend scores — Phase 4
used them but never exposed them. The results dashboard needs to display
them, and "integrate only with real backend data" ruled out recomputing
them client-side (duplicate logic, risk of drifting from the backend's
actual algorithm). Added a `metrics` JSON column to `analyses`, populated
once at analysis time via `dataclasses.asdict(metrics)` — cheaper than
joining back to the document's `extracted_text` and recomputing on every
read, and metrics are a pure function of text that was already extracted,
so nothing about storing them can go stale.

## Processing stages reflect real request boundaries, not simulated timing

The spec's suggested 7-stage processing UI (Uploading, Validating,
Extracting, OCR, Analyzing, Generating, Complete) doesn't map to 7 real
signals — the backend only exposes two request boundaries (`POST
/documents` does upload+validate+extract+OCR in one call; `POST
/documents/{id}/analyze` does analyze+generate in another). Rather than
fabricate a timed animation pretending to track sub-steps we can't
observe, `ProcessingStages` groups the spec's labels under whichever real
request is in flight — steps 1-4 all show "active" together during the
upload call, 5-6 during the analyze call. Honest about what's actually
known, still delivers the requested step-by-step feel.

## Phase 5's "success" state is a minimal summary, not the dashboard

After a successful analysis, `/analyze` shows overall score, tone/
sentiment, and top strengths — not the full score-breakdown grid, charts,
or original-vs-improved comparison. That's explicitly Phase 6's scope
("Results dashboard" is its own phase in the spec's plan); building it
now would mean redoing it once Phase 6's actual design work happens.
Phase 5's job was proving the upload → extract → analyze flow works
end-to-end against the real API with real error handling, which it does.

## Landing page's dashboard preview is schematic, not fabricated data

The spec asks the landing page to "include a visual preview of the
analysis dashboard." `DashboardPreview` shows dimension labels (Hook,
Clarity, ...) with generic bar-length proportions and a literal `--/100`
placeholder — never a specific fake score like "82/100." The instruction
to not build fake analysis results is about the actual product flow, not
a marketing graphic, but the preview still deliberately avoids anything
that could be mistaken for a real result.

## History/Insights are real routes with an honest empty state, not 404s

The header nav (spec section 20) lists Analyze/History/Insights. Since
those pages' real content is Phase 7, clicking them now shows a clean
"coming soon" state rather than a broken link — the nav is genuinely
complete even though two of the three destinations are placeholders.

## No frontend component calls `fetch` directly

Every backend call goes through `lib/api.ts`, which throws a typed
`ApiError` (carrying the backend's `error_code`) rather than a generic
`Error`. `lib/error-messages.ts` maps every backend error code (from
`app/core/exceptions.py`) to a human-readable string, so a raw
`error_code` or stack trace is never shown to the user — the same
principle as the backend's own exception handling, mirrored on the
client.

## `nativeButton={false}` wherever Button renders as a Link

This project's shadcn setup uses Base UI (`@base-ui/react`), not Radix —
composition uses a `render` prop instead of `asChild`, and Base UI's
`Button` defaults to `nativeButton: true` (it expects the element it
renders as to be a real `<button>`). Every `<Button render={<Link .../>}>`
needs `nativeButton={false}` or Base UI logs an accessibility warning
about the rendered element not actually being a button. Caught via the
browser console during manual verification, not by the type checker.

## Only content_analysis.txt exists; content_improvement.txt is deferred

Spec section 16 names two prompt files. Only `content_analysis.txt` is
wired into any code path — the core analyze flow returns everything in
one structured response, including `improved_content`, matching section
15's example exactly. `content_improvement.txt` would back the *optional*
tone/length regeneration controls from section 17, which that same
section explicitly says "can be implemented after the core analysis
works" and "should not block the basic workflow." Creating an unused
prompt file now would be dead code with nothing to call it — it gets
added when the tone/length feature (and the frontend controls for it) is
actually built.

## `response_schema` set, but the response is still independently validated

`GeminiProvider` passes `AiAnalysisResult` as `config.response_schema`
(google-genai supports structured output directly from a Pydantic model),
which makes a well-formed response far more likely. But the raw text is
still `json.loads`'d and `AiAnalysisResult.model_validate`'d by hand
afterward rather than trusting the SDK's `response.parsed` — an empty
response (e.g. content blocked by a safety filter), a network hiccup
mid-stream, or a future SDK behavior change should never be able to skip
validation and crash the request. Belt and suspenders, not either/or.

## Hybrid scoring: which scores blend, and which don't

Spec section 13 gives the `overall_score` formula (40% deterministic /
60% AI) explicitly but leaves the other five scores unspecified beyond
"the exact formula can be adjusted." The per-score split implemented
(see README section 7 for the table) follows what's actually measurable
deterministically: `readability_score` is 100% deterministic because
section 12 lists "approximate readability" under deterministic metrics
and it is *not* in the AI's evaluation list; `hook_score`/`clarity_score`/
`engagement_score` are 100% AI because there's no honest deterministic
proxy for them (guessing at one would be worse than not pretending to
have one); `cta_score` blends 30/70 because deterministic metrics can
only detect a CTA *phrase's presence*, not whether it's actually
persuasive — that judgment call belongs to the AI. All of this is a
starting point, not a validated model — documented as a known limitation
rather than presented as more rigorous than it is.

## AI's own readability_score is requested but discarded

The prompt still asks for `readability_score` in the JSON response (the
spec's example includes it, and keeping the schema literal makes the
contract easier to reason about), but `ScoringService.blend_scores`
ignores it entirely in favor of the deterministic Flesch-based value —
see "Hybrid scoring" above for why.

## Missing GEMINI_API_KEY fails fast, but only inside `analyze_document`

`GeminiProvider.__init__` raises `AiAnalysisFailedError` immediately if
`api_key` is empty — no point letting a doomed request reach the network.
But `AnalysisService` only constructs `GeminiProvider` lazily, inside
`analyze_document()`, not in `__init__`. `AnalysisService(db)` is also
used for pure reads (`get`, `list` — e.g. `GET /analyses`), and those must
keep working with no `GEMINI_API_KEY` configured at all; failing at
`AnalysisService.__init__` would have broken every read endpoint over a
key those endpoints never needed.

## Analysis failure reverts document status, doesn't introduce a new one

If the AI call fails or its response is invalid, the document's `status`
reverts to `processed` (not a new `analysis_failed` value) and no
`analyses` row is created. Extraction already succeeded — that work
shouldn't be discarded by a separate, retryable failure. `ANALYZING` is
set transiently before the call and either becomes `ANALYZED` on success
or reverts on any exception, so a document can never get stuck at
`ANALYZING` from a single synchronous request.

## Extraction runs synchronously inside the upload request

`POST /api/v1/documents` validates, stores, *and* extracts (native text or
OCR fallback) before responding — there's no separate "process" step or
polling. A single document takes low single-digit seconds even with OCR,
well within a normal request timeout, and this keeps the pipeline
trivially easy to reason about (no task queue, no job status to poll — see
[architecture.md](architecture.md)). The AI-analysis step (Phase 4) is a
separate `POST /documents/{id}/analyze` call, since that's a materially
slower, separately-retryable operation.

## Failed documents are kept, not discarded

If extraction fails (corrupted file, no readable text, OCR engine error),
the `documents` row is *not* deleted — it's updated to `status=failed`
with `error_message` set, and the same error is also returned to the
caller as an HTTP error response. This means a failed upload still shows
up in history (so the user can see *what* they tried and *why* it failed)
while the client still gets an immediate, specific error to display.
Purely invalid uploads (wrong file type, over the size limit) are rejected
*before* a document row is created, since those never got far enough to
be a real attempt worth recording.

## PDF opened from bytes, not by filename

`ExtractionService._extract_pdf` reads the temp file's bytes and calls
`pymupdf.open(stream=..., filetype="pdf")` rather than
`pymupdf.open(path)`. Opening by filename was found (via a failing test)
to keep an OS-level file handle open on Windows even after PyMuPDF raises
on a malformed PDF, which then blocked deleting the temp file in the
`finally` block. Opening from an in-memory buffer sidesteps the OS handle
entirely.

## `is_meaningful_text` heuristic, not a strict content check

The native-vs-OCR fallback decision (and the final "did we get anything
usable" check) both use one small heuristic: strip the text, require at
least 15 non-whitespace characters, and require at least 30% of those to
be alphanumeric. It deliberately does *not* penalize hashtags, emoji, or
punctuation-heavy text — a short, real social post ("Big news today
#launch #excited #team") should pass, while a blank/scanned page or
garbled OCR noise ("... --- ___ ///") should not. It's a heuristic, not a
classifier — documented as a known limitation rather than tuned further,
per the "don't over-engineer" principle.

## No deskewing in OCR preprocessing

Preprocessing covers grayscale, upscaling small images, contrast
enhancement (Otsu binarization via OpenCV), and EXIF auto-rotation.
Deskewing (correcting a rotated/tilted scan) was left out: it's the one
preprocessing step in the spec's suggested list that's genuinely fiddly to
get right without a dedicated library, and the assessment's realistic
inputs (screenshots, phone photos of a screen) are rarely skewed enough to
need it. Noted here as a known gap rather than silently dropped.

## Testing strategy: mock the OCR engine, keep one real-engine test

Every extraction/OCR test monkeypatches `TesseractOCRProvider.extract`
(or injects a fake `OcrService`) so the suite passes in any environment,
regardless of whether the Tesseract binary is installed — this dev
machine didn't have it installed when this phase was built. One test
(`test_ocr_real_engine.py`) exercises the actual binary and is
auto-skipped via `pytest.mark.skipif` when it can't be found, so it comes
alive automatically in an environment (like CI, or after a developer
installs Tesseract locally) that has it.

## UUID string primary keys, not autoincrement integers

`documents.id` and `analyses.id` are UUID4 strings generated in Python
(`default=lambda: str(uuid.uuid4())`), not database-assigned integers.
IDs are handed straight to the frontend as opaque strings and never need
to leak "how many documents exist" the way a sequential integer would.
It also means a document's ID is known immediately after construction,
before the INSERT — convenient for computing its temp-file path.

## Temp file path is derived, not stored

The `documents` table intentionally has no `file_path` column (matching
the spec's schema exactly). `DocumentService.temp_path_for()` derives the
path deterministically as `temp/{document.id}{extension}`, with the
extension read back off `document.filename`. One less place for a stored
path to go stale or point at a file that was already cleaned up.

## Status enum values

`DocumentStatus` covers `uploaded → processing → processed → analyzing →
analyzed`, plus `failed`. This is slightly more granular than the spec's
schema strictly requires, but each value maps to a real pipeline stage
that a later phase (extraction, then analysis) needs to set — adding it
now avoids a schema migration per phase. `extraction_method` is a separate
nullable enum (`native` / `ocr`) rather than folded into status, since a
document can be `processed` via either path and the frontend needs to
show which one was used.

## Repositories return ORM objects, not schemas

`DocumentRepository`/`AnalysisRepository` return SQLAlchemy model
instances; converting to a Pydantic response schema happens once, at the
API boundary (`DocumentResponse.model_validate(document)`), not inside
the repository. Keeps the repository layer a thin, reusable data-access
layer that services can also consume without paying for a schema
round-trip they don't need.

## Alembic reads DATABASE_URL from app settings, not alembic.ini

`alembic/env.py` calls `get_settings().database_url` instead of using the
static `sqlalchemy.url` in `alembic.ini`. One source of truth for the
connection string — changing `DATABASE_URL` in `.env` is enough; nothing
in `alembic.ini` needs to be kept in sync by hand.

## Python 3.14 for the backend

Only Python 3.14 was available in the dev environment. Verified before
scaffolding that every planned dependency (FastAPI, SQLAlchemy, PyMuPDF,
Pillow, opencv-python-headless, pytesseract, google-genai, Alembic, Ruff,
Black, pytest) publishes prebuilt wheels for `cp314-win_amd64`, so no
compiler toolchain is required to install them. If deploying to a host
that only offers Python 3.11/3.12, the same requirements.txt is expected to
work unchanged since nothing pins to 3.14-only syntax.

## Modular monolith, no task queue

Extraction, OCR, and LLM analysis all run synchronously within the request
that triggers them. A single document takes low single-digit seconds to
process, well within a normal HTTP timeout. Introducing Celery/RabbitMQ/
Redis for this workload would add operational surface area without solving
a real latency or throughput problem — see [architecture.md](architecture.md).

## SQLite now, Postgres-compatible later

Models avoid SQLite-specific types and rely on SQLAlchemy's dialect-neutral
column types. `DATABASE_URL` is the only thing that changes to move to
Postgres; no query rewrites anticipated. Alembic migrations are written
against the ORM models, not raw SQLite DDL, for the same reason.

## Provider abstractions for OCR and LLM

`app/providers/ocr/base.py` and `app/providers/llm/base.py` define small
interfaces (`extract(image) -> OcrResult`, `analyze(text) -> AnalysisResult`)
with exactly one concrete implementation each (Tesseract, Gemini). This
keeps the future swap points (cloud OCR, another LLM vendor) as a single new
file + a config flag, without building unused providers today.

## Temp files over object storage

Uploaded files are written to `backend/temp/`, processed, and deleted
immediately after extraction succeeds (or fails). Nothing about this
project needs durable storage of the original binary — the extracted text
and analysis are what get persisted.
