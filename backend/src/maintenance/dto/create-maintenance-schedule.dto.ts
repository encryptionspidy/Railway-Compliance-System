import {
  IsString,
  IsDateString,
  IsInt,
  IsOptional,
  IsNotEmpty,
} from 'class-validator';

export class CreateMaintenanceScheduleDto {
  @IsString()
  @IsNotEmpty()
  assetId!: string;

  @IsString()
  @IsNotEmpty()
  maintenanceTypeId!: string;

  @IsDateString()
  @IsOptional()
  lastCompletedDate?: string;

  @IsDateString()
  @IsOptional()
  nextDueDate?: string;

  @IsInt()
  @IsOptional()
  lastCompletedHours?: number;

  @IsInt()
  @IsOptional()
  nextDueHours?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
