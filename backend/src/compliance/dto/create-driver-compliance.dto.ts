import { IsString, IsDateString, IsInt, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateDriverComplianceDto {
  @IsString()
  @IsNotEmpty()
  driverProfileId!: string;

  @IsString()
  @IsNotEmpty()
  complianceTypeId!: string;

  @IsDateString()
  @IsNotEmpty()
  doneDate!: string;

  @IsDateString()
  @IsNotEmpty()
  dueDate!: string;

  @IsInt()
  @IsNotEmpty()
  frequencyMonths!: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
