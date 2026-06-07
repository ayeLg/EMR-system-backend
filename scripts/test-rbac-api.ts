import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { RbacController } from '../src/modules/rbac/rbac.controller';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule);
  try {
    const controller = app.get(RbacController);
    const permissions = await controller.listPermissions();
    console.log('--- API listPermissions RESOLVED ---');
    console.log('Total Permissions returned:', permissions.length);
    if (permissions.length > 0) {
      console.log('First permission sample:', permissions[0]);
    }
  } catch (error) {
    console.error('API call failed:', error);
  } finally {
    await app.close();
  }
}

main();
