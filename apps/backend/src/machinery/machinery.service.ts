import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMachineDto } from './dto/create-machine.dto';
import { UpdateMachineDto } from './dto/update-machine.dto';
import { AssignMachineDto } from './dto/assign-machine.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';

@Injectable()
export class MachineryService {
  constructor(private prisma: PrismaService) {}

  async findAll(companyId: string) {
    return this.prisma.machine.findMany({
      where: { companyId, deletedAt: null },
      include: {
        currentProject: {
          select: { id: true, projectName: true, projectCode: true },
        },
        currentSite: {
          select: { id: true, siteName: true, location: true },
        },
        currentOperator: {
          select: { id: true, firstName: true, lastName: true },
        },
        assignments: {
          where: { deletedAt: null },
          orderBy: { startDate: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, companyId: string) {
    const machine = await this.prisma.machine.findFirst({
      where: { id, companyId, deletedAt: null },
      include: {
        currentProject: true,
        currentSite: true,
        currentOperator: {
          select: { id: true, firstName: true, lastName: true, role: true },
        },
        assignments: {
          where: { deletedAt: null },
          include: {
            project: { select: { projectName: true } },
            site: { select: { siteName: true } },
            operator: { select: { firstName: true, lastName: true } },
          },
          orderBy: { startDate: 'desc' },
        },
        maintenanceRecords: {
          where: { deletedAt: null },
          orderBy: { reportedDate: 'desc' },
        },
        fuelLogs: {
          where: { deletedAt: null },
          include: {
            project: { select: { projectName: true } },
            site: { select: { siteName: true } },
          },
          orderBy: { usageDate: 'desc' },
        },
      },
    });

    if (!machine) {
      throw new NotFoundException('Machine not found in this company workspace');
    }
    return machine;
  }

  async create(companyId: string, userId: string, dto: CreateMachineDto) {
    // 1. Plate or serial number must be provided
    if (!dto.plateNumber && !dto.serialNumber) {
      throw new BadRequestException('Plate number or serial number should be provided');
    }

    // 2. Validate rented machinery fields
    if (dto.ownershipType !== 'Owned') {
      if (!dto.rentalStartDate || !dto.rentalEndDate) {
        throw new BadRequestException('Rental start date and end date are required if machine is rented');
      }
      const start = new Date(dto.rentalStartDate);
      const end = new Date(dto.rentalEndDate);
      if (end < start) {
        throw new BadRequestException('Rental end date cannot be before start date');
      }
    }

    // 3. Operator validation
    if (dto.currentOperatorId) {
      const op = await this.prisma.employee.findFirst({
        where: { id: dto.currentOperatorId, companyId, deletedAt: null },
      });
      if (!op) {
        throw new BadRequestException('Operator must belong to the same company');
      }
    }

    // 4. Project/Site validation
    if (dto.currentProjectId) {
      const p = await this.prisma.project.findFirst({
        where: { id: dto.currentProjectId, companyId, deletedAt: null },
      });
      if (!p) {
        throw new BadRequestException('Current project must belong to the same company');
      }
    }
    if (dto.currentSiteId) {
      const s = await this.prisma.site.findFirst({
        where: { id: dto.currentSiteId, companyId, deletedAt: null },
      });
      if (!s) {
        throw new BadRequestException('Current site must belong to the same company');
      }
    }

    return this.prisma.machine.create({
      data: {
        companyId,
        machineType: dto.machineType,
        brand: dto.brand,
        model: dto.model,
        plateNumber: dto.plateNumber || null,
        serialNumber: dto.serialNumber || null,
        capacity: dto.capacity || null,
        ownershipType: dto.ownershipType,
        source: dto.source,
        currentStatus: dto.currentStatus,
        currentProjectId: dto.currentProjectId || null,
        currentSiteId: dto.currentSiteId || null,
        currentOperatorId: dto.currentOperatorId || null,
        rentalStartDate: dto.rentalStartDate ? new Date(dto.rentalStartDate) : null,
        rentalEndDate: dto.rentalEndDate ? new Date(dto.rentalEndDate) : null,
        dailyRentalCost: dto.dailyRentalCost ?? 0,
        hourlyRentalCost: dto.hourlyRentalCost ?? 0,
        notes: dto.notes || null,
        createdById: userId,
      },
    });
  }

  async update(id: string, companyId: string, userId: string, dto: UpdateMachineDto) {
    const machine = await this.prisma.machine.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    if (!machine) {
      throw new NotFoundException('Machine not found in this company workspace');
    }

    // 1. Plate or serial check
    const checkPlate = dto.plateNumber !== undefined ? dto.plateNumber : machine.plateNumber;
    const checkSerial = dto.serialNumber !== undefined ? dto.serialNumber : machine.serialNumber;
    if (!checkPlate && !checkSerial) {
      throw new BadRequestException('Plate number or serial number should be provided');
    }

    // 2. Validate rented machinery fields
    const checkOwnership = dto.ownershipType !== undefined ? dto.ownershipType : machine.ownershipType;
    if (checkOwnership !== 'Owned') {
      const startVal = dto.rentalStartDate ? new Date(dto.rentalStartDate) : machine.rentalStartDate;
      const endVal = dto.rentalEndDate ? new Date(dto.rentalEndDate) : machine.rentalEndDate;
      if (!startVal || !endVal) {
        throw new BadRequestException('Rental start date and end date are required if machine is rented');
      }
      if (new Date(endVal) < new Date(startVal)) {
        throw new BadRequestException('Rental end date cannot be before start date');
      }
    }

    // 3. Operator validation
    if (dto.currentOperatorId) {
      const op = await this.prisma.employee.findFirst({
        where: { id: dto.currentOperatorId, companyId, deletedAt: null },
      });
      if (!op) {
        throw new BadRequestException('Operator must belong to the same company');
      }
    }

    // 4. Project/Site validation
    if (dto.currentProjectId) {
      const p = await this.prisma.project.findFirst({
        where: { id: dto.currentProjectId, companyId, deletedAt: null },
      });
      if (!p) {
        throw new BadRequestException('Current project must belong to the same company');
      }
    }
    if (dto.currentSiteId) {
      const s = await this.prisma.site.findFirst({
        where: { id: dto.currentSiteId, companyId, deletedAt: null },
      });
      if (!s) {
        throw new BadRequestException('Current site must belong to the same company');
      }
    }

    return this.prisma.machine.update({
      where: { id },
      data: {
        machineType: dto.machineType,
        brand: dto.brand,
        model: dto.model,
        plateNumber: dto.plateNumber,
        serialNumber: dto.serialNumber,
        capacity: dto.capacity,
        ownershipType: dto.ownershipType,
        source: dto.source,
        currentStatus: dto.currentStatus,
        currentProjectId: dto.currentProjectId,
        currentSiteId: dto.currentSiteId,
        currentOperatorId: dto.currentOperatorId,
        rentalStartDate: dto.rentalStartDate ? new Date(dto.rentalStartDate) : undefined,
        rentalEndDate: dto.rentalEndDate ? new Date(dto.rentalEndDate) : undefined,
        dailyRentalCost: dto.dailyRentalCost,
        hourlyRentalCost: dto.hourlyRentalCost,
        notes: dto.notes,
        updatedById: userId,
      },
    });
  }

  async remove(id: string, companyId: string, userId: string) {
    const machine = await this.prisma.machine.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    if (!machine) {
      throw new NotFoundException('Machine not found in this company workspace');
    }

    // Soft delete child assignments
    await this.prisma.machineAssignment.updateMany({
      where: { machineId: id, companyId, deletedAt: null },
      data: {
        deletedAt: new Date(),
        updatedById: userId,
      },
    });

    return this.prisma.machine.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedById: userId,
      },
    });
  }

  async assign(companyId: string, machineId: string, userId: string, dto: AssignMachineDto) {
    // 1. Verify machine belongs to this company
    const machine = await this.prisma.machine.findFirst({
      where: { id: machineId, companyId, deletedAt: null },
    });
    if (!machine) {
      throw new NotFoundException('Machine not found in this company workspace');
    }

    // 2. Verify project belongs to this company
    const project = await this.prisma.project.findFirst({
      where: { id: dto.projectId, companyId, deletedAt: null },
    });
    if (!project) {
      throw new BadRequestException('Project must belong to the same company');
    }

    // 3. Verify site belongs to selected project
    const site = await this.prisma.site.findFirst({
      where: { id: dto.siteId, projectId: dto.projectId, companyId, deletedAt: null },
    });
    if (!site) {
      throw new BadRequestException('Site must belong to the selected project');
    }

    // 4. Verify operator belongs to this company if provided
    if (dto.operatorId) {
      const operator = await this.prisma.employee.findFirst({
        where: { id: dto.operatorId, companyId, deletedAt: null },
      });
      if (!operator) {
        throw new BadRequestException('Operator must belong to the same company');
      }
    }

    // 5. Verify dates
    const start = new Date(dto.startDate);
    if (dto.expectedReturnDate) {
      const exp = new Date(dto.expectedReturnDate);
      if (exp < start) {
        throw new BadRequestException('Expected return date cannot be before start date');
      }
    }

    // 6. Complete existing active assignments
    await this.prisma.machineAssignment.updateMany({
      where: { machineId, status: { in: ['Assigned', 'Active'] }, deletedAt: null },
      data: {
        status: 'Completed',
        actualReturnDate: new Date(),
      },
    });

    // 7. Create new assignment
    const assignment = await this.prisma.machineAssignment.create({
      data: {
        companyId,
        machineId,
        projectId: dto.projectId,
        siteId: dto.siteId,
        operatorId: dto.operatorId || null,
        startDate: start,
        expectedReturnDate: dto.expectedReturnDate ? new Date(dto.expectedReturnDate) : null,
        status: 'Active',
        notes: dto.notes || null,
        assignedById: userId,
        createdById: userId,
      },
    });

    // 8. Update parent Machine state
    await this.prisma.machine.update({
      where: { id: machineId },
      data: {
        currentStatus: 'Active',
        currentProjectId: dto.projectId,
        currentSiteId: dto.siteId,
        currentOperatorId: dto.operatorId || null,
      },
    });

    return assignment;
  }

  async updateAssignment(assignmentId: string, companyId: string, userId: string, dto: UpdateAssignmentDto) {
    const assignment = await this.prisma.machineAssignment.findFirst({
      where: { id: assignmentId, companyId, deletedAt: null },
      include: { machine: true },
    });
    if (!assignment) {
      throw new NotFoundException('Machine assignment not found in this company workspace');
    }

    // Date checks
    const startVal = dto.startDate ? new Date(dto.startDate) : assignment.startDate;
    if (dto.endDate) {
      const end = new Date(dto.endDate);
      if (end < new Date(startVal)) {
        throw new BadRequestException('End date cannot be before start date');
      }
    }
    if (dto.expectedReturnDate) {
      const exp = new Date(dto.expectedReturnDate);
      if (exp < new Date(startVal)) {
        throw new BadRequestException('Expected return date cannot be before start date');
      }
    }

    // Operator validation
    if (dto.operatorId) {
      const op = await this.prisma.employee.findFirst({
        where: { id: dto.operatorId, companyId, deletedAt: null },
      });
      if (!op) {
        throw new BadRequestException('Operator must belong to the same company');
      }
    }

    // Handle return action (transition status to Returned)
    const nextStatus = dto.status || assignment.status;
    const isReturned = nextStatus === 'Returned' && assignment.status !== 'Returned';

    const updatedAsg = await this.prisma.machineAssignment.update({
      where: { id: assignmentId },
      data: {
        operatorId: dto.operatorId,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        expectedReturnDate: dto.expectedReturnDate ? new Date(dto.expectedReturnDate) : undefined,
        actualReturnDate: isReturned 
          ? (dto.actualReturnDate ? new Date(dto.actualReturnDate) : new Date())
          : (dto.actualReturnDate ? new Date(dto.actualReturnDate) : undefined),
        status: nextStatus,
        workingHours: dto.workingHours,
        idleHours: dto.idleHours,
        notes: dto.notes,
        updatedById: userId,
      },
    });

    if (isReturned) {
      // Clear parent machine properties
      await this.prisma.machine.update({
        where: { id: assignment.machineId },
        data: {
          currentStatus: 'Available',
          currentProjectId: null,
          currentSiteId: null,
          currentOperatorId: null,
        },
      });
    }

    return updatedAsg;
  }

  async removeAssignment(assignmentId: string, companyId: string, userId: string) {
    const assignment = await this.prisma.machineAssignment.findFirst({
      where: { id: assignmentId, companyId, deletedAt: null },
    });
    if (!assignment) {
      throw new NotFoundException('Machine assignment not found in this company workspace');
    }

    // Clear machine fields if this assignment was active
    if (assignment.status === 'Active' || assignment.status === 'Assigned') {
      await this.prisma.machine.update({
        where: { id: assignment.machineId },
        data: {
          currentStatus: 'Available',
          currentProjectId: null,
          currentSiteId: null,
          currentOperatorId: null,
        },
      });
    }

    return this.prisma.machineAssignment.update({
      where: { id: assignmentId },
      data: {
        deletedAt: new Date(),
        updatedById: userId,
      },
    });
  }

  async findAssignments(machineId: string, companyId: string) {
    // Verify machine
    const machine = await this.prisma.machine.findFirst({
      where: { id: machineId, companyId, deletedAt: null },
    });
    if (!machine) {
      throw new NotFoundException('Machine not found in this company workspace');
    }

    return this.prisma.machineAssignment.findMany({
      where: { machineId, companyId, deletedAt: null },
      include: {
        project: { select: { projectName: true } },
        site: { select: { siteName: true } },
        operator: { select: { firstName: true, lastName: true } },
      },
      orderBy: { startDate: 'desc' },
    });
  }

  async findHistory(machineId: string, companyId: string) {
    const machine = await this.prisma.machine.findFirst({
      where: { id: machineId, companyId, deletedAt: null },
    });
    if (!machine) {
      throw new NotFoundException('Machine not found in this company workspace');
    }

    const assignments = await this.prisma.machineAssignment.findMany({
      where: { machineId, companyId, deletedAt: null },
      include: {
        project: { select: { projectName: true } },
        site: { select: { siteName: true } },
      },
      orderBy: { startDate: 'asc' },
    });

    const events: any[] = [];

    // 1. Creation event
    events.push({
      id: `evt-create-${machine.id}`,
      type: 'CREATION',
      title: 'Machine Registered',
      description: `Added ${machine.brand} ${machine.model} (${machine.machineType}) to fleet.`,
      date: machine.createdAt,
    });

    // 2. Assignment & Return events
    assignments.forEach((asg) => {
      events.push({
        id: `evt-assign-${asg.id}`,
        type: 'ASSIGNMENT',
        title: 'Assigned to Project',
        description: `Assigned to project "${asg.project.projectName}" - site "${asg.site.siteName}".`,
        date: asg.startDate,
      });

      if (asg.status === 'Returned' && asg.actualReturnDate) {
        events.push({
          id: `evt-return-${asg.id}`,
          type: 'RETURN',
          title: 'Returned from Project',
          description: `Released from project "${asg.project.projectName}". logged ${asg.workingHours} working hours.`,
          date: asg.actualReturnDate,
        });
      }
    });

    // 3. Add baseline premium placeholder events (fuel and maintenance)
    events.push({
      id: `evt-maint-mock-${machine.id}`,
      type: 'MAINTENANCE',
      title: 'Routine Maintenance Completed',
      description: 'Engine filter inspection and hydraulic oil replacement logged (Placeholder).',
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    });

    events.push({
      id: `evt-fuel-mock-${machine.id}`,
      type: 'FUEL',
      title: 'Fuel Dispatch Refueled',
      description: 'Logged fuel delivery receipt of 150 liters of diesel (Placeholder).',
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    });

    return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
}
