const yaml = require('js-yaml');
const { DateTime } = require('luxon');
const markdownIt = require('markdown-it');
const syntaxHighlight = require('@11ty/eleventy-plugin-syntaxhighlight');

module.exports = (eleventyConfig) => {
	eleventyConfig.addPlugin(syntaxHighlight);

	eleventyConfig.addDataExtension('yaml', (contents) => yaml.load(contents));

	eleventyConfig.addFilter('htmlDateString', (dateObj) => {
		return DateTime.fromJSDate(dateObj, { zone: 'utc' }).toFormat('yyyy-LL-dd');
	});

	eleventyConfig.addFilter(
		'relativeUrl',
		(page, root = '/') => `${require('path').relative(page.filePathStem, root)}/`
	);

	const md = markdownIt({
		breaks: true,
		linkify: true,
	})
		.use(require('markdown-it-footnote'))
		.use(require('markdown-it-attrs'));

	eleventyConfig.setLibrary('md', md);

	md.renderer.rules.footnote_block_open = (tokens, idx, options) => {
		return (
			(options.xhtmlOut
				? '<hr class="footnotes-sep" data-content="footnotes" />\n'
				: '<hr class="footnotes-sep" data-content="footnotes">\n') +
			'<section class="footnotes">\n' +
			'<ol class="footnotes-list">\n'
		);
	};

	return {
		htmlTemplateEngine: 'njk',
		pathPrefix: '/',
		dir: {
			input: 'src/site',
			includes: '_includes',
			layouts: '_includes/layouts',
		},
	};
};
