import {
  IsString,
  IsEmail,
  IsInt,
  IsDateString,
  IsNotEmpty,
  MinLength,
} from 'class-validator';

export class CreateDriverProfileDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  @IsNotEmpty()
  pfNumber!: string;

  @IsString()
  @IsNotEmpty()
  driverName!: string;

  @IsString()
  @IsNotEmpty()
  designation!: string;

  @IsInt()
  @IsNotEmpty()
  basicPay!: number;

  @IsDateString()
  @IsNotEmpty()
  dateOfAppointment!: string;

  @IsDateString()
  @IsNotEmpty()
  dateOfEntry!: string;

  @IsString()
  @IsNotEmpty()
  depotId!: string;
}
