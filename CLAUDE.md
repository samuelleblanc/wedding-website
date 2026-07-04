# CLAUDE.md — Samuel & Lindsay Wedding Website

## Project overview

Hugo wedding website for **Samuel LeBlanc & Lindsay Croker**, marrying **September 19, 2026** at **Roaring Camp Railroads, Felton, California** (~150–200 guests). Hosted on Netlify. Mostly static, fast-loading, with a serverless RSVP backend.

## Development

```bash
# Requires Hugo Extended >= 0.163.3
hugo server          # local dev at http://localhost:1313
hugo --minify        # production build → public/
```

Hugo was installed via winget: `winget install Hugo.Hugo.Extended`

> **Note:** Hugo is not on the git bash PATH. Use PowerShell to run Hugo commands from a bash session:
> ```bash
> powershell.exe -Command "& { \$env:PATH += ';C:\Users\sleblan2\AppData\Local\Microsoft\WinGet\Packages\Hugo.Hugo.Extended_Microsoft.Winget.Source_8wekyb3d8bbwe'; hugo --minify 2>&1 }"
> ```

## Design system

**Palette**
| Token | Hex | Use |
|---|---|---|
| `--clr-bg` | `#F7F0E6` | Page background (warm linen) |
| `--clr-bg-dark` | `#1A0D08` | Hero, footer |
| `--clr-bg-forest` | `#1E3A30` | Venue section |
| `--clr-heading` | `#7B3F2A` | Redwood brown headings |
| `--clr-orange` | `#C9622F` | Primary accent (burnt orange) |
| `--clr-blue` | `#7EC8D8` | Secondary accent (light blue) |

**Fonts** (Google Fonts)
- `Great Vibes` — script, names & romantic flourishes
- `Cormorant Garamond` — elegant serif headings
- `Raleway` — body & navigation

All CSS is hand-written in `static/css/main.css` — no CSS framework.

## File structure

```
wedding-website/
├── hugo.toml                        # site config + params (incl. rsvpEnabled)
├── netlify.toml                     # build command, functions dir
├── package.json                     # googleapis dep for Netlify Functions
├── content/
│   ├── _index.md                    # homepage front matter + story paragraphs
│   └── rsvp/_index.md               # RSVP page front matter
├── layouts/
│   ├── index.html                   # homepage — calls all section partials
│   ├── _default/baseof.html         # HTML shell
│   ├── rsvp/list.html               # RSVP page (checks rsvpEnabled)
│   └── partials/
│       ├── head.html / header.html / footer.html
│       └── sections/
│           ├── hero.html            # full-viewport, SVG redwood trees, countdown
│           ├── story.html           # two-column text + photo
│           ├── details.html         # ceremony & reception cards
│           ├── venue.html           # Roaring Camp info + embedded map
│           ├── schedule.html        # vertical timeline
│           ├── travel.html          # accommodation & directions cards
│           └── registry.html        # placeholder cards (dark bg)
├── static/
│   ├── css/main.css
│   ├── js/main.js                   # scroll nav, countdown, fade-in, smooth scroll
│   └── js/rsvp.js                   # email lookup + dynamic form + submission
└── netlify/functions/
    ├── validate-guest.js            # GET ?email= → looks up guest_list tab
    └── submit-rsvp.js              # POST → appends row to rsvps tab
```

## Key config knobs (`hugo.toml`)

| Param | Default | Purpose |
|---|---|---|
| `rsvpEnabled` | `false` | Flip to `true` when invitations go out — shows RSVP form instead of "coming soon" banner |
| `mealOptions` | `["Chicken","Fish","Vegetarian","Vegan"]` | Drives meal select dropdowns |
| `contactEmail` | placeholder | Shown in error messages on RSVP page |
| `baseURL` | `https://samandlindsay.com/` | Update once domain is purchased |

## RSVP system

### Architecture
1. Guest enters email → JS calls `/.netlify/functions/validate-guest`
2. Function looks up email in `guest_list` tab of Google Sheet
3. Returns `{ name, plus_one_allowed, children_allowed }` — form renders conditionally
4. Guest submits → JS calls `/.netlify/functions/submit-rsvp`
5. Function re-validates email, appends row to `rsvps` tab

### Google Sheet schema

**Tab: `guest_list`** (you populate before invitations go out)
| A: email | B: name | C: plus_one_allowed | D: children_allowed |
|---|---|---|---|
| guest@email.com | Sarah Smith | TRUE | FALSE |

**Tab: `rsvps`** (written automatically by submit-rsvp function)
Columns: timestamp | email | guest_name | attending | meal | plus_one_name | plus_one_meal | children_count | children_meal | dietary_restrictions | song_request | message | updated_at

### RSVP fields collected
- Attending yes/no
- Primary meal preference
- Plus-one name + meal (only if `plus_one_allowed = TRUE` in sheet)
- Children count + children meal (only if `children_allowed = TRUE` in sheet)
- Dietary restrictions
- Song request
- Message to the couple

### Setting up Google Sheets integration

1. Go to [Google Cloud Console](https://console.cloud.google.com) → create a project
2. Enable the **Google Sheets API**
3. Create a **Service Account** → download JSON key
4. Share your Google Sheet with the service account's email (Editor role)
5. In Netlify dashboard → Site configuration → Environment variables, add:
   - `GOOGLE_SERVICE_ACCOUNT_KEY` = the full JSON key contents (as a string)
   - `GOOGLE_SPREADSHEET_ID` = the ID from your sheet's URL (`/spreadsheets/d/<ID>/`)

### Enabling RSVP

Once invitations are sent and the Google Sheet is configured:
```toml
# hugo.toml
[params]
  rsvpEnabled = true
```
Commit and push — Netlify redeploys automatically.

## Deployment (Netlify)

1. Push this repo to GitHub
2. Connect repo in Netlify dashboard → it reads `netlify.toml` automatically
3. Set the two environment variables above
4. Set a custom domain once purchased (update `baseURL` in `hugo.toml` to match)

Build command: `hugo --minify` | Publish dir: `public` | Functions dir: `netlify/functions`

## Commit style

No Co-Authored-By lines in commit messages.

## What's still TODO

- [ ] Add couple photo to `static/images/couple.jpg` (displays in Our Story section)
- [ ] Update `baseURL` in `hugo.toml` once domain is purchased
- [ ] Populate `guest_list` Google Sheet with guest emails before enabling RSVP
- [ ] Set Netlify environment variables for Google Sheets
- [ ] Update registry section with actual registry links
- [ ] Update hotel room block link in Travel section once arranged
- [ ] Update contact email in `hugo.toml`
- [ ] Consider adding a password/coming-soon page before the site is publicly announced
