import type { Config } from 'jest';

/**
 * Unit-test project (default). No database, no network. PrismaService and any
 * I/O dependency must be mocked. Integration (*.int-spec.ts) and e2e
 * (*.e2e-spec.ts) specs run under their own configs and are excluded here.
 */
const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testEnvironment: 'node',
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '\\.module\\.ts$',
    'main\\.ts$',
    '\\.dto\\.ts$',
    '\\.entity\\.ts$',
  ],
  coverageThreshold: {
    global: {
      statements: 13,
      branches: 4,
      functions: 8,
      lines: 12,
    },
    // Safety-critical modules: a patient-safety bug here can cause harm, so
    // these require near-total coverage. The globs match nothing until the
    // modules are built; Jest only enforces a glob's threshold when at least
    // one matching file is collected, so absence is a no-op.
    'src/modules/clinical/**/*.ts': {
      branches: 95,
      statements: 95,
      functions: 95,
      lines: 95,
    },
    'src/modules/pharmacy/**/*.ts': {
      branches: 95,
      statements: 95,
      functions: 95,
      lines: 95,
    },
    'src/modules/laboratory/**/*.ts': {
      branches: 95,
      statements: 95,
      functions: 95,
      lines: 95,
    },
    'src/modules/billing/**/*.ts': {
      branches: 95,
      statements: 95,
      functions: 95,
      lines: 95,
    },
  },
};

export default config;
