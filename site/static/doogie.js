/**
 * Javascript for www.doogie.de
 */

console.log("Welcome to doogie.de my d34r fri3nd!")

/**
 * Load further posts when user scrolls down.
 */

// Set up an intersection observer with some options
var observer = new IntersectionObserver(appear, {})

window.addEventListener("load", function(event) {
	// Tell our observer to observe all elements with a "lazy-load" class
	var lazyLoadedElems = document.getElementsByClassName('appear-when-visible')
	for (let elem of lazyLoadedElems) {
		observer.observe(elem)
	}
})

function appear(elements) {
	if (elements[0].isIntersecting)  // when elements becomes visible
		elements[0].target.classList.add("appear-anim")
}