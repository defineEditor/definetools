module.exports = {
  extends: ["eslint:recommended", "standard"],
  parserOptions: {
    ecmaVersion: 8,
    ecmaFeatures: {
      jsx: true,
      es6: true,
      modules: true
    }
  },
  settings: {
    propWrapperFunctions: ['forbidExtraProps'] // The names of any functions used to wrap the
    // propTypes object, e.g. `forbidExtraProps`.
    // If this isn't set, any propTypes wrapped in
    // a function will be skipped.
  },
  plugins: ['standard'],
  rules: {
    // enable additional rules
    indent: ['error', 4, { SwitchCase: 1 }],
    'linebreak-style': ['error', 'unix'],
    semi: ['error', 'always'],
    'react/no-string-refs': 0,
    'react/prop-types': 0,
    'comma-dangle': 0,
    'no-console': 0
  }
};
