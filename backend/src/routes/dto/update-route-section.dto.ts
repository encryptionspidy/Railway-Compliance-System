import { IsString, IsOptional } from 'class-validator';

export class UpdateRouteSectionDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;
}
