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
    '^.+\\.(t|j)s$': [
      'ts-jest',
      { tsconfig: '<rootDir>/../tsconfig.spec.json' },
    ],
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
    // these require near-total (95%) coverage. Adding an untested .ts file to
    // any of these directories fails `test:cov` — that is the safety gate.
    //
    // NOTE: Jest 30 errors ("Coverage data ... was not found") if a path glob
    // matches zero files, so each directory ships a placeholder `index.ts` +
    // `index.spec.ts` to keep the glob non-empty until the real module lands.
    // Remove the placeholder when implementing the module.
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
