# Static Site generator with PUG

This is probably the most simple static site generator ever. It just uses the awesome PUG library. 

You can write your pages in the nice short PUG syntax. And they will simply be rendered as HTML. PUG is far more powerfull than most people know. I've built my complete blog site with it.

I am using this script for my private blog on [www.doogie.de](www.doogie.de)

# Technical developer details

All the magic is in the `buildSite.js` script. The script extracts metainformation about the blog posts such as title, data, tags and excerpt from the first code block in the pug file. This has the advantage that the metadata of each post is available inside the pug template itself. Then this metainformation from every blog post is collected and used to build the index page. The index page shows a list of the most recent blog posts. The layout is adapted from the awesome [Brevifolia Theme](https://github.com/kendallstrautman/brevifolia-gatsby-forestry)

Keep in mind that the buildSite.js Script is a pure backend script executed on the server. It just happends to be written in nodeJS. This script has nothing to do with client side javascript that would run inside the user's browser. buildSite.js simply converts the pug files into static HTML pages.

# Dev workflow

 1. Run backend and monitor files for changes.  `npm run supervisor`
 2. Serve frontend and automatically reload browser on change `npm run front`

# Production build

  npm run build

Then the generated HTML files will be generated in the `site` directory.

# Developing with parcelJS

[Parcel](https://parceljs.org/getting_started.html) is a web application bundler, differentiated by its developer experience. It offers blazing fast performance utilizing multicore processing, and requires zero configuration.

You can also develop doogie.de with parcel:
 * `npm run parcel-serve`
 * `npm run parcel-build`

However this does not yet work completely: 

ParcelJS does not automatically build or update the pug locals in `site/pug.config.js`. You have to manually update that file with `node buildsite.js`. You only need to update the pug locals when you change the metadata of a pug blog post or when you add/remove a blog post completely.

And ParcelJS does not automatically create the taxonomy pages in `/dist/tags/*.html`. These must also manually be created with the buildSite.js script.


# Defending arguments

No there is no webpack here. And no UglfyAnything plugin. There is no use in optimizing 100 bytes of CSS into 97.334 bytes, if you load 100KB images at the same time. And a good site just has one simple CSS file.
