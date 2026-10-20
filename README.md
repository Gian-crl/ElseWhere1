# ElseWhere — project guide and code notes

ElseWhere is a responsive student travelogue website for discovering destinations in the Philippines and around the world. Open `index.html` from this folder to start the site locally, or publish the folder using the host instructions below.

## Main folders and what they are for

- `index.html` — entry file that forwards visitors to the main page at `HTML/index.html`.
- `HTML/index.html` — main landing page. The section comments in this file identify the home hero, local and international destinations, gallery, feedback, travel guide, about section, FAQs, contact section, team cards, footer, and search dialog.
- `HTML/*.html` — destination detail pages plus the Privacy Policy and Terms of Service pages. Destination-page comments explain each common block.
- `CSS/style.css` — main-page layout, typography, cards, responsive rules, shared theme variables, dark mode, music controls, and team section styling.
- `CSS/destinations.css` — layout and styling used on destination detail and legal pages.
- `CSS/device-viewer.css` and `JavaScript/device-viewer.js` — responsive desktop/tablet/phone preview control.
- `JavaScript/site-features.js` — shared browser features: remembered light/dark mode, background music and volume UI, the Ask ElseWhere assistant, and feedback-related features.
- `JavaScript/destinations.js` — destination-page behavior.
- `JavaScript/gallery.js` — gallery interactions.
- `JavaScript/site-config.js` — optional public site settings. Do not put private API keys here.
- `netlify/functions/chat.js` — optional server-side chat endpoint for a Netlify deployment.
- `supabase-feedback.sql` — optional database setup for shared visitor feedback.
- `image3/` — logos, destination photos, page backgrounds, and the travel preview video.
- `music/background-music.mp3` — original looping ambient music included with this revision.

## Header controls

- **Navigation links** move to the same page sections; Feedback intentionally has the same simple style as Home, Destinations, Travel Guide, Gallery, About Us, and Our Team.
- **Search** opens a dialog for finding destinations.
- **Theme icon** switches between light and dark mode and stores the chosen preference in the visitor's browser.
- **Music note icon** opens and closes a small panel. The panel contains the actual mute/unmute control and the volume slider.
- **Ask ElseWhere** opens the website travel assistant.

## Music autoplay notes

The included track is an original, generated ambient loop made for this project. The player attempts audible autoplay. Because browsers may block sound that starts without a visitor gesture, the script retries in muted mode and automatically attempts to enable sound on the visitor's first interaction elsewhere on the page. Opening the music panel does not toggle mute by itself; mute/unmute and volume are controlled inside the panel. A browser's autoplay policy cannot be bypassed by website code, so audible autoplay may still wait for the first interaction in some browsers.

## Meet the Team

The team section is intentionally larger and redesigned with a wider layout, clearer role labels, decorative accents, and a short explanation of each responsibility. The five member names remain placeholders for the project team to replace. The roles are:

1. Project Leader
2. Asst. Leader/Programmer
3. Web Designer/Researcher
4. Content Manager/Researcher
5. Document Officer/Researcher

## Feedback and deployment notes

The feedback form can run locally for demonstration. To make reviews shared across visitors, create a Supabase project, run `supabase-feedback.sql` in its SQL Editor, and set `supabaseUrl` and the public anon/publishable key in `JavaScript/site-config.js`. Never use a Supabase service-role key in browser code.

The Ask ElseWhere assistant includes a local website knowledge base. For server-backed AI responses, deploy to Netlify and set `OPENAI_API_KEY` in the site's environment variables. Do not place this private key in client-side JavaScript.

GitHub Pages can host the static website and local browser features, but it cannot execute the Netlify function. Some external images need an internet connection. The contact form is a demonstration and should be connected to a backend or form service before collecting real messages.

## Home travel video

The home page uses `image3/travel-preview.mp4` as a muted, looping, autoplaying video. Replace it with another MP4 under the same name if you want to change the visual preview.
