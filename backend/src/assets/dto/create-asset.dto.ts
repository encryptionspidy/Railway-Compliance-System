import { IsString, IsEnum, IsInt, IsDateString, IsOptional, IsNotEmpty } from 'class-validator';
import { AssetType } from '@prisma/client';

export class CreateAssetDto {
  @IsString()
  @IsNotEmpty()
  assetNumber!: string;

  @IsEnum(AssetType)
  @IsNotEmpty()
  assetType!: AssetType;

  @IsString()
  @IsNotEmpty()
  depotId!: string;

  @IsInt()
  @IsOptional()
  currentHours?: number;

  @IsDateString()
  @IsOptional()
  lastServiceDate?: string;
}
