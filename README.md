# The Moongate Vault — public site

The public face of the Moongate Vault, a community library of Ultima Online
client assets. Live at **https://nerdygamers.github.io/moongate-vault/**

## What it is

A static site. It reads `catalog.json` and renders:

- the ten category gates (Animations, Item Art, Gumps, Maps, Sounds & Music,
  Fonts, Hues, Paperdoll, Multis, Textures)
- a searchable, sortable asset grid with thumbnail previews
- an asset detail view with artist credit, file details, and the download
  button — downloads link out to the file on the artist's own host (GitHub,
  Google Drive, Terabox, …). Nothing is re-hosted here.
- the Chronicle, the Vault's blog

The look mirrors the private Vault space: dark Britannia — near-black stone,
parchment text, gold rule lines, Cinzel display type.

## How it stays in sync

The Vault itself is a private space with the admin backend, user accounts,
and the blog editor. It does **not** update this site live. To publish:

1. In the Vault's Keeper's Bench, run the catalog export.
2. Replace `catalog.json` in this repo with the exported document.
3. Push. GitHub Pages rebuilds the site from the new catalog.

Asset and post field names in `catalog.json` follow the Vault's own records.
On the first real sync, reconcile the field names if the export adds any —
the renderer in `app.js` is the place to adjust.

## Files

- `index.html` — page shell
- `styles.css` — the dark Britannia theme
- `app.js` — renders `catalog.json`: gates, search, sort, detail view, Chronicle
- `catalog.json` — the exported catalog (categories, assets, posts)
- `.nojekyll` — serve the files as-is on Pages

## Notes

- Download counts shown here come from `catalog.json`. The public site does
  not count clicks itself — counts update when a fresh export lands.
- There are no logins on the public site. Accounts, submissions, and the
  review queue live in the private Vault space only.
- Assets belong to their original artists. If a credit is wrong or a work
  should come down, the Keeper handles it in the Vault.
- Ultima Online is a trademark of Electronic Arts Inc. This is a fan
  community project, not affiliated with Electronic Arts or Broadsword.
