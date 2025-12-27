import { IsString, IsInt, IsDateString, IsOptional } from 'class-validator';

export class UpdateAssetDto {
  @IsString()
  @IsOptional()
  assetNumber?: string;

  @IsInt()
  @IsOptional()
  currentHours?: number;

  @IsDateString()
  @IsOptional()
  lastServiceDate?: string;
}
