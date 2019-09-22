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

const logIndent = 40

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

  Naming conventions for these methods:
  basename - just the filename with extension but without path
  filename - filename with a fully qualified path

  */

/**
 * Parse metadata from the first code block at the top of pugGile
 * @param {String} pugFile path to a .pug file
 * @returns (A Promise that resolves to) the parsed JSON
 */
async function parseMetadataFromPug(pugFile) {
	return new Promise(function(resolve, reject) {
		console.log(" ".repeat(logIndent), pugFile)
		try {
			// https://nodejs.org/api/readline.html
			let lineReader  = readline.createInterface({
				input: fs.createReadStream(pugFile),
				crlfDelay: Infinity
			})	
			let codeIndent = -1
			let jsonString  = ""
			lineReader.on('line', function (line) {
				let codeBlockStart  = line.match(/^(\t*)-$/)
				let lineIsCodeBlock = codeIndent >= 0 && new RegExp("^(\\t{"+(codeIndent+1)+"})").test(line)
				if (codeIndent < 0 && codeBlockStart) {
					codeIndent = codeBlockStart[1].length  // number of tab characters indendation
				} else
				if (lineIsCodeBlock) {
					jsonString += line
				} else 
				if (codeIndent >= 0) {
					codeIndent = -1
					lineReader.close()
					let metadata = JSON5.parse(jsonString.match(/{.*}/))
					resolve(metadata)
				}
			})
			lineReader.on('close', function() {
				if (jsonString === "") console.log("WARN: Did not find any metadata in", pugFile)
			})
		} catch (err) {
			reject("ERROR parseMetadataFromPug(pugFile="+pugFile+"):"+ err)
		}
	})
}

/**
 * Parse metadata from first code block of pug files.
 * For example from blog posts. 
 * TODO: Recursively traverses directory
 * @param {String} sourceDir relative path under dir.site to dir with .pug files
 * @param {Array} list of metadata objects from top of pug files
 * @return {Array} list of metadata objects from each found pug file
 */
function parseMetadata(sourceDir, urlPath) {
	console.log("Parse metadata from pug files in", sourceDir)
	let tasks = fs.readdirSync(sourceDir)
		.filter(filename => filename.endsWith('.pug'))
		.map(filename => {
			let pugFile = path.resolve(sourceDir, filename)
			return parseMetadataFromPug(pugFile).then(metadata => {
				//metadata.filename = pugFile   // PUG: the "filename" option is required to use includes and extends with "relative" paths. Value is the full qualified path to the file.
				//metadata.basedir  = dir.site  // PUG: the "basedir" option is required to use includes and extends with "absolute" paths. 
				metadata.basename = filename    // Just the filename without any path
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
	console.log(" ".repeat(logIndent), path.join(in_path, filename+'.pug'), " => ", getUrl(urlPath, filename+'.html'))

	let pugFile       = path.resolve(in_path, filename+'.pug')			// filename with absolut path
	let outFile       = path.resolve(dir.dist, urlPath, filename+'.html')	
	let metadata      = options || {}
	metadata.filename = pugFile   // PUG: the "filename" option is required to use includes and extends with "relative" paths. Value is the full qualified path to the file.
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
function renderBlogPosts(sourceDir, urlPath, metadata) {
	if (!fs.existsSync(sourceDir)) {
		console.log("Render blog posts:", sourceDir, " =>  Directory does not exist!")
		return
	}
	console.log("Render blog bosts:", sourceDir, " => ", getUrl(urlPath))
	
	// Enrich metadata of posts
	let posts = metadata.posts.slice()  // make a copy!
	var postsById = {}
	posts.forEach(post => postsById[post.id] = post)
	posts = posts.sort((p1, p2) => {
		//TODO: sticky posts
		return new Date(p1.date) < new Date(p2.date)
	}).splice(0,5)   // sort by date descending, newest first
	
	// add prev and next links to posts array
	if (posts.length > 2) { 
		posts[0].next = {
			title: posts[1].title,
			url:   posts[1].url
		}
		posts[posts.length-1].prev = {
			title: posts[posts.length-2].title,
			url:   posts[posts.length-2].url
		}
		for (let i = 1; i < posts.length-1; i++) {
			posts[i].prev = {
				title: posts[i-1].title,
				url:   posts[i-1].url
			}
			posts[i].next = {
				title: posts[i+1].title,
				url:   posts[i+1].url
			}
		}
	}

	// render blog posts with that metadata
	posts.forEach(post => renderPage(sourceDir, post.basename, urlPath, { post: post }))
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


	// render Blog posts with metadata
	//console.log("\n\n======= posts\n\n", posts, "\n\n")
	renderBlogPosts(site.blogPosts, dir.blogPosts, { posts: posts })
	
	// render normal static pages
	renderPages(site.pages, dir.pages, { posts: posts})

	// render index.html   Uses list of posts to generate list of excerpts
	renderPage(dir.site, dir.indexFile, '', { posts: posts})
})

//============= copy static assets ======================
console.log("Copy static assets".padEnd(logIndent), site.static, " => ", dist.static)
ncp(site.static, dist.static, function (err) {
	if (err) {
	  return console.error(err);
	}
	console.log("DONE! Site created successfully in".padEnd(logIndent), path.resolve(dir.dist));
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