import { ExecutorContext, logger } from '@nrwl/devkit';
import * as childProcess from 'child_process';

export default async function deployExecutor(
  options: any,
  context: ExecutorContext
) {
  try {
    const configuration = options.configurations;

    logger.info('Destroying the project...');
    runCommand(`nx build apigateway -c ${configuration}`, context.cwd);

    process.chdir(context.cwd);

    logger.info('Installing dependencies...');
    runCommand(
      'npm install --legacy-peer-deps',
      'apps/apigateway/dist/apps/apigateway'
    );

    logger.info('Destroying AWS CDK stack...');
    runCommand(`CONFIGURATION=${configuration} cdk destroy`, 'apps/apigateway');

    return { success: true };
  } catch (error) {
    logger.error('Destroying failed:');
    return { success: false };
  }
}

function runCommand(command: string, cwd: string) {
  childProcess.execSync(command, { cwd, stdio: 'inherit' });
}
