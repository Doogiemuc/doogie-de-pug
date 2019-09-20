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
  dist* pathes MUST be relative to dist directory so that HTML url of rendered page will match.
*/
const site = 'site'
const dist   = 'dist'
const dir = {
	site:      site,
	blogPosts: path.join(site, 'blog-posts'),
	includes:  path.join(site, 'includes'),
	pages:     path.join(site, 'pages'),
	static:    path.join(site, 'static'),
	indexFile: 'index.pug',

	dist:          dist,			
	distBlogPosts: path.join(dist, 'blog-posts'),
	distStatic:    path.join(dist, 'static'),
	distPages:     path.join(dist, 'pages'),
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
async function parseMetadataFromPug(pugFile, out_path) {
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
			reject("ERROR parseMetadataFromPug(pugFile="+pugFile+", out_path="+out_path+"):"+ err)
		}
	})
}

/**
 * Parse metadata from first code block of pug files.
 * For example from blog posts. Recursively traverses directory
 * @param {String} sourceDir relative path under dir.site to dir with .pug files
 * @param {Array} list of metadata objects from top of pug files
 */
function parseMetadata(sourceDir, out_path) {
	console.log("Parse metadata from pug files in "+sourceDir)
	let tasks = fs.readdirSync(sourceDir)
		.filter(filename => filename.endsWith('.pug'))
		.map(filename => {
			let pugFile = path.resolve(sourceDir, filename)
			return parseMetadataFromPug(pugFile, out_path).then(metadata => {
				metadata.filename = pugFile   // PUG: the "filename" option is required to use includes and extends with "relative" paths
				metadata.basedir  = dir.site  // PUG: the "basedir" option is required to use includes and extends with "absolute" paths
				metadata.url      = out_path.replace('\\', '/')+'/'+filename.replace(".pug", ".html")
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
	let outFile       = path.resolve(dir.dist, urlPath, filename+'.html')
	console.log("   ", path.join(in_path, filename+'.pug'), " => ", outFile)
	let pugFile       = path.resolve(in_path, filename+'.pug')	// filename with absolut path
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
 * @param {String} targetDir target directory. Files will be stored in same relative location as in sourcedir
 * @param {Object} options (optional) data that can be used in the pug templates
 */
function renderPages(sourceDir, targetDir, options) {
	if (!fs.existsSync(sourceDir)) {
		console.log("Render Pages:", sourceDir, " =>  Directory does not exist!")
		return
	}
	console.log("Render Pages:", sourceDir, " => ", targetDir)
	let tasks = fs.readdirSync(sourceDir)
		.filter(filename => filename.endsWith('.pug'))
		.map(filename => renderPage(sourceDir, filename, targetDir, options))
}

/**
 * Parse metadata from blogPosts. Then use that data to render the index page with the list of blog excerpts.
 * Then also render the blogPosts themselfs and static pages.
 */
parseMetadata(dir.blogPosts, '/').then(posts => {
	// Create map   ID => filepath
	var postsById = {}
	posts.forEach(post => postsById[post.id] = post)
	posts = posts.sort((p1, p2) => new Date(p1.date) < new Date(p2.date)).splice(0,5)   // sort by date descending, newest first
	console.log("======== postsById", postsById)
	renderPages(dir.blogPosts, dir.distBlogPosts, { posts: posts })
	renderPages(dir.pages,     dir.distPages,     { posts: posts })

	// render index.html
	renderPage(dir.site, dir.indexFile, dir.dist, { posts: posts })
})

//============= copy static assets ======================
console.log("Copying static assets to ", dir.distStatic)
ncp(dir.static, dir.distStatic, function (err) {
	if (err) {
	  return console.error(err);
	}
	console.log('Done! Site created successfully in ', path.resolve(dir.dist));
})





function getUrl(urlPath, filename) {
	if (filename.endsWith('pug'))
		filename = filename.slice(0,-4)+'.html'
	if (urlPath.endsWith('/'))
		urlPath = urlPath.slice(0,-1)
	return urlPath + '/' + filename
}