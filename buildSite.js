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
  1. read JSON5 metadata of all blog posts
  2. sort by date
  3. create excerpts of the first n posts (from pug source!)
  4. render index.html with blog list and first n excerpts
  5. render all posts (one HTML per post)
  6. render all static pages
 */

 // Open in_path/filename.json and parse its content als JSON5
function parseMetadataFromJson(in_path, filename) {
	let jsonPath    = path.resolve(in_path, filename+'.json')
	let jsonString  = fs.readFileSync(jsonPath)
	let json        = JSON5.parse(jsonString)
	return json	
}

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

/* 
  Render pug file to HTML (json "options" is available in the pug template)
  If options is an object, it will be available in the pug template
  Otherwise, if the pug template starts with a code block, then the first JSON inside that code block will be parsed as pug options
  */
async function renderPage(in_path, filename, out_path, options) {
	let pugPath       = path.resolve(in_path, filename)
	let pugTemplate   = fs.readFileSync(pugPath)
	let metadata      = options || await parseMetadataFromPug(pugPath) || {}
	metadata.filename = pugPath
	metadata.basedir  = path.join(__dirname, 'content')

	console.log("Rendering pug", filename, "with metadata", metadata)

	let html          = pug.render(pugTemplate, metadata)
	let fullOutpath   = path.resolve(__dirname, out_path)
	fs.mkdirSync(fullOutpath, { recursive: true })
	let outfile       = path.resolve(__dirname, out_path, filename.replace('.pug', '.html'))
	console.log("Rendered page:", pugPath, " => ", outfile)
	fs.writeFileSync(outfile, html)
	return metadata
}

// Load all blog posts and their metadata
async function loadBlogPosts() {
	console.log("==== Loading blog posts")
	let posts = []
	let tasks = []
	let blogPostsPath = path.resolve(__dirname, 'content/blog-posts')
	let items = fs.readdirSync(blogPostsPath)
	items
		.filter(filename => filename.endsWith('.pug'))
		.forEach(filename => {
			//let json = parseMetadataFromPug(path.join(blogPostsPath, filename))
			tasks.push(renderPage(blogPostsPath, filename, 'dist/blog-posts/'))
		})
	return Promise.all(tasks).then(results => {
		return Array.prototype.concat(results)
	})
}

//============= render index.html ======================
loadBlogPosts().then(posts => {
	posts = posts.sort((p1, p2) => new Date(p1.date) < new Date(p2.date)).splice(0,5)   // sort by date descending, newest first
	console.log("======== posts", posts)
	renderPage('content/pages', 'index.pug', 'dist', { posts: posts })
})

//TODO: render "pages"

//============= copy static assets ======================
console.log("Copying static assets:")
let sourcePath = path.resolve(__dirname, "content/static")
let destPath = path.resolve(__dirname, 'dist/static')

ncp(sourcePath, destPath, function (err) {
	if (err) {
	  return console.error(err);
	}
	console.log('done!');
});

/*
fs.mkdirSync(destPath, { recursive: true })

let assets = fs.readdirSync(sourcePath)
assets.forEach(asset => {
	let source = path.join(sourcePath, asset)
	let dest   = path.join(destPath, asset)
	// create dest dir 
	fs.copyFile(source, dest, (err) => {
		if (err) throw err;
		console.log(source, ' => ', dest);
	})	
})

*/