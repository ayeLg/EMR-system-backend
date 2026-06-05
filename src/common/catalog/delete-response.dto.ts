import { ApiProperty } from '@nestjs/swagger';

export class DeleteMasterDataResponseDto {
  @ApiProperty({ example: true })
  deleted!: boolean;
}
