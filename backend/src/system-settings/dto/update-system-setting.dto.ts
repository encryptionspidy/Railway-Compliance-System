import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class UpdateSystemSettingDto {
  @IsString()
  @IsNotEmpty()
  value!: string;

  @IsString()
  @IsOptional()
  description?: string;
}
