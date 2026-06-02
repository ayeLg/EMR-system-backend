import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CheckPolicies } from '@/common/decorators/check-policies.decorator';
import { SWAGGER_BEARER_AUTH } from '@/common/swagger/setup-swagger';
import { Create__Feature__Dto } from './dto/create-__feature__.dto';
import { Update__Feature__Dto } from './dto/update-__feature__.dto';
import {
  create__Feature__Policy,
  read__Feature__Policy,
  update__Feature__Policy,
} from './policies/__feature__.policies';
import { __Feature__Service } from './__feature__.service';

@ApiTags('__feature__')
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@ApiUnauthorizedResponse()
@ApiForbiddenResponse()
@Controller('__feature__')
export class __Feature__Controller {
  constructor(private readonly __feature__Service: __Feature__Service) {}

  @CheckPolicies(read__Feature__Policy())
  @Get()
  @ApiOperation({ summary: 'List all __feature__' })
  findAll() {
    return this.__feature__Service.findAll();
  }

  @CheckPolicies(read__Feature__Policy())
  @Get(':id')
  @ApiOperation({ summary: 'Get __feature__ by ID' })
  findOne(@Param('id') id: string) {
    return this.__feature__Service.findOne(id);
  }

  @CheckPolicies(create__Feature__Policy())
  @Post()
  @ApiOperation({ summary: 'Create __feature__' })
  create(@Body() dto: Create__Feature__Dto) {
    return this.__feature__Service.create(dto);
  }

  @CheckPolicies(update__Feature__Policy())
  @Patch(':id')
  @ApiOperation({ summary: 'Update __feature__' })
  update(@Param('id') id: string, @Body() dto: Update__Feature__Dto) {
    return this.__feature__Service.update(id, dto);
  }
}
