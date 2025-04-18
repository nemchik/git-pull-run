import { prepareEnvironment } from '@gmrchk/cli-testing-library';

const clearDebugOutput = (result: string[]) =>
  result
    .filter((line) => !line.startsWith('Debugger attached'))
    .filter(
      (line) => !line.startsWith('Waiting for the debugger to disconnect'),
    );

describe('Run CLI options', () => {
  let testEnv: Awaited<ReturnType<typeof prepareEnvironment>>;

  beforeEach(async () => {
    testEnv = await prepareEnvironment();
    const { execute } = testEnv;

    testEnv.execute = async (...params: Parameters<typeof execute>) => {
      const { stdout, stderr, ...result } = await execute(...params);
      return {
        ...result,
        stdout: clearDebugOutput(stdout),
        stderr: clearDebugOutput(stderr),
      };
    };
  });

  afterEach(async () => {
    await testEnv.cleanup();
  });

  test('Print version', async () => {
    const { code, stdout, stderr } = await testEnv.execute(
      'node',
      './dist/cli.js --version',
    );

    const { version } = (await import('../package.json')).default;

    expect(code).toBe(0);
    expect(stderr).toHaveLength(0);
    expect(stdout).toContain(version);
  });

  test('Print help', async () => {
    const { code, stdout, stderr } = await testEnv.execute(
      'node',
      './dist/cli.js --help default',
    );

    expect(code).toBe(0);
    expect(stderr).toHaveLength(0);
    expect(stdout).toMatchInlineSnapshot(`
[
  "Usage: git-pull-run [options]",
  "Options:",
  "-V, --version            output the version number",
  "-i, --install            detect package manager and run install",
  "-p, --pattern <glob>     pattern to match files (required)",
  "-c, --command <command>  execute shell command for each matched file",
  "-s, --script <script>    execute npm script for each matched file",
  "-m, --message <message>  print message to the console if matches were found",
  "-d, --debug              print additional debug information (default: false)",
  "-o, --once               run command only once if any files match the pattern",
  "(default: false)",
  "-h, --help               display help for command",
]
`);
  });

  test('Fail without required options', async () => {
    const { code, stdout, stderr } = await testEnv.execute(
      'node',
      './dist/cli.js',
    );

    expect(code).toBe(1);
    expect(stderr).toMatchInlineSnapshot(`
      [
        "error: required option '-p, --pattern <glob>' not specified",
      ]
    `);
    expect(stdout).toHaveLength(0);
  });
});
