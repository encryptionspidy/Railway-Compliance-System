import { IsDateString, IsInt, IsOptional, IsString } from 'class-validator';

export class UpdateMaintenanceScheduleDto {
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
