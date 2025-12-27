import { IsDateString, IsOptional } from 'class-validator';

export class UpdateDriverRouteAuthDto {
  @IsDateString()
  @IsOptional()
  authorizedDate?: string;

  @IsDateString()
  @IsOptional()
  expiryDate?: string;
}
