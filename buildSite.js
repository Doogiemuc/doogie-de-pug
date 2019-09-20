/**
 * The most simple static site generator ever.
 * Only using PUG and JSON
 */
const pug = require('pug')
const fs = require('fs')
const path = require('path')
const JSON5 = require('json5')  // json for humans! :-)
const { once } = require('events');
const readline = require('readline')
const ncp = require('ncp').ncp;			// for recursive copying of files
ncp.limit = 16;

/*
  Default values for pathes.
  These are used 
    as input path under `site`
    as output path under `dist` and
    as HTTP URL under baseUrl
*/
const dir = {
	site:          'site',
	dist:          'dist',
	blogPosts:     'blog-posts',
	includes:      'includes',
	pages:         'pages',
	static:        'static',
	baseUrl:       '/',
	indexFile:     'index.pug',
}
const site = {
	blogPosts: path.join(dir.site, dir.blogPosts),
	includes:  path.join(dir.site, dir.includes),
	pages:     path.join(dir.site, dir.pages),
	static:    path.join(dir.site, dir.static),
}
const dist = {
	blogPosts: path.join(dir.dist, dir.blogPosts),
	includes:  path.join(dir.dist, dir.includes),
	pages:     path.join(dir.dist, dir.pages),
	static:    path.join(dir.dist, dir.static),
}


/*
  1. read JSON5 metadata of all blog posts
  2. sort by date
  3. create excerpts of the first n posts (from pug source!)
  4. render index.html with blog list and first n excerpts
  5. render all posts (one HTML per post)
  6. render all static pages
 */

/**
 * Parse metadata from the first code block at the top of pugGile
 * @param {String} pugFile path to a .pug file
 * @returns (A Promise that resolves to) the parsed JSON
 */
async function parseMetadataFromPug(pugFile) {
	return new Promise(function(resolve, reject) {
		try {
			// https://nodejs.org/api/readline.html
			let lineReader  = readline.createInterface({
				input: fs.createReadStream(pugFile),
				crlfDelay: Infinity
			})	
			let inCodeBlock = false
			let jsonString  = ""
			lineReader.on('line', function (line) {
				if (!inCodeBlock && line.startsWith('-')) {
					inCodeBlock = true
				} else
				if (inCodeBlock && line.startsWith("\t")) {
					jsonString += line
				} else 
				if (inCodeBlock /* and line does not start with tab */) {
					inCodeBlock = false
					lineReader.close()
					let metadata = JSON5.parse(jsonString.match(/{.*}/))
					resolve(metadata)
				}
			})
		} catch (err) {
			reject("ERROR parseMetadataFromPug(pugFile="+pugFile+"):"+ err)
		}
	})
}

/**
 * Parse metadata from first code block of pug files.
 * For example from blog posts. Recursively traverses directory
 * @param {String} sourceDir relative path under dir.site to dir with .pug files
 * @param {Array} list of metadata objects from top of pug files
 */
function parseMetadata(sourceDir, urlPath) {
	console.log("Parse metadata from pug files in "+sourceDir)
	let tasks = fs.readdirSync(sourceDir)
		.filter(filename => filename.endsWith('.pug'))
		.map(filename => {
			let pugFile = path.resolve(sourceDir, filename)
			return parseMetadataFromPug(pugFile).then(metadata => {
				metadata.filename = pugFile   // PUG: the "filename" option is required to use includes and extends with "relative" paths
				metadata.basedir  = dir.site  // PUG: the "basedir" option is required to use includes and extends with "absolute" paths
				metadata.url      = getUrl(urlPath, filename)
				return metadata
			})
		})
	return Promise.all(tasks).then(results => {
		return Array.prototype.concat(results)
	})
}

 /* This is currently not used
 // Open in_path/filename.json and parse its content als JSON5
 function parseMetadataFromJson(in_path, filename) {
	let jsonPath    = path.resolve(in_path, filename+'.json')
	let jsonString  = fs.readFileSync(jsonPath)
	let json        = JSON5.parse(jsonString)
	return json	
}
*/

/** 
  Render pug file to HTML (json "options" is available in the pug template)
  If options is an object, it will be available in the pug template
  Otherwise, if the pug template starts with a code block, then the first JSON inside that code block will be parsed as pug options
  @param {String} in_path path to pug file
  @param {String} filename filename of pug file
  @param {String} outpath relative path under `dir.dist` where the rendered HTML file be stored
  @param {Object} options (optional) data that can be used in the pug template
  @return {Object} the extracted metadata from the pug file, merged with filename, basedir and out_path
*/
function renderPage(in_path, filename, urlPath, options) {
	if (filename.endsWith('.pug')) filename = filename.slice(0,-4)
	console.log("   ", path.join(in_path, filename+'.pug'), " => ", getUrl(urlPath, filename+'.html'))

	let pugFile       = path.resolve(in_path, filename+'.pug')			// filename with absolut path
	let outFile       = path.resolve(dir.dist, urlPath, filename+'.html')	
	let metadata      = options || {}
	metadata.filename = pugFile   // PUG: the "filename" option is required to use includes and extends with "relative" paths
	metadata.basedir  = dir.site  // PUG: the "basedir" option is required to use includes and extends with "absolute" paths
	
	let pugTemplate   = fs.readFileSync(pugFile)
	let html          = pug.render(pugTemplate, metadata)
	
	fs.mkdirSync(path.dirname(outFile), { recursive: true })
	fs.writeFileSync(outFile, html)
}

/**
 * Recursively render all pug files in and below the given `dir` to HTML files
 * @param {String} sourceDir top level directory where .pug files are
 * @param {String} urlPath target directory. Files will be stored in `dir.dist + urlPath`
 * @param {Object} options (optional) data that can be used in the pug templates
 */
function renderPages(sourceDir, urlPath, options) {
	if (!fs.existsSync(sourceDir)) {
		console.log("Render Pages:", sourceDir, " =>  Directory does not exist!")
		return
	}
	console.log("Render Pages:", sourceDir, " => ", getUrl(urlPath))
	let tasks = fs.readdirSync(sourceDir)
		.filter(filename => filename.endsWith('.pug'))
		.map(filename => renderPage(sourceDir, filename, urlPath, options))
}

/**
 * Parse metadata from blogPosts. Then use that data to render the index page with the list of blog excerpts.
 * Then also render the blogPosts themselfs and static pages.
 */
parseMetadata(site.blogPosts, dir.blogPosts).then(posts => {
	// Create map   ID => filepath
	var postsById = {}
	posts.forEach(post => postsById[post.id] = post)
	posts = posts.sort((p1, p2) => new Date(p1.date) < new Date(p2.date)).splice(0,5)   // sort by date descending, newest first
	//console.log("======== postsById", postsById)
	renderPages(site.blogPosts, dir.blogPosts, { posts: posts })
	renderPages(site.pages,     dir.pages,     { posts: posts })

	// render index.html
	renderPage(dir.site, dir.indexFile, '', { posts: posts })
})

//============= copy static assets ======================
console.log("Copy static assets", site.static, " => ", dist.static)
ncp(site.static, dist.static, function (err) {
	if (err) {
	  return console.error(err);
	}
	console.log('Done! Site created successfully in ', path.resolve(dir.dist));
})



function getUrl(urlPath, filename) {
	if (filename && filename.endsWith('.pug'))
		filename = filename.slice(0,-4)+'.html'
	let url = dir.baseUrl + '/' + urlPath
	if (filename)
		url += '/' + filename
	url = url.replace(/\/+/, '/')				// "Cleanup"
	return url
}