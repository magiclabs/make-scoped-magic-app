module.exports = {
  root: true,

  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'airbnb-typescript',
    'plugin:@typescript-eslint/recommended',
    'plugin:jsx-a11y/recommended',
    'plugin:prettier/recommended',
  ],

  parser: '@typescript-eslint/parser',

  parserOptions: {
    project: ['./tsconfig.json'],
  },

  plugins: ['react', 'react-hooks', '@typescript-eslint', 'jsx-a11y', 'prettier'],

  rules: {
    // Import rules
    'import/extensions': 0,
    'import/no-extraneous-dependencies': 0,

    // TypeScript rules
    '@typescript-eslint/no-explicit-any': 0,
    '@typescript-eslint/no-use-before-define': 0,
    '@typescript-eslint/no-namespace': 0,
    '@typescript-eslint/ban-types': 0,
  },

  settings: {
    'import/resolver': {
      typescript: {
        project: ['./tsconfig.json'],
      },
    },
  },
};
