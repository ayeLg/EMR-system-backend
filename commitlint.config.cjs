/** Conventional Commits — enforced by the commit-msg git hook. */
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'header-max-length': [2, 'always', 150],
  },
};
