// Debug queries to find students with teacher ID: 688136c194c6cd56db965db9
// מאיה איצקוביץ'

const TEACHER_ID = "688136c194c6cd56db965db9";
const SPECIFIC_STUDENT_ID = "68813849abdf329e8afc2645";

// Import the student service
import { studentService } from './services/studentService';

/**
 * Query 1: Find students who have this teacherId in their teacherIds array
 */
export async function findStudentsWithTeacherInIds() {
  console.log(`🔍 Searching for students with teacherId ${TEACHER_ID} in teacherIds array...`);
  
  try {
    // Get all students
    const allStudents = await studentService.getStudents();
    
    // Filter students who have this teacher ID in their teacherIds array
    const studentsWithTeacherId = allStudents.filter(student => 
      student.teacherIds && student.teacherIds.includes(TEACHER_ID)
    );
    
    console.log(`Found ${studentsWithTeacherId.length} students with teacherId in teacherIds array:`);
    
    studentsWithTeacherId.forEach(student => {
      console.log(`- Student: ${student.personalInfo.fullName} (ID: ${student._id})`);
      console.log(`  TeacherIds: ${student.teacherIds.join(', ')}`);
      console.log(`  Active: ${student.isActive}`);
      console.log('---');
    });
    
    return studentsWithTeacherId;
    
  } catch (error) {
    console.error('Error finding students with teacherId:', error);
    return [];
  }
}

/**
 * Query 2: Find students who have this teacherId in their teacherAssignments
 */
export async function findStudentsWithTeacherInAssignments() {
  console.log(`🔍 Searching for students with teacherId ${TEACHER_ID} in teacherAssignments...`);
  
  try {
    // Get all students
    const allStudents = await studentService.getStudents();
    
    // Filter students who have this teacher ID in their teacherAssignments
    const studentsWithTeacherAssignment = allStudents.filter(student => 
      student.teacherAssignments && 
      student.teacherAssignments.some(assignment => assignment.teacherId === TEACHER_ID)
    );
    
    console.log(`Found ${studentsWithTeacherAssignment.length} students with teacherId in teacherAssignments:`);
    
    studentsWithTeacherAssignment.forEach(student => {
      console.log(`- Student: ${student.personalInfo.fullName} (ID: ${student._id})`);
      
      // Show the specific assignments with this teacher
      const relevantAssignments = student.teacherAssignments.filter(
        assignment => assignment.teacherId === TEACHER_ID
      );
      
      relevantAssignments.forEach(assignment => {
        console.log(`  Assignment: ${assignment.day} at ${assignment.time} (${assignment.duration} min)`);
        console.log(`  Schedule Slot ID: ${assignment.scheduleSlotId}`);
        console.log(`  Active: ${assignment.isActive !== false}`);
        console.log(`  Location: ${assignment.location || 'Not specified'}`);
      });
      
      console.log('---');
    });
    
    return studentsWithTeacherAssignment;
    
  } catch (error) {
    console.error('Error finding students with teacher assignments:', error);
    return [];
  }
}

/**
 * Query 3: Check specific student and show all their data
 */
export async function checkSpecificStudent() {
  console.log(`🔍 Checking specific student ID: ${SPECIFIC_STUDENT_ID}...`);
  
  try {
    const student = await studentService.getStudentById(SPECIFIC_STUDENT_ID);
    
    console.log('Student found:');
    console.log(`Name: ${student.personalInfo.fullName}`);
    console.log(`ID: ${student._id}`);
    console.log(`Active: ${student.isActive}`);
    console.log(`Instrument: ${student.academicInfo.instrument || 'Not specified'}`);
    console.log(`Class: ${student.academicInfo.class}`);
    
    console.log('\nTeacher IDs:');
    if (student.teacherIds && student.teacherIds.length > 0) {
      student.teacherIds.forEach((teacherId, index) => {
        const isTargetTeacher = teacherId === TEACHER_ID ? ' ⭐ TARGET TEACHER' : '';
        console.log(`  ${index + 1}. ${teacherId}${isTargetTeacher}`);
      });
    } else {
      console.log('  No teacher IDs found');
    }
    
    console.log('\nTeacher Assignments:');
    if (student.teacherAssignments && student.teacherAssignments.length > 0) {
      student.teacherAssignments.forEach((assignment, index) => {
        const isTargetTeacher = assignment.teacherId === TEACHER_ID ? ' ⭐ TARGET TEACHER' : '';
        console.log(`  ${index + 1}. Teacher ID: ${assignment.teacherId}${isTargetTeacher}`);
        console.log(`     Day: ${assignment.day}, Time: ${assignment.time}`);
        console.log(`     Duration: ${assignment.duration} min`);
        console.log(`     Schedule Slot ID: ${assignment.scheduleSlotId}`);
        console.log(`     Active: ${assignment.isActive !== false}`);
        console.log(`     Location: ${assignment.location || 'Not specified'}`);
      });
    } else {
      console.log('  No teacher assignments found');
    }
    
    console.log('\nOrchestra Enrollments:');
    if (student.enrollments.orchestraIds && student.enrollments.orchestraIds.length > 0) {
      console.log(`  ${student.enrollments.orchestraIds.join(', ')}`);
    } else {
      console.log('  No orchestra enrollments');
    }
    
    return student;
    
  } catch (error) {
    console.error('Error checking specific student:', error);
    if (error.message.includes('404')) {
      console.log('Student not found - may have been deleted or ID is incorrect');
    }
    return null;
  }
}

/**
 * Query 4: Use the service's built-in method to get students by teacher ID
 */
export async function getStudentsByTeacherService() {
  console.log(`🔍 Using studentService.getStudentsByTeacherId for teacher ${TEACHER_ID}...`);
  
  try {
    const students = await studentService.getStudentsByTeacherId(TEACHER_ID);
    
    console.log(`Service returned ${students.length} students:`);
    
    students.forEach(student => {
      console.log(`- ${student.personalInfo.fullName} (ID: ${student._id})`);
      console.log(`  Active: ${student.isActive}`);
      console.log(`  Instrument: ${student.academicInfo.instrument || 'Not specified'}`);
    });
    
    return students;
    
  } catch (error) {
    console.error('Error using getStudentsByTeacherId service:', error);
    return [];
  }
}

/**
 * Master function to run all queries
 */
export async function runAllTeacherStudentQueries() {
  console.log('🚀 Running all queries to find students with teacher מאיה איצקוביץ\'...');
  console.log('='.repeat(80));
  
  const results = {
    studentsWithTeacherIds: await findStudentsWithTeacherInIds(),
    studentsWithAssignments: await findStudentsWithTeacherInAssignments(), 
    specificStudent: await checkSpecificStudent(),
    serviceResults: await getStudentsByTeacherService()
  };
  
  console.log('\n📊 SUMMARY:');
  console.log(`Students with teacher in teacherIds array: ${results.studentsWithTeacherIds.length}`);
  console.log(`Students with teacher in assignments: ${results.studentsWithAssignments.length}`);
  console.log(`Specific student exists: ${results.specificStudent ? 'Yes' : 'No'}`);
  console.log(`Service method returned: ${results.serviceResults.length} students`);
  
  // Check for discrepancies
  const allFoundStudents = new Set([
    ...results.studentsWithTeacherIds.map(s => s._id),
    ...results.studentsWithAssignments.map(s => s._id),
    ...results.serviceResults.map(s => s._id)
  ]);
  
  console.log(`\nTotal unique students found across all methods: ${allFoundStudents.size}`);
  
  return results;
}

// Console-friendly version for direct execution
window.debugTeacherStudents = {
  findStudentsWithTeacherInIds,
  findStudentsWithTeacherInAssignments,
  checkSpecificStudent,
  getStudentsByTeacherService,
  runAllTeacherStudentQueries,
  TEACHER_ID,
  SPECIFIC_STUDENT_ID
};

console.log('Debug functions loaded! Available in window.debugTeacherStudents');
console.log('Run: window.debugTeacherStudents.runAllTeacherStudentQueries()');