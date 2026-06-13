import { ApiProperty } from '@nestjs/swagger';

export class InventoryResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  batchNumber!: string;

  @ApiProperty()
  expiryDate!: string;

  @ApiProperty()
  quantityOnHand!: number;

  @ApiProperty()
  reorderLevel!: number;
}
