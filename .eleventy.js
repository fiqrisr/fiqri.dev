const yaml = require('js-yaml');
const { DateTime } = require('luxon');

module.exports = (eleventyConfig) => {
	eleventyConfig.addDataExtension('yaml', (contents) => yaml.load(contents));

	eleventyConfig.addFilter('readableDate', (dateObj) => {
		return DateTime.fromJSDate(dateObj, { zone: 'utc' }).toFormat('dd LLL yyyy');
	});

	eleventyConfig.addFilter('htmlDateString', (dateObj) => {
		return DateTime.fromJSDate(dateObj, { zone: 'utc' }).toFormat('yyyy-LL-dd');
	});

	return {
		dir: {
			input: 'src/site',
			includes: '_includes',
			layouts: '_includes/layouts',
		},
	};
};
