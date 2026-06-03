import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.email().meta({ example: 'doctor@example.com' }),
  password: z.string().min(8).meta({ example: 'password123' }),
});

export class LoginDto extends createZodDto(LoginSchema) {}
