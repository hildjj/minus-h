import base from '@cto.af/eslint-config/index.js';
import globals from '@cto.af/eslint-config/globals.js';
import mod from '@cto.af/eslint-config/module.js';
import ts from '@cto.af/eslint-config/ts.js';

export default [
  {
    ignores: ['lib/**'],
  },
  ...base,
  ...mod,
  ...ts,
  {
    files: ['test/*.js'],
    languageOptions: {
      globals: globals.mocha,
    },
  },
];
