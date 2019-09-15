# Static Site generator with PUG

This is probably the most simple static site generator ever. It just uses the awesome PUG library.

You can write your pages in the nice short PUG syntax. And they will simply be rendered as HTML.

PUG is far more powerfull than most people know. I've built my complete blog site with it.

# Dev workflow

 1. Run backend and monitor files for changes.  `npm run mon`
 2. Serve frontend and automatically reload browser on change `npm run front`


# Production build

  npm run build

Then the generated HTML files will be generated in the `site` directory.