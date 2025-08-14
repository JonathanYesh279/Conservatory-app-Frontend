// Debug script to investigate teacher-student data inconsistency
// Run this in browser console on any page where studentService is available

const TEACHER_ID = "688136c194c6cd56db965db9"; // מאיה איצקוביץ'
const STUDENT_FROM_SCHEDULE = "68813849abdf329e8afc2645";

async function investigateTeacherStudentInconsistency() {
  console.log("🔍 Investigating teacher-student data inconsistency...");
  console.log("Teacher ID:", TEACHER_ID);
  
  try {
    // Get all students
    console.log("\n📊 Loading all students...");
    const allStudents = await studentService.getStudents();
    console.log(`Total students in database: ${allStudents.length}`);
    
    // Find students with this teacher in teacherIds
    const studentsWithTeacherInIds = allStudents.filter(student => 
      student.teacherIds && student.teacherIds.includes(TEACHER_ID)
    );
    
    console.log(`\n🎯 Students with teacher in teacherIds array: ${studentsWithTeacherInIds.length}`);
    studentsWithTeacherInIds.forEach(student => {
      console.log(`  - ${student.personalInfo?.fullName} (${student._id})`);
      console.log(`    teacherIds:`, student.teacherIds);
    });
    
    // Find students with this teacher in teacherAssignments
    const studentsWithTeacherAssignments = allStudents.filter(student => 
      student.teacherAssignments && 
      student.teacherAssignments.some(assignment => assignment.teacherId === TEACHER_ID)
    );
    
    console.log(`\n📅 Students with teacher assignments: ${studentsWithTeacherAssignments.length}`);
    studentsWithTeacherAssignments.forEach(student => {
      console.log(`  - ${student.personalInfo?.fullName} (${student._id})`);
      const assignments = student.teacherAssignments.filter(a => a.teacherId === TEACHER_ID);
      assignments.forEach(assignment => {
        console.log(`    Assignment: ${assignment.day} ${assignment.time} (${assignment.duration}min)`);
        console.log(`    Schedule Slot ID: ${assignment.scheduleSlotId}`);
        console.log(`    Active: ${assignment.isActive}`);
      });
    });
    
    // Check the specific student from teacher's schedule
    console.log(`\n🔍 Checking specific student from schedule: ${STUDENT_FROM_SCHEDULE}`);
    try {
      const specificStudent = await studentService.getStudentById(STUDENT_FROM_SCHEDULE);
      if (specificStudent) {
        console.log(`Found student: ${specificStudent.personalInfo?.fullName}`);
        console.log(`  teacherIds:`, specificStudent.teacherIds);
        console.log(`  teacherAssignments:`, specificStudent.teacherAssignments);
        
        // Check if this student has our teacher
        const hasTeacherInIds = specificStudent.teacherIds && specificStudent.teacherIds.includes(TEACHER_ID);
        const hasTeacherAssignments = specificStudent.teacherAssignments && 
          specificStudent.teacherAssignments.some(a => a.teacherId === TEACHER_ID);
        
        console.log(`  Has teacher in teacherIds: ${hasTeacherInIds}`);
        console.log(`  Has teacher assignments: ${hasTeacherAssignments}`);
      }
    } catch (err) {
      console.log(`❌ Student ${STUDENT_FROM_SCHEDULE} not found:`, err.message);
    }
    
    // Combined results (as per TeacherDetails logic)
    const allStudentsWithTeacher = allStudents.filter(student => {
      const hasTeacherInIds = student.teacherIds && student.teacherIds.includes(TEACHER_ID);
      const hasTeacherAssignments = student.teacherAssignments && 
        student.teacherAssignments.some(assignment => assignment.teacherId === TEACHER_ID);
      return hasTeacherInIds || hasTeacherAssignments;
    });
    
    console.log(`\n📋 SUMMARY:`);
    console.log(`Total students found with this teacher: ${allStudentsWithTeacher.length}`);
    console.log(`Students with teacherIds: ${studentsWithTeacherInIds.length}`);
    console.log(`Students with teacherAssignments: ${studentsWithTeacherAssignments.length}`);
    
    console.log(`\n🔧 DATA INCONSISTENCY ANALYSIS:`);
    console.log(`❌ Teacher document: studentIds = [] (EMPTY)`);
    console.log(`✅ Student documents: ${allStudentsWithTeacher.length} students have this teacher`);
    console.log(`⚠️  Schedule array: Has 1 student but student not in studentIds`);
    
    console.log(`\n👥 Students that should be in teacher's studentIds array:`);
    allStudentsWithTeacher.forEach(student => {
      console.log(`  - ADD: "${student._id}" // ${student.personalInfo?.fullName}`);
    });
    
    return {
      totalStudentsWithTeacher: allStudentsWithTeacher.length,
      studentsWithTeacherInIds: studentsWithTeacherInIds,
      studentsWithTeacherAssignments: studentsWithTeacherAssignments,
      allStudentsWithTeacher: allStudentsWithTeacher
    };
    
  } catch (error) {
    console.error("❌ Error during investigation:", error);
    return null;
  }
}

// Auto-run the investigation
investigateTeacherStudentInconsistency();