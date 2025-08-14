// CONSOLE DEBUG SCRIPT - Paste this directly into browser console
// Searches for students with teacher ID: 688136c194c6cd56db965db9 (מאיה איצקוביץ')

(async function debugTeacherStudents() {
  const TEACHER_ID = "688136c194c6cd56db965db9";
  const SPECIFIC_STUDENT_ID = "68813849abdf329e8afc2645";
  
  console.log('🚀 Starting debug investigation for teacher מאיה איצקוביץ\'');
  console.log(`Target Teacher ID: ${TEACHER_ID}`);
  console.log(`Specific Student ID to check: ${SPECIFIC_STUDENT_ID}`);
  console.log('='.repeat(80));
  
  // Assuming studentService is available globally or import it
  let studentService;
  
  try {
    // Try different ways to access the student service
    if (window.studentService) {
      studentService = window.studentService;
    } else if (window.React && window.React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED) {
      // Try to extract from React internals (development only)
      console.log('Trying to access studentService through React app...');
      // This would need to be adapted based on your app structure
    } else {
      console.error('❌ Cannot access studentService. Please run this from within the React app context.');
      return;
    }
  } catch (error) {
    console.error('❌ Error accessing studentService:', error);
    return;
  }
  
  if (!studentService) {
    console.error('❌ studentService not available. You may need to:');
    console.error('1. Navigate to a page where studentService is loaded');
    console.error('2. Import the service in the console first');
    console.error('3. Use the debug-queries.js file instead');
    return;
  }
  
  try {
    // Query 1: Get all students and filter
    console.log('\n🔍 Query 1: Checking all students for teacherId in teacherIds array...');
    const allStudents = await studentService.getStudents();
    console.log(`Total students loaded: ${allStudents.length}`);
    
    const studentsWithTeacherId = allStudents.filter(student => 
      student.teacherIds && student.teacherIds.includes(TEACHER_ID)
    );
    
    console.log(`✅ Found ${studentsWithTeacherId.length} students with teacherId in teacherIds array:`);
    studentsWithTeacherId.forEach(student => {
      console.log(`  - ${student.personalInfo.fullName} (${student._id})`);
      console.log(`    TeacherIds: [${student.teacherIds.join(', ')}]`);
    });
    
    // Query 2: Check teacher assignments
    console.log('\n🔍 Query 2: Checking teacherAssignments...');
    const studentsWithAssignments = allStudents.filter(student => 
      student.teacherAssignments && 
      student.teacherAssignments.some(assignment => assignment.teacherId === TEACHER_ID)
    );
    
    console.log(`✅ Found ${studentsWithAssignments.length} students with teacherId in teacherAssignments:`);
    studentsWithAssignments.forEach(student => {
      console.log(`  - ${student.personalInfo.fullName} (${student._id})`);
      const assignments = student.teacherAssignments.filter(a => a.teacherId === TEACHER_ID);
      assignments.forEach(assignment => {
        console.log(`    Assignment: ${assignment.day} ${assignment.time} (${assignment.duration}min, active: ${assignment.isActive !== false})`);
      });
    });
    
    // Query 3: Check specific student
    console.log('\n🔍 Query 3: Checking specific student...');
    try {
      const specificStudent = await studentService.getStudentById(SPECIFIC_STUDENT_ID);
      console.log(`✅ Specific student found: ${specificStudent.personalInfo.fullName}`);
      console.log(`  ID: ${specificStudent._id}`);
      console.log(`  Active: ${specificStudent.isActive}`);
      console.log(`  TeacherIds: [${specificStudent.teacherIds ? specificStudent.teacherIds.join(', ') : 'none'}]`);
      
      if (specificStudent.teacherIds && specificStudent.teacherIds.includes(TEACHER_ID)) {
        console.log(`  ⭐ This student HAS the target teacher in teacherIds!`);
      }
      
      if (specificStudent.teacherAssignments) {
        const targetAssignments = specificStudent.teacherAssignments.filter(a => a.teacherId === TEACHER_ID);
        if (targetAssignments.length > 0) {
          console.log(`  ⭐ This student HAS ${targetAssignments.length} assignment(s) with the target teacher!`);
          targetAssignments.forEach(assignment => {
            console.log(`    - ${assignment.day} ${assignment.time} (slot: ${assignment.scheduleSlotId})`);
          });
        }
      }
      
    } catch (error) {
      console.error(`❌ Specific student not found: ${error.message}`);
    }
    
    // Query 4: Use service method
    console.log('\n🔍 Query 4: Using getStudentsByTeacherId service method...');
    const serviceResults = await studentService.getStudentsByTeacherId(TEACHER_ID);
    console.log(`✅ Service method returned ${serviceResults.length} students:`);
    serviceResults.forEach(student => {
      console.log(`  - ${student.personalInfo.fullName} (${student._id})`);
    });
    
    // Summary
    console.log('\n📊 SUMMARY REPORT:');
    console.log('='.repeat(50));
    console.log(`Students with teacher in teacherIds: ${studentsWithTeacherId.length}`);
    console.log(`Students with teacher in assignments: ${studentsWithAssignments.length}`);
    console.log(`Service method results: ${serviceResults.length}`);
    
    const allUniqueStudents = new Set([
      ...studentsWithTeacherId.map(s => s._id),
      ...studentsWithAssignments.map(s => s._id),
      ...serviceResults.map(s => s._id)
    ]);
    
    console.log(`Total unique students: ${allUniqueStudents.size}`);
    
    if (allUniqueStudents.size > 0) {
      console.log('\n📝 All student IDs found:');
      Array.from(allUniqueStudents).forEach(id => {
        const student = allStudents.find(s => s._id === id);
        console.log(`  - ${id} (${student ? student.personalInfo.fullName : 'Unknown'})`);
      });
    } else {
      console.log('\n⚠️  No students found with this teacher ID!');
      console.log('This could indicate:');
      console.log('1. The teacher was removed from all students');
      console.log('2. There\'s a data consistency issue');
      console.log('3. The teacher ID might be incorrect');
    }
    
    return {
      teacherId: TEACHER_ID,
      studentsWithTeacherId,
      studentsWithAssignments,
      serviceResults,
      allUniqueStudents: Array.from(allUniqueStudents)
    };
    
  } catch (error) {
    console.error('❌ Error during investigation:', error);
  }
})();

console.log('🎯 Teacher-Student Debug Script loaded!');
console.log('The script will run automatically, or you can call debugTeacherStudents() again.');