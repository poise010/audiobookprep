# Hosting and Squarespace handoff

## Recommended source workflow

Edit the `website/` directory in VS Code, commit to GitHub, and run `npm run build`. The build produces standalone static files plus Squarespace snippets. No React build, backend or API key is required for this marketing site.

## Option A: host the standalone website

Deploy `website/dist/` on a static host using a GitHub integration. This gives the closest match to the tested design, including `/studio/`. GitHub holds the source; the host serves the site. The eventual AI backend can be hosted separately while the application remains on the same user-facing domain.

Do not point the live domain at a new host until the staged site has been reviewed. No deployment or DNS changes are part of this deliverable.

## Option B: embed in Squarespace 7.1

Squarespace does not import an arbitrary GitHub repository as a site. Its documented custom-code route uses HTML code blocks, CSS and code injection. JavaScript/code injection requires an eligible plan. The Developer Platform is a different feature limited to version 7.0.

1. Run `npm run build` and open `dist/squarespace/`.
2. Create an unpublished blank Squarespace page. Place `page-body.html` in one HTML code block with source-display mode disabled.
3. Host `dist/assets/embed.css`, `manrope-variable.ttf`, `mark.svg` and `sample-guide.txt` together on a static asset host. Alternatively, use Squarespace file hosting if it accepts each file type. The snippets assume `/s/` paths; replace those with the actual generated URLs. Do not assume uploaded files retain their filenames.
4. Update the font URL inside `embed.css` if the font and stylesheet are not in the same folder. Keep its license with the source. Cross-origin font hosting needs the appropriate CORS header.
5. Place `header-injection.html` in page header code injection after updating its asset URLs. You may instead place the contents of `embed.css` in Custom CSS, with an absolute font URL.
6. Add `footer-injection.html` once in Footer Code Injection. It is a self-contained module and checks for `.abp-site` before initializing. Avoid also loading `site.js`; that would attach handlers twice.
7. Create a second page with the URL slug `/studio` and use `studio-body.html`. Apply the same CSS. This is the future software destination.
8. The snippets assume the homepage is at `/`. For a staging slug, replace home and hash links with that page's actual path before testing; switch them back at launch.
9. The design includes its own header and footer. Configure the Squarespace page/template so it does not show duplicate navigation, and give the code block full available width. Template-specific wrapper padding may need adjustment. Do not apply broad global CSS that hides other pages' headers.
10. Test in a logged-out/private window at desktop and mobile sizes. Check plan dialogs, all guide sections, yearly totals, downloads, menu links, keyboard focus and the `/studio` page. Squarespace can suppress scripts inside its editor, and template styles may require local adjustments.

The standalone stylesheet is scoped to `.abp-site` except document-level resets. `embed.css` removes those resets so the website's CSS does not restyle the rest of Squarespace. Existing Squarespace theme rules may still affect descendants and must be checked on the actual template.

## Future application on the website

`/studio/` is reserved now. A static host with path routing can serve the future application there. Squarespace cannot run the AI server. Keeping Squarespace as the main host may require a separately hosted embedded application or moving the frontend to hosting that supports `/studio/` routing. A subdomain is another option but is not the only design. The future architecture is described in `FUTURE-STUDIO.md`.

## Sources checked September 18, 2026

- [Squarespace: Add custom code](https://support.squarespace.com/hc/en-us/articles/205815928-Add-custom-code-to-your-site)
- [Squarespace: Code injection](https://support.squarespace.com/hc/en-us/articles/205815908-Customize-parts-of-your-site-with-code-injection)
- [Squarespace: Developer tools](https://support.squarespace.com/hc/en-us/articles/205815758-Developer-Tools)

These snippets have been checked locally. Installation inside the live Squarespace template has not been performed.
