import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateDepotDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  code!: string;

  @IsString()
  @IsOptional()
  address?: string;
}
