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

const sourceDir = 'site'
const distDir   = 'dist'
const dir = {
	sourceDir: sourceDir,
	blogPosts: path.join(sourceDir, 'blog-posts'),
	includes:  path.join(sourceDir, 'includes'),
	pages:     path.join(sourceDir, 'pages'),
	static:    path.join(sourceDir, 'static'),
	indexFile: 'index.pug',

	distDir:       distDir,
	distBlogPosts: path.join(distDir, 'blog-posts'),
	distStatic:    path.join(distDir, 'static'),
	distPages:     path.join(distDir, 'pages'),
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
	let inCodeBlock = false
	let jsonString  = ""
	// https://nodejs.org/api/readline.html
	let lineReader  = readline.createInterface({
		input: fs.createReadStream(pugFile),
		crlfDelay: Infinity
	})	
	lineReader.on('line', function (line) {
		if (line.startsWith('-')) {
			inCodeBlock = true
		} else
		if (inCodeBlock && line.startsWith("\t")) {
			jsonString += line
		} else 
		if (inCodeBlock) {
			inCodeBlock = false
			lineReader.close()
		}
	})
	await once(lineReader, 'close');
	let json5 = JSON5.parse(jsonString.match(/{.*}/))
	return json5
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

/* 
  Render pug file to HTML (json "options" is available in the pug template)
  If options is an object, it will be available in the pug template
  Otherwise, if the pug template starts with a code block, then the first JSON inside that code block will be parsed as pug options
  */
async function renderPage(in_path, filename, out_path, options) {
	//console.log("renderPage", in_path, filename, out_path, options)
	let pugFile       = path.resolve(in_path, filename)
	let pugTemplate   = fs.readFileSync(pugFile)
	let metadata      = options || await parseMetadataFromPug(pugFile) || {}
	metadata.filename = pugFile
	metadata.basedir  = dir.sourceDir
	let html          = pug.render(pugTemplate, metadata)
	let fullOutpath   = path.resolve(out_path)
	fs.mkdirSync(fullOutpath, { recursive: true })
	let outFile       = path.resolve(out_path, filename.replace('.pug', '.html'))
	console.log("Render:", in_path+path.sep+filename, " => ", outFile)
	fs.writeFileSync(outFile, html)
	return metadata
}

// Load all blog posts and their metadata
function renderBlogPosts() {
	//TODO: search recursively
	let tasks = fs.readdirSync(dir.blogPosts)
		.filter(filename => filename.endsWith('.pug'))
		.map(filename => renderPage(dir.blogPosts, filename, dir.distBlogPosts))
	return Promise.all(tasks).then(results => {
		return Array.prototype.concat(results)
	})
}

//============= render all pages ======================

function renderPages(options) {
	let tasks = fs.readdirSync(dir.pages)
		.filter(filename => filename.endsWith('.pug'))
		.map(filename => renderPage(dir.pages, filename, dir.distPages, options))
	return Promise.all(tasks).then(results => {
		return Array.prototype.concat(results)
	})
}

renderBlogPosts().then(posts => {
	posts = posts.sort((p1, p2) => new Date(p1.date) < new Date(p2.date)).splice(0,5)   // sort by date descending, newest first
	//console.log("======== posts", posts)
	renderPages()
	// Render index.html
	renderPage(dir.sourceDir, dir.indexFile, dir.distDir, { posts: posts })
})

//============= copy static assets ======================
console.log("Copying static assets to ", dir.distStatic)
ncp(dir.static, dir.distStatic, function (err) {
	if (err) {
	  return console.error(err);
	}
	console.log('Done! Site created successfully in ', path.resolve(distDir));
})
