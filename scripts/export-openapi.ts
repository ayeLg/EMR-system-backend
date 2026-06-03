import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '@/app.module';
import { createOpenApiDocument } from '@/common/swagger/setup-swagger';

async function main(): Promise<void> {
  const outputArg = process.argv.find((arg) => arg.startsWith('--output='));
  const outputPath = resolve(
    process.cwd(),
    outputArg?.split('=')[1] ?? 'generated/openapi.json',
  );

  const app = await NestFactory.create(AppModule, { logger: false });
  app.setGlobalPrefix('api');
  const document = createOpenApiDocument(app);

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, JSON.stringify(document, null, 2));
  await app.close();

  console.log(`OpenAPI document written to ${outputPath}`);
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
