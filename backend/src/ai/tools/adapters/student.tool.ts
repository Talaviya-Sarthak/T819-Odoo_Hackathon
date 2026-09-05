import type { IntentCategory } from '../../router/intent.types';
import type { AITool } from '../tool.interface';
import type { ToolContext, ToolResult } from '../tool.types';

export interface StudentAcademicRecord {
  enrollmentNo: string;
  name: string;
  department: string;
  semester: number;
  cgpa: number;
  sgpa: number;
  overallAttendancePercentage: number;
  courses: {
    code: string;
    name: string;
    credits: number;
    attendancePercentage: number;
    internalMarks: number;
    maxInternalMarks: number;
    status: 'Pass' | 'Backlog' | 'Enrolled';
  }[];
  feeStatus: {
    totalFee: number;
    paidFee: number;
    dueFee: number;
    status: 'Paid' | 'Partial' | 'Pending';
    dueDate: string;
  };
  examHallTicket: {
    issued: boolean;
    status: string;
    center: string;
  };
}

// Mock database record for demonstration
const SAMPLE_STUDENT_RECORD: StudentAcademicRecord = {
  enrollmentNo: '22DCS045',
  name: 'Aarav Patel',
  department: 'Computer Engineering (DEPSTAR / CSPIT, CHARUSAT)',
  semester: 6,
  cgpa: 8.74,
  sgpa: 8.92,
  overallAttendancePercentage: 84.5,
  courses: [
    { code: 'CE342', name: 'Design and Analysis of Algorithms', credits: 4, attendancePercentage: 88, internalMarks: 27, maxInternalMarks: 30, status: 'Pass' },
    { code: 'CE345', name: 'Artificial Intelligence & Machine Learning', credits: 4, attendancePercentage: 91, internalMarks: 29, maxInternalMarks: 30, status: 'Pass' },
    { code: 'CE348', name: 'Cloud Computing Infrastructure', credits: 3, attendancePercentage: 78, internalMarks: 24, maxInternalMarks: 30, status: 'Pass' },
    { code: 'CE350', name: 'Full Stack Web Development', credits: 4, attendancePercentage: 82, internalMarks: 28, maxInternalMarks: 30, status: 'Pass' },
    { code: 'HS121', name: 'Professional Ethics & Governance', credits: 2, attendancePercentage: 74, internalMarks: 22, maxInternalMarks: 30, status: 'Pass' },
  ],
  feeStatus: {
    totalFee: 65000,
    paidFee: 65000,
    dueFee: 0,
    status: 'Paid',
    dueDate: '2026-03-31',
  },
  examHallTicket: {
    issued: true,
    status: 'Eligible for End-Sem Examinations',
    center: 'CSPIT Building, Lab 304, CHARUSAT Campus',
  },
};

export class StudentRecordsTool implements AITool {
  public readonly id = 'student_records_tool';
  public readonly name = 'CHARUSAT Student Record & Transcript Engine Adapter';
  public readonly description = 'Adapter for looking up student CGPA, course attendance %, internal marks, fee status, and hall tickets.';
  public readonly supportedIntent: IntentCategory = 'student_record';

  public async execute(context: ToolContext): Promise<ToolResult> {
    const startTime = Date.now();
    const query = (context.query || '').toLowerCase();

    const record = SAMPLE_STUDENT_RECORD;

    let specificResult = '';
    if (query.includes('attendance')) {
      specificResult = `Student ${record.name} (${record.enrollmentNo}) has an overall attendance of **${record.overallAttendancePercentage}%**. All courses satisfy the CHARUSAT 75% mandatory threshold except HS121 (74% - warning notice issued).`;
    } else if (query.includes('cgpa') || query.includes('sgpa') || query.includes('grade') || query.includes('mark')) {
      specificResult = `Student ${record.name} (${record.enrollmentNo}) holds a **CGPA of ${record.cgpa}** (Current SGPA: ${record.sgpa}). Total credits earned: 132.`;
    } else if (query.includes('fee')) {
      specificResult = `Fee Status for ${record.name}: **${record.feeStatus.status}** (Paid ₹${record.feeStatus.paidFee.toLocaleString()} / ₹${record.feeStatus.totalFee.toLocaleString()}). No outstanding dues.`;
    } else if (query.includes('hall ticket') || query.includes('exam')) {
      specificResult = `Hall Ticket Status: **${record.examHallTicket.status}**. Exam Center: ${record.examHallTicket.center}.`;
    } else {
      specificResult = `Academic Summary for ${record.name} (${record.enrollmentNo}): CGPA: ${record.cgpa}, Overall Attendance: ${record.overallAttendancePercentage}%, Fee Status: ${record.feeStatus.status}.`;
    }

    return {
      success: true,
      toolId: this.id,
      data: {
        studentRecord: record,
        summary: specificResult,
        query: context.query,
      },
      metadata: {
        executionTimeMs: Date.now() - startTime,
        intent: this.supportedIntent,
        timestamp: new Date().toISOString(),
      },
    };
  }
}
