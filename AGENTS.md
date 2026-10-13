# Agent instructions: irfanalimd/sites

A static GitHub Pages site at https://sites.irfanali.me/ (repo `irfanalimd/sites`). There's no build step: every `.html` under `p/` shows up on the homepage automatically.

- Pages live in `p/learning/`, `p/research/`, `p/random/`, and `p/til/`. To publish a standalone page, follow [llms.txt](llms.txt).
- Don't edit `index.html`, `404.html`, `llms.txt`, `CNAME` (the custom domain), or other people's pages unless the user asks.
- Files whose names start with `_` (e.g. `p/til/_template.html`) are helpers. The homepage ignores them.

## TIL (Today I Learned)

This is a running log with **one HTML page per week**. Weeks start on **Monday**.

- The week's file is `p/til/<YYYY-MM-DD>.html`, named after **that week's Monday**. Example: anything from Mon 12 Oct to Sun 18 Oct 2026 goes in `p/til/2026-10-12.html`.
- Inside a week page there's one `<section class="day">` per day, **oldest first**. Inside a day there's one `<article class="entry">` per thing learned.
- "Today" means the user's local date in **America/New_York**, unless the user names a different date.

### "Add this to today's learnings"

1. Work out today's date `D` and this week's Monday `M`, both as `YYYY-MM-DD`.
2. **If `p/til/M.html` doesn't exist** (the first entry of a new week), copy `p/til/_template.html` to it, then:
   - delete the `<!-- TEMPLATE … -->` comment line
   - replace the placeholders, using week 42 of 2026 as an example:
     - `{{D MMM YYYY}}` becomes `12 Oct 2026`
     - `{{D MMMM YYYY}}` becomes `12 October 2026`
     - `{{WW}}` becomes the ISO week number, e.g. `42`
     - `{{YYYY}}` becomes the year
   - check that no `{{` is left in the file
3. **If there's no section for day `D` yet**, insert one just above `<!-- TIL:NEW-DAYS-ABOVE -->`:

   ```html
     <section class="day" id="D">
       <h2>Weekday<span class="mono">D Mon</span></h2>

       <!-- entry goes here -->

       <!-- TIL:END-DAY D (add more entries for this day just above this line) -->
     </section>
   ```

   For example: `id="2026-10-13"`, `<h2>Tuesday<span class="mono">13 Oct</span></h2>`.
4. **Add the entry** just above that day's `<!-- TIL:END-DAY D … -->` line. Entries on the same day are separated by a divider automatically.

   ```html
       <article class="entry">
         <h3>Short title</h3>
         <p class="lede">Optional one-line summary.</p>

         <h4>Optional group heading</h4>
         <dl>
           <dt>Term</dt>
           <dd>Definition.</dd>
         </dl>
         <!-- or <p>, <ul>/<ol>, <code> as fits the content -->
       </article>
   ```

   - Keep the user's wording and meaning. You may fix obvious typos and organise the text: term/definition lists for glossary-style notes, lists for steps, a short `lede`, and `<h4>` group headings when there are several clusters.
   - Use plain HTML only, with no new CSS or scripts. The template's styles cover `h3`, `h4`, `p`, `ul`, `ol`, `dl`, `code` and `em`.
   - Escape `<`, `>`, and `&` inside text.
5. Never change other days or other weeks unless the user asks.
6. Commit with the message `publish: til/M <short topic>` (e.g. `publish: til/2026-10-12 vpn and tailscale`) and push to `main`. The site updates in about a minute at `https://sites.irfanali.me/p/til/M.html#D`.

### Without a clone (GitHub connector or API)

Read `p/til/M.html` and keep its `sha`. Make the same edits as above, then write the whole file back with that `sha` (`PUT /repos/irfanalimd/sites/contents/p/til/M.html`). For a new week, read `p/til/_template.html` first and create the file without a `sha`.
