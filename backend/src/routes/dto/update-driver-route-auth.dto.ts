import { IsDateString, IsOptional, IsString } from 'class-validator';

export class UpdateDriverRouteAuthDto {
  @IsDateString()
  @IsOptional()
  authorizedDate?: string;

  @IsDateString()
  @IsOptional()
  expiryDate?: string;

  // Override fields for Super Admin
  @IsString()
  @IsOptional()
  overrideReason?: string;

  @IsString()
  @IsOptional()
  overrideJustification?: string;
}
