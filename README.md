# Mass Timber Finance & Consumer — website

The website of the Mass Timber Finance & Consumer (MTFC) working group, served by GitHub Pages.
GitHub rebuilds the site automatically a minute or so after any change is saved to the `main` branch.

## Where things are

| To change… | Edit… |
|---|---|
| Home page text | `index.html` |
| Any other page | the file with the page's name in `pages/` |
| Scenario and force text on the Industry Structure page | `assets/js/icf-data.js` |
| The rotating tagline on the home page | `assets/js/site.js` |
| The menu | `_includes/nav.html` |
| The footer | `_includes/footer.html` |
| Contact email (used everywhere) and site name | `_config.yml` |
| Colours, spacing, fonts | `assets/css/site.css` |
| Images and PDFs | `assets/img/`, `assets/files/` |

## Making a copy edit in the browser

1. Open the file on github.com and click the pencil icon.
2. Change the words between the tags. Leave anything inside `< >` and the block between the two `---` lines at the top alone unless you mean to change it.
3. Click **Commit changes**. The live site updates in about a minute.

Each page begins with a short block that sets its browser title, its description for search engines and its address:

    ---
    permalink: "/capital-creation"
    title: "Capital Creation"
    description: "…"
    ---

Do not change `permalink` unless the page's address should change.

## Adding a page

Copy an existing file in `pages/`, give it a new name and a new `permalink`, and link to it from the home page.

## Launch settings

The site is live at `www.masstimberfinanceconsumer.org` (launched Nov 23, 2026): `_config.yml` has `baseurl: ""` and the `CNAME` file names the domain. DNS is managed at Squarespace (`www` CNAME to `noelallenjohnson.github.io`; apex A records to GitHub Pages).

## Ownership

See `LICENSE.md` and `RIGHTS.md`.

## Editing page copy directly

The Firm Financial Fitness page takes all of its words from one plain-text file, `_data/firm_financial_fitness.yml`. Edit that file on GitHub (pencil icon), commit, and the site rebuilds in about a minute. The editing rules are at the top of the file. If a commit breaks the file's structure, the build fails and the live site simply stays on the previous version until the file is fixed.
