import { IsDateString, IsInt, IsOptional, IsString } from 'class-validator';

export class UpdateDriverComplianceDto {
  @IsDateString()
  @IsOptional()
  doneDate?: string;

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsInt()
  @IsOptional()
  frequencyMonths?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
