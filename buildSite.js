/**
 * The most simple static site generator ever.
 * Only using PUG and JSON
 */
const pug = require('pug')
const fs = require('fs')
const path = require('path')
const JSON5 = require('json5')  // json for humans! :-)
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
  posts:   - array of post metadata extracted rom the pug files
  metadata - the metadata of one post (filename, title, date, tags, ...)
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
 * Parse metadata from first code block of blog post pug files.
 * Sort posts by date, calculate the next and prev links and count tags.
 * @param {String} sourceDir relative path under dir.site to dir with .pug files
 * @param {Array} list of metadata objects from top of pug files
 * @return {Array} (A Promise that will resolve to a) list of metadata objects from each found pug file
 */
function parseMetadata(sourceDir, urlPath) {
	console.log("Parse metadata from pug blog posts in", sourceDir)
	let tasks = fs.readdirSync(sourceDir)
		.filter(filename => filename.endsWith('.pug'))
		.map(filename => {
			let pugFile = path.resolve(sourceDir, filename)
			return parseMetadataFromPug(pugFile).then(metadata => {
				//metadata.filename = pugFile   // PUG: the "filename" option is required to use includes and extends with "relative" paths. Value is the full qualified path to the file.
				//metadata.basedir  = dir.site  // PUG: the "basedir" option is required to use includes and extends with "absolute" paths. 
				metadata.basename = filename    // Just the filename without any path
				metadata.url      = getUrl(urlPath, filename.replace('.pug', '.html'))
				return metadata
			})
		})
	return Promise.all(tasks).then(results => {
		let posts = Array.prototype.concat(results).filter(res => !res.hidden)
		
		// sort by date descending, newest first  with sticky posts at the top
		posts = posts.sort((p1, p2) => {
			if (p1.sticky) return -1
			if (p2.sticky) return 1
			return new Date(p1.date) < new Date(p2.date) ? 1 : -1
		})  
		
		// add prev and next links to each post
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

		// Count tags
		let tagCountById = {}
		posts.forEach(post => {
			if (post.tags) {
				post.tags.forEach(tag => {
					tagCountById[tag] ? tagCountById[tag]++ : tagCountById[tag] = 1
				})
			}
		})
		let sortedTags = []
		for (let tag in tagCountById) {
			sortedTags.push({tag: tag, count: tagCountById[tag]})
		}
		sortedTags = sortedTags.sort((t1, t2) => t2.count - t1.count)  // Tags with the highest count first
		
		// map posts to their IDs
		let postsById = {}
		posts.forEach(post => postsById[post.id] = post)

		let options = {
			posts: posts,
			postsById: postsById,
			tags: sortedTags,
		}

		return options
	})
}

/**
 * 
 * @param {String} pugFile path to pug file
 * @param {String} url relative url that the file will be written to, e.g. blog-posts/
 * @param {Object} options (optional) data that will be available inside the pug file
 */
function renderPage(pugFile, url, options) {
	console.log(" ".repeat(logIndent), pugFile, " => ", url)

	let outFile       = path.join(dir.dist, url)
	options           = options || {}
	options.filename  = pugFile   // PUG: the "filename" option is required to use includes and extends with "relative" paths. Value is the full qualified path to the file.
	options.basedir   = dir.site  // PUG: the "basedir" option is required to use includes and extends with "absolute" paths
	
	let pugTemplate   = fs.readFileSync(pugFile)
	let html          = pug.render(pugTemplate, options)
	
	fs.mkdirSync(path.dirname(outFile), { recursive: true })
	fs.writeFileSync(outFile, html)
}


/**
 * Recursively render all blog posts (pug files) in and below the given `dir` to HTML files.
 * This also sorts the blog posts by date with sticky posts at the top.
 * @param {String} sourceDir top level directory where .pug files are
 * @param {String} urlPath target directory. Files will be stored in `dir.dist + urlPath`
 * @param {Object} posts an array of post metadata
 * @return the sorted list of posts
 */
function renderBlogPosts(sourceDir, urlPath, options) {
	if (!fs.existsSync(sourceDir)) {
		console.log("Render blog posts:", sourceDir, " =>  Directory does not exist!")
		return
	}
	console.log("Render blog posts:", sourceDir, " => ", urlPath)

	// render blog posts
	options.posts.forEach(post => {
		options.post = options.postsById[post.id]   // every post needs its own data
		renderPage(path.join(sourceDir, post.basename), urlPath+'/'+post.basename.replace('.pug', '.html'), options)
	})
	options.post = undefined

	//console.log(JSON.stringify(options))
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
		.map(filename => renderPage(path.join(sourceDir, filename), urlPath+'/'+filename.replace('.pug', '.html'), options))
}

/** This version works with parcel 
parseMetadata(site.blogPosts, dir.blogPosts).then(options => {
	let outFile = path.resolve(dir.site, 'pug.config.js')
	console.log("Writing", outFile)
	let content = "module.exports = { locals: " + JSON.stringify(options) + " }"
	
	fs.writeFileSync(outFile, content)
})
*/


/**
 * Parse metadata from blogPosts. Then use that data to render the index page with the list of blog excerpts.
 * Then also render the blogPosts themselfs and static pages.
 */
parseMetadata(site.blogPosts, dir.blogPosts).then(options => {
	
	//console.log("\n\n======= posts and tags\n\n", options, "\n\n")

	// render all blog posts
	renderBlogPosts(site.blogPosts, dir.blogPosts, options),

	// render normal static pages
	renderPages(site.pages, dir.pages, options)   // pass array of posts as "options" for the pug pages

	//render one page for each tag. 
	if (options.tags) {
		console.log("Render taxonomy pages:")
		options.tags.filter(tag => tag.count > 1).forEach(tag => {
			//console.log(" ".repeat(logIndent), "Tag: ", tag.tag)
			let optionsCopy = JSON.parse(JSON.stringify(options))
			optionsCopy.posts = optionsCopy.posts.filter(post => post.tags && post.tags.includes(tag.tag))
			optionsCopy.tagListHeader = tag.tag
			renderPage(path.join(dir.site, dir.indexFile), 'tags/'+encodeURIComponent(tag.tag)+'.html', optionsCopy)    // use relative url!
		})
	}

	// render index.html   Uses list of posts to generate list of excerpts
	console.log("Render "+dir.indexFile)
	options.posts = options.posts.splice(0,10) // index page ned first five posts
	renderPage(path.join(dir.site, dir.indexFile), dir.indexFile.replace('.pug', '.html'), options)
}).then(() => {
	console.log("Copy static assets".padEnd(logIndent), site.static, " => ", dist.static)
	ncp(site.static, dist.static, function (err) {
		if (err) {
		  return console.error(err);
		}
		console.log("DONE! Site created successfully in".padEnd(logIndent), path.resolve(dir.dist));
	})
})



function getUrl(urlPath, filename) {
	/*
	if (filename && filename.endsWith('.pug'))
		filename = filename.slice(0,-4)+'.html'
	*/
	let url = dir.baseUrl + '/' + urlPath
	if (filename)
		url += '/' + filename
	url = url.replace(/\/+/, '/')				// "Cleanup"
	return url
}