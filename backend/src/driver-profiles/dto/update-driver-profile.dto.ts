import { PartialType } from '@nestjs/mapped-types';
import { CreateDriverProfileDto } from './create-driver-profile.dto';
import { IsOptional, IsString, IsInt, IsDateString } from 'class-validator';

export class UpdateDriverProfileDto extends PartialType(CreateDriverProfileDto) {
  @IsOptional()
  @IsString()
  driverName?: string;

  @IsOptional()
  @IsString()
  designation?: string;

  @IsOptional()
  @IsInt()
  basicPay?: number;

  @IsOptional()
  @IsDateString()
  dateOfAppointment?: string;

  @IsOptional()
  @IsDateString()
  dateOfEntry?: string;
}
