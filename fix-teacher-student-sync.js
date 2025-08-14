// Fix script for teacher-student data synchronization
// This fixes the inconsistency where students have teacher assignments but teacher's studentIds is empty

const TEACHER_ID = "688136c194c6cd56db965db9"; // מאיה איצקוביץ'

async function fixTeacherStudentSync() {
  console.log("🔧 Starting teacher-student data synchronization...");
  console.log("Teacher ID:", TEACHER_ID);
  
  try {
    // Step 1: Get the teacher document
    console.log("\n📖 Loading teacher document...");
    const teacher = await teacherService.getTeacherById(TEACHER_ID);
    if (!teacher) {
      console.error("❌ Teacher not found!");
      return false;
    }
    
    console.log(`Found teacher: ${teacher.personalInfo?.fullName}`);
    console.log(`Current studentIds:`, teacher.teaching?.studentIds || []);
    console.log(`Current schedule entries:`, teacher.teaching?.schedule?.length || 0);
    
    // Step 2: Find all students who have this teacher assigned
    console.log("\n🔍 Finding students with this teacher...");
    const allStudents = await studentService.getStudents();
    
    const studentsWithThisTeacher = allStudents.filter(student => {
      const hasTeacherInIds = student.teacherIds && student.teacherIds.includes(TEACHER_ID);
      const hasTeacherAssignments = student.teacherAssignments && 
        student.teacherAssignments.some(assignment => assignment.teacherId === TEACHER_ID);
      return hasTeacherInIds || hasTeacherAssignments;
    });
    
    console.log(`Found ${studentsWithThisTeacher.length} students with this teacher:`);
    studentsWithThisTeacher.forEach(student => {
      console.log(`  - ${student.personalInfo?.fullName} (${student._id})`);
    });
    
    // Step 3: Extract student IDs
    const correctStudentIds = studentsWithThisTeacher.map(student => student._id);
    console.log(`\n📝 Correct studentIds should be:`, correctStudentIds);
    
    // Step 4: Compare with current data
    const currentStudentIds = teacher.teaching?.studentIds || [];
    const currentScheduleStudentIds = (teacher.teaching?.schedule || []).map(s => s.studentId);
    
    console.log(`\n📊 COMPARISON:`);
    console.log(`Current studentIds (${currentStudentIds.length}):`, currentStudentIds);
    console.log(`Students in schedule (${currentScheduleStudentIds.length}):`, currentScheduleStudentIds);
    console.log(`Should be (${correctStudentIds.length}):`, correctStudentIds);
    
    // Check if fix is needed
    const needsFix = JSON.stringify(currentStudentIds.sort()) !== JSON.stringify(correctStudentIds.sort());
    
    if (!needsFix) {
      console.log("✅ Data is already synchronized!");
      return true;
    }
    
    console.log("\n⚠️  Data synchronization needed!");
    
    // Step 5: Prepare the update
    const updatedTeachingData = {
      ...teacher.teaching,
      studentIds: correctStudentIds
    };
    
    // Keep existing schedule but make sure it's consistent
    if (teacher.teaching?.schedule) {
      // Filter schedule to only include students that are in the correct list
      updatedTeachingData.schedule = teacher.teaching.schedule.filter(scheduleItem => 
        correctStudentIds.includes(scheduleItem.studentId)
      );
      
      console.log(`\n📅 Schedule updated: ${teacher.teaching.schedule.length} → ${updatedTeachingData.schedule.length} entries`);
    }
    
    const updateData = {
      _id: TEACHER_ID,
      teaching: updatedTeachingData
    };
    
    console.log(`\n🔄 Preparing to update teacher document:`);
    console.log(`  Adding ${correctStudentIds.length} students to studentIds`);
    console.log(`  Schedule entries: ${updatedTeachingData.schedule?.length || 0}`);
    
    // Step 6: Ask for confirmation (comment out for auto-execution)
    const shouldProceed = confirm(
      `Fix teacher-student sync for ${teacher.personalInfo?.fullName}?\n\n` +
      `This will update studentIds from ${currentStudentIds.length} to ${correctStudentIds.length} students.\n\n` +
      `Students to add: ${correctStudentIds.length}\n` +
      `Schedule entries: ${updatedTeachingData.schedule?.length || 0}\n\n` +
      `Proceed with the fix?`
    );
    
    if (!shouldProceed) {
      console.log("❌ Fix cancelled by user");
      return false;
    }
    
    // Step 7: Execute the fix
    console.log("\n🚀 Executing fix...");
    try {
      const updatedTeacher = await teacherService.updateTeacher(updateData, TEACHER_ID);
      
      console.log("✅ Teacher document updated successfully!");
      console.log(`New studentIds (${updatedTeacher.teaching?.studentIds?.length || 0}):`, 
                  updatedTeacher.teaching?.studentIds);
      
      // Verify the fix
      console.log("\n🔍 Verifying fix...");
      const verifyTeacher = await teacherService.getTeacherById(TEACHER_ID);
      const verifyStudentIds = verifyTeacher.teaching?.studentIds || [];
      
      const isFixed = JSON.stringify(verifyStudentIds.sort()) === JSON.stringify(correctStudentIds.sort());
      
      if (isFixed) {
        console.log("✅ Fix verified successfully!");
        console.log(`Teacher now has ${verifyStudentIds.length} students in studentIds`);
        return true;
      } else {
        console.error("❌ Fix verification failed");
        console.log("Expected:", correctStudentIds.sort());
        console.log("Actual:", verifyStudentIds.sort());
        return false;
      }
      
    } catch (updateError) {
      console.error("❌ Error updating teacher:", updateError);
      return false;
    }
    
  } catch (error) {
    console.error("❌ Error during synchronization:", error);
    return false;
  }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { fixTeacherStudentSync };
}

// Auto-run if executed directly
if (typeof window !== 'undefined') {
  console.log("🔧 Teacher-Student Sync Fix Tool Ready");
  console.log("Run fixTeacherStudentSync() to start the fix process");
}

// Uncomment to auto-run:
// fixTeacherStudentSync();