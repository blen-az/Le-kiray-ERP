import { PartialType } from '@nestjs/swagger';
import { CreateEmployeeAssignmentDto } from './create-employee-assignment.dto';

export class UpdateEmployeeAssignmentDto extends PartialType(CreateEmployeeAssignmentDto) {}
