import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { CreateEmployeeAssignmentDto } from './dto/create-employee-assignment.dto';
import { UpdateEmployeeAssignmentDto } from './dto/update-employee-assignment.dto';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { ApproveLeaveRequestDto } from './dto/approve-leave-request.dto';
import { RejectLeaveRequestDto } from './dto/reject-leave-request.dto';

@Injectable()
export class HrService {
  constructor(private readonly prisma: PrismaService) {}

  // ==================== EMPLOYEES ====================

  async createEmployee(companyId: string, userId: string, dto: CreateEmployeeDto) {
    if (dto.siteId) {
      const site = await this.prisma.site.findFirst({
        where: { id: dto.siteId, companyId, deletedAt: null },
      });
      if (!site) throw new BadRequestException('Associated site not found in company');
    }

    return this.prisma.employee.create({
      data: {
        companyId,
        createdById: userId,
        employeeCode: dto.employeeCode || `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
        firstName: dto.firstName,
        middleName: dto.middleName,
        lastName: dto.lastName,
        phone: dto.phone,
        email: dto.email,
        gender: dto.gender,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null,
        nationalIdNumber: dto.nationalIdNumber,
        position: dto.position,
        department: dto.department,
        employmentType: dto.employmentType,
        employmentStatus: dto.employmentStatus,
        hireDate: new Date(dto.hireDate),
        terminationDate: dto.terminationDate ? new Date(dto.terminationDate) : null,
        dailyRate: dto.dailyRate || 0,
        monthlySalary: dto.monthlySalary || 0,
        emergencyContactName: dto.emergencyContactName,
        emergencyContactPhone: dto.emergencyContactPhone,
        address: dto.address,
        documentUrl: dto.documentUrl,
        notes: dto.notes,
        role: dto.position,
        siteId: dto.siteId || null,
      },
      include: {
        site: true,
      },
    });
  }

  async findAllEmployees(
    companyId: string,
    filters?: {
      search?: string;
      position?: string;
      employmentType?: string;
      employmentStatus?: string;
      projectId?: string;
      siteId?: string;
    },
  ) {
    const where: any = { companyId, deletedAt: null };

    if (filters?.position && filters.position !== 'ALL') {
      where.position = filters.position;
    }
    if (filters?.employmentType && filters.employmentType !== 'ALL') {
      where.employmentType = filters.employmentType;
    }
    if (filters?.employmentStatus && filters.employmentStatus !== 'ALL') {
      where.employmentStatus = filters.employmentStatus;
    }
    if (filters?.siteId && filters.siteId !== 'ALL') {
      where.siteId = filters.siteId;
    }
    if (filters?.projectId && filters.projectId !== 'ALL') {
      where.assignments = {
        some: { projectId: filters.projectId, status: 'Active', deletedAt: null },
      };
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      where.OR = [
        { firstName: { contains: q, mode: 'insensitive' } },
        { lastName: { contains: q, mode: 'insensitive' } },
        { employeeCode: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q, mode: 'insensitive' } },
        { position: { contains: q, mode: 'insensitive' } },
      ];
    }

    return this.prisma.employee.findMany({
      where,
      include: {
        site: true,
        assignments: {
          where: { status: 'Active', deletedAt: null },
          include: { project: true, site: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneEmployee(id: string, companyId: string) {
    const employee = await this.prisma.employee.findFirst({
      where: { id, companyId, deletedAt: null },
      include: {
        site: true,
        assignments: {
          where: { deletedAt: null },
          include: { project: true, site: true },
          orderBy: { startDate: 'desc' },
        },
        attendance: {
          where: { deletedAt: null },
          include: { project: true, site: true },
          orderBy: { attendanceDate: 'desc' },
          take: 30,
        },
        leaveRequests: {
          where: { deletedAt: null },
          orderBy: { startDate: 'desc' },
        },
        currentMachines: {
          where: { deletedAt: null },
        },
        fuelRequests: {
          where: { deletedAt: null },
          orderBy: { requestDate: 'desc' },
          take: 10,
        },
        fuelLogs: {
          where: { deletedAt: null },
          orderBy: { usageDate: 'desc' },
          take: 10,
        },
      },
    });

    if (!employee) throw new NotFoundException('Employee record not found');
    return employee;
  }

  async updateEmployee(id: string, companyId: string, userId: string, dto: UpdateEmployeeDto) {
    await this.findOneEmployee(id, companyId);

    if (dto.siteId) {
      const site = await this.prisma.site.findFirst({
        where: { id: dto.siteId, companyId, deletedAt: null },
      });
      if (!site) throw new BadRequestException('Associated site not found');
    }

    return this.prisma.employee.update({
      where: { id },
      data: {
        updatedById: userId,
        ...(dto.employeeCode !== undefined && { employeeCode: dto.employeeCode }),
        ...(dto.firstName !== undefined && { firstName: dto.firstName }),
        ...(dto.middleName !== undefined && { middleName: dto.middleName }),
        ...(dto.lastName !== undefined && { lastName: dto.lastName }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.email !== undefined && { email: dto.email }),
        ...(dto.gender !== undefined && { gender: dto.gender }),
        ...(dto.dateOfBirth !== undefined && { dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null }),
        ...(dto.nationalIdNumber !== undefined && { nationalIdNumber: dto.nationalIdNumber }),
        ...(dto.position !== undefined && { position: dto.position, role: dto.position }),
        ...(dto.department !== undefined && { department: dto.department }),
        ...(dto.employmentType !== undefined && { employmentType: dto.employmentType }),
        ...(dto.employmentStatus !== undefined && { employmentStatus: dto.employmentStatus }),
        ...(dto.hireDate !== undefined && { hireDate: new Date(dto.hireDate) }),
        ...(dto.terminationDate !== undefined && { terminationDate: dto.terminationDate ? new Date(dto.terminationDate) : null }),
        ...(dto.dailyRate !== undefined && { dailyRate: dto.dailyRate }),
        ...(dto.monthlySalary !== undefined && { monthlySalary: dto.monthlySalary }),
        ...(dto.emergencyContactName !== undefined && { emergencyContactName: dto.emergencyContactName }),
        ...(dto.emergencyContactPhone !== undefined && { emergencyContactPhone: dto.emergencyContactPhone }),
        ...(dto.address !== undefined && { address: dto.address }),
        ...(dto.documentUrl !== undefined && { documentUrl: dto.documentUrl }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
        ...(dto.siteId !== undefined && { siteId: dto.siteId || null }),
      },
      include: { site: true },
    });
  }

  async removeEmployee(id: string, companyId: string) {
    await this.findOneEmployee(id, companyId);
    return this.prisma.employee.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // ==================== EMPLOYEE ASSIGNMENTS ====================

  async createAssignment(companyId: string, userId: string, dto: CreateEmployeeAssignmentDto) {
    const employee = await this.prisma.employee.findFirst({
      where: { id: dto.employeeId, companyId, deletedAt: null },
    });
    if (!employee) throw new NotFoundException('Employee not found in company');

    const project = await this.prisma.project.findFirst({
      where: { id: dto.projectId, companyId, deletedAt: null },
    });
    if (!project) throw new BadRequestException('Project not found in company');

    const site = await this.prisma.site.findFirst({
      where: { id: dto.siteId, companyId, projectId: dto.projectId, deletedAt: null },
    });
    if (!site) throw new BadRequestException('Site does not belong to the selected project');

    if (dto.endDate && new Date(dto.endDate) < new Date(dto.startDate)) {
      throw new BadRequestException('Assignment end date cannot be before start date');
    }

    return this.prisma.employeeAssignment.create({
      data: {
        companyId,
        employeeId: dto.employeeId,
        projectId: dto.projectId,
        siteId: dto.siteId,
        assignedById: userId,
        positionOnSite: dto.positionOnSite || employee.position,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        status: dto.status || 'Active',
        notes: dto.notes,
      },
      include: {
        employee: true,
        project: true,
        site: true,
        assignedBy: true,
      },
    });
  }

  async findAllAssignments(
    companyId: string,
    filters?: { employeeId?: string; projectId?: string; siteId?: string; status?: string },
  ) {
    const where: any = { companyId, deletedAt: null };
    if (filters?.employeeId) where.employeeId = filters.employeeId;
    if (filters?.projectId && filters.projectId !== 'ALL') where.projectId = filters.projectId;
    if (filters?.siteId && filters.siteId !== 'ALL') where.siteId = filters.siteId;
    if (filters?.status && filters.status !== 'ALL') where.status = filters.status;

    return this.prisma.employeeAssignment.findMany({
      where,
      include: {
        employee: true,
        project: true,
        site: true,
        assignedBy: true,
      },
      orderBy: { startDate: 'desc' },
    });
  }

  async findOneAssignment(id: string, companyId: string) {
    const assignment = await this.prisma.employeeAssignment.findFirst({
      where: { id, companyId, deletedAt: null },
      include: {
        employee: true,
        project: true,
        site: true,
        assignedBy: true,
      },
    });
    if (!assignment) throw new NotFoundException('Employee assignment not found');
    return assignment;
  }

  async updateAssignment(id: string, companyId: string, userId: string, dto: UpdateEmployeeAssignmentDto) {
    const assignment = await this.findOneAssignment(id, companyId);

    const startDate = dto.startDate ? new Date(dto.startDate) : assignment.startDate;
    const endDate = dto.endDate ? new Date(dto.endDate) : assignment.endDate;

    if (endDate && endDate < startDate) {
      throw new BadRequestException('End date cannot be before start date');
    }

    return this.prisma.employeeAssignment.update({
      where: { id },
      data: {
        ...(dto.positionOnSite !== undefined && { positionOnSite: dto.positionOnSite }),
        ...(dto.startDate !== undefined && { startDate: new Date(dto.startDate) }),
        ...(dto.endDate !== undefined && { endDate: dto.endDate ? new Date(dto.endDate) : null }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
      include: {
        employee: true,
        project: true,
        site: true,
        assignedBy: true,
      },
    });
  }

  async removeAssignment(id: string, companyId: string) {
    await this.findOneAssignment(id, companyId);
    return this.prisma.employeeAssignment.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // ==================== ATTENDANCE ====================

  async createAttendance(companyId: string, userId: string, dto: CreateAttendanceDto) {
    const employee = await this.prisma.employee.findFirst({
      where: { id: dto.employeeId, companyId, deletedAt: null },
    });
    if (!employee) throw new NotFoundException('Employee not found in company');

    const project = await this.prisma.project.findFirst({
      where: { id: dto.projectId, companyId, deletedAt: null },
    });
    if (!project) throw new BadRequestException('Project not found in company');

    const site = await this.prisma.site.findFirst({
      where: { id: dto.siteId, companyId, projectId: dto.projectId, deletedAt: null },
    });
    if (!site) throw new BadRequestException('Site does not belong to the selected project');

    if (dto.checkInTime && dto.checkOutTime) {
      if (new Date(dto.checkOutTime) < new Date(dto.checkInTime)) {
        throw new BadRequestException('Check-out time cannot be before check-in time');
      }
    }

    const attDate = new Date(dto.attendanceDate);
    const startOfDay = new Date(attDate.getFullYear(), attDate.getMonth(), attDate.getDate());
    const endOfDay = new Date(attDate.getFullYear(), attDate.getMonth(), attDate.getDate(), 23, 59, 59);

    const existing = await this.prisma.attendance.findFirst({
      where: {
        companyId,
        employeeId: dto.employeeId,
        projectId: dto.projectId,
        siteId: dto.siteId,
        attendanceDate: { gte: startOfDay, lte: endOfDay },
        deletedAt: null,
      },
    });

    if (existing) {
      throw new BadRequestException(`Duplicate attendance record for ${employee.firstName} ${employee.lastName} on ${attDate.toLocaleDateString()}`);
    }

    return this.prisma.attendance.create({
      data: {
        companyId,
        employeeId: dto.employeeId,
        projectId: dto.projectId,
        siteId: dto.siteId,
        attendanceDate: attDate,
        date: attDate,
        status: dto.status,
        checkInTime: dto.checkInTime ? new Date(dto.checkInTime) : null,
        checkOutTime: dto.checkOutTime ? new Date(dto.checkOutTime) : null,
        regularHours: dto.regularHours ?? 8.0,
        overtimeHours: dto.overtimeHours ?? 0.0,
        recordedById: userId,
        notes: dto.notes,
        remarks: dto.notes,
      },
      include: {
        employee: true,
        project: true,
        site: true,
        recordedBy: true,
      },
    });
  }

  async findAllAttendance(
    companyId: string,
    filters?: {
      search?: string;
      employeeId?: string;
      projectId?: string;
      siteId?: string;
      status?: string;
      startDate?: string;
      endDate?: string;
    },
  ) {
    const where: any = { companyId, deletedAt: null };
    if (filters?.employeeId) where.employeeId = filters.employeeId;
    if (filters?.projectId && filters.projectId !== 'ALL') where.projectId = filters.projectId;
    if (filters?.siteId && filters.siteId !== 'ALL') where.siteId = filters.siteId;
    if (filters?.status && filters.status !== 'ALL') where.status = filters.status;

    if (filters?.startDate || filters?.endDate) {
      where.attendanceDate = {};
      if (filters.startDate) where.attendanceDate.gte = new Date(filters.startDate);
      if (filters.endDate) where.attendanceDate.lte = new Date(filters.endDate);
    }

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      where.employee = {
        OR: [
          { firstName: { contains: q, mode: 'insensitive' } },
          { lastName: { contains: q, mode: 'insensitive' } },
          { employeeCode: { contains: q, mode: 'insensitive' } },
        ],
      };
    }

    return this.prisma.attendance.findMany({
      where,
      include: {
        employee: true,
        project: true,
        site: true,
        recordedBy: true,
        approvedBy: true,
      },
      orderBy: { attendanceDate: 'desc' },
    });
  }

  async findOneAttendance(id: string, companyId: string) {
    const att = await this.prisma.attendance.findFirst({
      where: { id, companyId, deletedAt: null },
      include: {
        employee: true,
        project: true,
        site: true,
        recordedBy: true,
        approvedBy: true,
      },
    });
    if (!att) throw new NotFoundException('Attendance record not found');
    return att;
  }

  async updateAttendance(id: string, companyId: string, userId: string, dto: UpdateAttendanceDto) {
    const att = await this.findOneAttendance(id, companyId);

    const inTime = dto.checkInTime ? new Date(dto.checkInTime) : att.checkInTime;
    const outTime = dto.checkOutTime ? new Date(dto.checkOutTime) : att.checkOutTime;

    if (inTime && outTime && outTime < inTime) {
      throw new BadRequestException('Check-out time cannot be before check-in time');
    }

    return this.prisma.attendance.update({
      where: { id },
      data: {
        updatedById: userId,
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.checkInTime !== undefined && { checkInTime: dto.checkInTime ? new Date(dto.checkInTime) : null }),
        ...(dto.checkOutTime !== undefined && { checkOutTime: dto.checkOutTime ? new Date(dto.checkOutTime) : null }),
        ...(dto.regularHours !== undefined && { regularHours: dto.regularHours }),
        ...(dto.overtimeHours !== undefined && { overtimeHours: dto.overtimeHours }),
        ...(dto.notes !== undefined && { notes: dto.notes, remarks: dto.notes }),
      },
      include: {
        employee: true,
        project: true,
        site: true,
        recordedBy: true,
        approvedBy: true,
      },
    });
  }

  async removeAttendance(id: string, companyId: string) {
    await this.findOneAttendance(id, companyId);
    return this.prisma.attendance.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // ==================== LEAVE REQUESTS ====================

  async createLeaveRequest(companyId: string, userId: string, dto: CreateLeaveRequestDto) {
    const employee = await this.prisma.employee.findFirst({
      where: { id: dto.employeeId, companyId, deletedAt: null },
    });
    if (!employee) throw new NotFoundException('Employee not found in company');

    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);
    if (end < start) {
      throw new BadRequestException('Leave end date cannot be before start date');
    }

    const calculatedDays = dto.totalDays || Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (86400000)) + 1);

    return this.prisma.leaveRequest.create({
      data: {
        companyId,
        employeeId: dto.employeeId,
        requestedById: userId,
        leaveType: dto.leaveType,
        startDate: start,
        endDate: end,
        totalDays: calculatedDays,
        status: 'Pending',
        reason: dto.reason,
      },
      include: {
        employee: true,
        requestedBy: true,
      },
    });
  }

  async findAllLeaveRequests(
    companyId: string,
    filters?: { employeeId?: string; status?: string; leaveType?: string },
  ) {
    const where: any = { companyId, deletedAt: null };
    if (filters?.employeeId) where.employeeId = filters.employeeId;
    if (filters?.status && filters.status !== 'ALL') where.status = filters.status;
    if (filters?.leaveType && filters.leaveType !== 'ALL') where.leaveType = filters.leaveType;

    return this.prisma.leaveRequest.findMany({
      where,
      include: {
        employee: true,
        requestedBy: true,
        approvedBy: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneLeaveRequest(id: string, companyId: string) {
    const leave = await this.prisma.leaveRequest.findFirst({
      where: { id, companyId, deletedAt: null },
      include: {
        employee: true,
        requestedBy: true,
        approvedBy: true,
      },
    });
    if (!leave) throw new NotFoundException('Leave request not found');
    return leave;
  }

  async approveLeaveRequest(id: string, companyId: string, userId: string, dto: ApproveLeaveRequestDto) {
    const leave = await this.findOneLeaveRequest(id, companyId);
    if (leave.status !== 'Pending') {
      throw new BadRequestException(`Cannot approve leave request in ${leave.status} state`);
    }

    // Update leave request status to Approved
    const updatedLeave = await this.prisma.leaveRequest.update({
      where: { id },
      data: {
        status: 'Approved',
        approvedById: userId,
      },
      include: {
        employee: true,
        requestedBy: true,
        approvedBy: true,
      },
    });

    // Automatically update employee employmentStatus to 'On Leave' if active
    await this.prisma.employee.update({
      where: { id: leave.employeeId },
      data: { employmentStatus: 'On Leave' },
    });

    return updatedLeave;
  }

  async rejectLeaveRequest(id: string, companyId: string, userId: string, dto: RejectLeaveRequestDto) {
    const leave = await this.findOneLeaveRequest(id, companyId);
    if (leave.status !== 'Pending') {
      throw new BadRequestException(`Cannot reject leave request in ${leave.status} state`);
    }

    return this.prisma.leaveRequest.update({
      where: { id },
      data: {
        status: 'Rejected',
        approvedById: userId,
        rejectionReason: dto.rejectionReason,
      },
      include: {
        employee: true,
        requestedBy: true,
        approvedBy: true,
      },
    });
  }

  async removeLeaveRequest(id: string, companyId: string) {
    await this.findOneLeaveRequest(id, companyId);
    return this.prisma.leaveRequest.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // ==================== HR REPORTS ====================

  async getSummaryReport(companyId: string) {
    const totalEmployees = await this.prisma.employee.count({
      where: { companyId, deletedAt: null },
    });

    const activeEmployees = await this.prisma.employee.count({
      where: { companyId, employmentStatus: 'Active', deletedAt: null },
    });

    const onLeaveEmployees = await this.prisma.employee.count({
      where: { companyId, employmentStatus: 'On Leave', deletedAt: null },
    });

    // Today's Attendance breakdown
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    const todayAttendance = await this.prisma.attendance.findMany({
      where: {
        companyId,
        attendanceDate: { gte: startOfDay, lte: endOfDay },
        deletedAt: null,
      },
    });

    const presentToday = todayAttendance.filter((a) => ['Present', 'PRESENT'].includes(a.status)).length;
    const absentToday = todayAttendance.filter((a) => ['Absent', 'ABSENT'].includes(a.status)).length;
    const lateToday = todayAttendance.filter((a) => ['Late', 'LATE'].includes(a.status)).length;

    // Overtime this week
    const oneWeekAgo = new Date(Date.now() - 7 * 86400000);
    const weeklyAttendance = await this.prisma.attendance.findMany({
      where: {
        companyId,
        attendanceDate: { gte: oneWeekAgo },
        deletedAt: null,
      },
    });
    const overtimeHoursThisWeek = weeklyAttendance.reduce((acc, a) => acc + (a.overtimeHours || 0), 0);

    // Pending Leave Requests
    const pendingLeaveCount = await this.prisma.leaveRequest.count({
      where: { companyId, status: 'Pending', deletedAt: null },
    });

    // Employees by position
    const employees = await this.prisma.employee.findMany({
      where: { companyId, deletedAt: null },
      select: { position: true, employmentType: true },
    });

    const posMap: Record<string, number> = {};
    const typeMap: Record<string, number> = {};
    employees.forEach((e) => {
      posMap[e.position] = (posMap[e.position] || 0) + 1;
      typeMap[e.employmentType] = (typeMap[e.employmentType] || 0) + 1;
    });

    return {
      kpis: {
        totalEmployees,
        activeEmployees,
        onLeaveEmployees,
        presentToday,
        absentToday,
        lateToday,
        overtimeHoursThisWeek,
        pendingLeaveRequests: pendingLeaveCount,
      },
      employeesByPosition: Object.entries(posMap).map(([position, count]) => ({ position, count })),
      employeesByEmploymentType: Object.entries(typeMap).map(([type, count]) => ({ type, count })),
    };
  }

  async getByProjectReport(companyId: string) {
    const projects = await this.prisma.project.findMany({
      where: { companyId, deletedAt: null },
      include: {
        employeeAssignments: {
          where: { status: 'Active', deletedAt: null },
          include: { employee: true },
        },
      },
    });

    return projects.map((p) => ({
      projectId: p.id,
      projectName: p.projectName,
      activeWorkerCount: p.employeeAssignments.length,
      employees: p.employeeAssignments.map((a) => ({
        id: a.employee.id,
        name: `${a.employee.firstName} ${a.employee.lastName}`,
        position: a.positionOnSite || a.employee.position,
      })),
    }));
  }

  async getBySiteReport(companyId: string) {
    const sites = await this.prisma.site.findMany({
      where: { companyId, deletedAt: null },
      include: {
        project: true,
        employeeAssignments: {
          where: { status: 'Active', deletedAt: null },
          include: { employee: true },
        },
      },
    });

    return sites.map((s) => ({
      siteId: s.id,
      siteName: s.siteName,
      projectName: s.project?.projectName,
      activeWorkerCount: s.employeeAssignments.length,
      employees: s.employeeAssignments.map((a) => ({
        id: a.employee.id,
        name: `${a.employee.firstName} ${a.employee.lastName}`,
        position: a.positionOnSite || a.employee.position,
      })),
    }));
  }

  async getAttendanceReport(companyId: string) {
    const last30Days = new Date(Date.now() - 30 * 86400000);
    return this.prisma.attendance.findMany({
      where: {
        companyId,
        attendanceDate: { gte: last30Days },
        deletedAt: null,
      },
      include: {
        employee: true,
        project: true,
        site: true,
      },
      orderBy: { attendanceDate: 'desc' },
    });
  }

  async getOperatorsReport(companyId: string) {
    const operators = await this.prisma.employee.findMany({
      where: {
        companyId,
        position: { in: ['Machine Operator', 'Driver', 'Fleet Manager', 'OPERATOR'] },
        deletedAt: null,
      },
      include: {
        currentMachines: true,
        fuelRequests: {
          where: { deletedAt: null },
          take: 5,
        },
        fuelLogs: {
          where: { deletedAt: null },
          take: 5,
        },
      },
    });

    return operators.map((op) => ({
      id: op.id,
      operatorName: `${op.firstName} ${op.lastName}`,
      phone: op.phone,
      position: op.position,
      status: op.employmentStatus,
      assignedMachines: op.currentMachines.map((m) => `${m.brand} ${m.model} (${m.plateNumber || 'No Plate'})`),
      recentFuelLogsCount: op.fuelLogs.length,
    }));
  }
}
