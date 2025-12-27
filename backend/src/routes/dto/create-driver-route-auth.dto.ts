import { IsString, IsDateString, IsNotEmpty } from 'class-validator';

export class CreateDriverRouteAuthDto {
  @IsString()
  @IsNotEmpty()
  driverProfileId!: string;

  @IsString()
  @IsNotEmpty()
  routeSectionId!: string;

  @IsDateString()
  @IsNotEmpty()
  authorizedDate!: string;

  @IsDateString()
  @IsNotEmpty()
  expiryDate!: string;
}
