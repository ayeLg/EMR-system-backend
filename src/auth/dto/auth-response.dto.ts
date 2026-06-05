import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from '@/common/dto/user-response.dto';

export class AuthResponseDto {
  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken!: string;

  @ApiProperty({
    description: 'JWT refresh token (long-lived)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXJ9...',
  })
  refreshToken!: string;

  @ApiProperty({ type: UserResponseDto })
  user!: UserResponseDto;
}

export class MeResponseDto {
  @ApiProperty({ type: UserResponseDto })
  user!: UserResponseDto;
}
