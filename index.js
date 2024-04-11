const { default: Localizer } = require('./dist/index.js');

const localizer = new Localizer({
	localization: {
		en: {
			test: 'Hello, %s!',
		},
	},
});

console.log(localizer.localize('en', 'test', 'SleepyG11'));
