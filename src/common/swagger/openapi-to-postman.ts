import { OpenAPIObject } from '@nestjs/swagger';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const convert = require('openapi-to-postmanv2') as (
  input: { type: 'json'; data: OpenAPIObject },
  options: Record<string, unknown>,
  callback: (
    err: Error | null,
    result: {
      result: boolean;
      reason?: string;
      output: Array<{ type: string; data: Record<string, unknown> }>;
    },
  ) => void,
) => void;

export interface PostmanExportOptions {
  baseUrl: string;
}

export async function openApiToPostmanCollection(
  openApiDocument: OpenAPIObject,
  options: PostmanExportOptions,
): Promise<Record<string, unknown>> {
  const collection = await new Promise<Record<string, unknown>>(
    (resolve, reject) => {
      convert(
        { type: 'json', data: openApiDocument },
        {
          folderStrategy: 'Tags',
          requestNameSource: 'Fallback',
          schemaFaker: false,
        },
        (err, result) => {
          if (err) {
            reject(err);
            return;
          }
          if (!result.result) {
            reject(
              new Error(
                result.reason ?? 'OpenAPI to Postman conversion failed',
              ),
            );
            return;
          }
          resolve(result.output[0].data);
        },
      );
    },
  );

  return enhancePostmanCollection(collection, options);
}

function enhancePostmanCollection(
  collection: Record<string, unknown>,
  options: PostmanExportOptions,
): Record<string, unknown> {
  const info = collection.info as Record<string, unknown> | undefined;
  if (info) {
    info.name = info.name ?? 'EMR System API';
    info.schema =
      'https://schema.getpostman.com/json/collection/v2.1.0/collection.json';
  }

  collection.variable = [
    { key: 'baseUrl', value: options.baseUrl, type: 'string' },
    { key: 'accessToken', value: '', type: 'string' },
  ];

  collection.auth = {
    type: 'bearer',
    bearer: [{ key: 'token', value: '{{accessToken}}', type: 'string' }],
  };

  injectLoginTokenScript(collection.item as PostmanItem[] | undefined);

  return collection;
}

interface PostmanItem {
  name?: string;
  request?: { method?: string; url?: string | { path?: string[] } };
  event?: Array<{ listen: string; script: { type: string; exec: string[] } }>;
  item?: PostmanItem[];
}

function injectLoginTokenScript(items: PostmanItem[] | undefined): void {
  if (!items) {
    return;
  }

  for (const item of items) {
    if (item.item) {
      injectLoginTokenScript(item.item);
      continue;
    }

    const method = item.request?.method?.toUpperCase();
    const url = item.request?.url;
    const path =
      typeof url === 'string'
        ? url
        : Array.isArray(url?.path)
          ? url.path.join('/')
          : '';

    if (method === 'POST' && path.includes('auth/login')) {
      item.event = [
        {
          listen: 'test',
          script: {
            type: 'text/javascript',
            exec: [
              'const json = pm.response.json();',
              'if (json.accessToken) {',
              "  pm.collectionVariables.set('accessToken', json.accessToken);",
              "  pm.environment.set('accessToken', json.accessToken);",
              '}',
            ],
          },
        },
      ];
    }
  }
}
