import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateRouteSectionDto {
  @IsString()
  @IsNotEmpty()
  code!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  depotId?: string;
}
