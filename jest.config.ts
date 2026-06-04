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
};

export default config;
