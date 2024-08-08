'use strict';

/** @type {import('typedoc').TypeDocOptions} */
module.exports = {
  entryPoints: ['src/index.ts'],
  out: 'docs',
  cleanOutputDir: true,
  sidebarLinks: {
    GitHub: 'https://github.com/hildjj/minus-h/',
    Documentation: 'http://hildjj.github.io/minus-h/',
    OriginalAPI: 'https://nodejs.org/api/util.html#utilparseargsconfig',
  },
  navigation: {
    includeCategories: false,
    includeGroups: false,
  },
  categorizeByGroup: false,
  sort: ['static-first', 'alphabetical'],
  exclude: ['**/*.test.js'],
  validation: {
    notExported: true,
    invalidLink: true,
    notDocumented: true,
  },
};
