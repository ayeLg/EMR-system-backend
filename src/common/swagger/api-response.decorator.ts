import { Type, applyDecorators } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiExtraModels,
  ApiOkResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { ApiResponseDto } from '@/common/dto/api-response.dto';

interface DataResponseOptions {
  description?: string;
  isArray?: boolean;
}

function envelopeSchema(model: Type<unknown>, isArray: boolean) {
  const dataSchema = isArray
    ? { type: 'array', items: { $ref: getSchemaPath(model) } }
    : { $ref: getSchemaPath(model) };

  return {
    allOf: [
      { $ref: getSchemaPath(ApiResponseDto) },
      { properties: { data: dataSchema } },
    ],
  };
}

/** `200 OK` documented as the standard envelope with `data` set to `model`. */
export function ApiOkResponseData<TModel extends Type<unknown>>(
  model: TModel,
  options: DataResponseOptions = {},
) {
  const { description, isArray = false } = options;
  return applyDecorators(
    ApiExtraModels(ApiResponseDto, model),
    ApiOkResponse({ description, schema: envelopeSchema(model, isArray) }),
  );
}

/** `201 Created` documented as the standard envelope with `data` set to `model`. */
export function ApiCreatedResponseData<TModel extends Type<unknown>>(
  model: TModel,
  options: DataResponseOptions = {},
) {
  const { description, isArray = false } = options;
  return applyDecorators(
    ApiExtraModels(ApiResponseDto, model),
    ApiCreatedResponse({ description, schema: envelopeSchema(model, isArray) }),
  );
}
