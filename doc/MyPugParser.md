# My PUG parser

This is just a very very rough scetch about what a PUG parser would need to do.

# Gneral

Lines indented with spaces or tab create a neested block.

# Tags

First term on a line (possibly after some indendation) is an HTML tag
Lines indented by tab or spaces create neested tags
Tags in pug are case insensitive, but they will always be transpilled in uppercase.
Inline tags followed by colon+space(": ") also create a neested tag
(area, base, br, col, embed, hr, img, input, link, meta, param, source, track, wbr) are self closing tags
When a tag is followed by a dot(".") then the next block of indented lines are transpilled as the tags textContent
When a tag is followed by indendet lines that are prefixed with "| " then this block becomes the tags textContent
This also works when the tag has class, id, style or attributes.

# Attributes

(name=value) after a tag creates an HTML attribute.
(name=value, name2=value2) creates attributes. The comma between attributes is optional
Attribut values are escapted by default
Attributes values assigned with "!=" are not escapted
Values of attributes can be expressions
Quoted attribut values are not treated as expressions 
Multiple attributes can be spread accross multiple indented lines
Boolean values are mirrod. Pug 'checked' and 'checked=true' both become 'checked="checked"' in HTML

# Stlye, id and CSS classe attributes

Values of style attributes can be JSON objects
'.classname' creates a tag with a class atribute '<tag class="classname">' 
When value of a class attribute is an array, then the array values are listed in the class attibute (separated by spaces)
When value of a class attribute is an object, then all keys with `true` value are listed as class attributes
When tag is ommited and the line beginns with a dot, then a div tag with that class is generated by default
'#id' creates a tag with an id attribute
When tag is ommited and the line beginns with a hash, then a div with that ID is generated.
"&attributes(obj)" *explode* obj into attributes

# Plain text

Everything following a tag (and one space) will be the text contents of the tag. Including raw HTML.
Lines beginning with "<" will be transpiled as plain text. (Usefull for plain HTML tags on one line)

# Interpolation

When a tag is followed by an equals sign and a space("= ") then the reset of the line is evaluated as an expression and becomes the tags textContent
This also works when the tag has #id .class or (name=val) attributes followed by an equal sign and a space.
#{expression} is interpolated also when inline and the result is escaped
\#{something} is not interpolated and transpilled as is
!{variable} is interpolated and *not* escaped


# Conditional IF ... THEN ... ELSE

When a line beginns with if (or IF) then it starts a conditional block.
There can be an else branch
There can be else if branches
Unless negates the condition

# FOR Loop / Iteration

When a line starts with `each <val> in` or `for <val> in` then its children are repeated
The array to iterate over can be any expression
`while` loops are also possible

# Comments

Lines starting with '//' will be transpilled as HTML comments.
Lines starting with '//-' will not be outputted at all.
When a comment is followed by indented lines, then the whole block becomes the comments textContent 

 > Edge case!  `.foo // Not a comment` !!!

# Code

Unbuffered, Buffered, and Unescaped Buffered.

These tricks can all be combined :-)      
    ```
	div.clazz#foo(name=value name2=value2 val="quoted[attr]\\'dfd'" val2='quo"te!Me')&attributes({some: 'data', foo: "bar", }): .class.
	  This block becomes the textContent
	  with two lines
    ```

# include

# mixin
