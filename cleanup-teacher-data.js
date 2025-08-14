// Cleanup script to remove teacher from student documents
// This removes the old/corrupted data while keeping the logic intact
// Run this in browser console

const TEACHER_ID = "688136c194c6cd56db965db9"; // מאיה איצקוביץ'

async function cleanupTeacherStudentData() {
  console.log("🧹 Starting cleanup of teacher-student data...");
  console.log("Teacher ID to remove:", TEACHER_ID);
  
  try {
    // Get all students
    console.log("\n📊 Loading all students...");
    const response = await fetch('/api/student');
    const allStudents = await response.json();
    console.log(`Total students in database: ${allStudents.length}`);
    
    // Find students with this teacher
    const studentsWithTeacher = allStudents.filter(student => {
      const hasInIds = student.teacherIds && student.teacherIds.includes(TEACHER_ID);
      const hasInAssignments = student.teacherAssignments && 
        student.teacherAssignments.some(assignment => assignment.teacherId === TEACHER_ID);
      return hasInIds || hasInAssignments;
    });
    
    console.log(`\n🎯 Found ${studentsWithTeacher.length} students to clean up:`);
    studentsWithTeacher.forEach(student => {
      console.log(`  - ${student.personalInfo?.fullName} (${student._id})`);
    });
    
    if (studentsWithTeacher.length === 0) {
      console.log("✅ No cleanup needed - no students have this teacher");
      return;
    }
    
    // Confirm cleanup
    const shouldProceed = confirm(
      `Clean up ${studentsWithTeacher.length} students?\n\n` +
      `This will REMOVE teacher "${TEACHER_ID}" from:\n` +
      `- Student teacherIds arrays\n` +
      `- Student teacherAssignments\n\n` +
      studentsWithTeacher.map(s => `• ${s.personalInfo?.fullName}`).join('\n') +
      `\n\nProceed with cleanup?`
    );
    
    if (!shouldProceed) {
      console.log("❌ Cleanup cancelled by user");
      return;
    }
    
    console.log("\n🧹 Starting student cleanup...");
    
    let successCount = 0;
    let errorCount = 0;
    
    // Clean up each student
    for (const student of studentsWithTeacher) {
      try {
        console.log(`\n🔄 Cleaning student: ${student.personalInfo?.fullName}`);
        
        // Remove teacher from teacherIds
        let updatedTeacherIds = student.teacherIds || [];
        if (updatedTeacherIds.includes(TEACHER_ID)) {
          updatedTeacherIds = updatedTeacherIds.filter(id => id !== TEACHER_ID);
          console.log(`  - Removed from teacherIds: ${student.teacherIds.length} → ${updatedTeacherIds.length}`);
        }
        
        // Remove teacher assignments
        let updatedAssignments = student.teacherAssignments || [];
        const originalAssignmentCount = updatedAssignments.length;
        updatedAssignments = updatedAssignments.filter(assignment => assignment.teacherId !== TEACHER_ID);
        
        if (originalAssignmentCount !== updatedAssignments.length) {
          console.log(`  - Removed assignments: ${originalAssignmentCount} → ${updatedAssignments.length}`);
        }
        
        // Prepare update payload
        const updatePayload = {
          _id: student._id,
          teacherIds: updatedTeacherIds,
          teacherAssignments: updatedAssignments
        };
        
        console.log(`  - Updating student document...`);
        
        // Update student
        const updateResponse = await fetch(`/api/student/${student._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatePayload)
        });
        
        if (!updateResponse.ok) {
          throw new Error(`Update failed: ${updateResponse.status}`);
        }
        
        console.log(`  ✅ Student cleaned successfully`);
        successCount++;
        
      } catch (error) {
        console.error(`  ❌ Failed to clean student ${student.personalInfo?.fullName}:`, error);
        errorCount++;
      }
    }
    
    console.log(`\n📊 Student cleanup complete:`);
    console.log(`  ✅ Success: ${successCount} students`);
    console.log(`  ❌ Errors: ${errorCount} students`);
    
    // Now clean up teacher's schedule
    console.log(`\n🔄 Cleaning teacher's schedule...`);
    
    try {
      const teacherResponse = await fetch(`/api/teacher/${TEACHER_ID}`);
      const teacher = await teacherResponse.json();
      
      console.log(`Teacher: ${teacher.personalInfo?.fullName}`);
      console.log(`Current schedule entries: ${teacher.teaching?.schedule?.length || 0}`);
      
      // Remove all schedule entries (since we're removing all students)
      const updatedTeaching = {
        ...teacher.teaching,
        schedule: [] // Clear all schedule entries
      };
      
      const teacherUpdatePayload = {
        _id: TEACHER_ID,
        teaching: updatedTeaching
      };
      
      const teacherUpdateResponse = await fetch(`/api/teacher/${TEACHER_ID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(teacherUpdatePayload)
      });
      
      if (!teacherUpdateResponse.ok) {
        throw new Error(`Teacher update failed: ${teacherUpdateResponse.status}`);
      }
      
      console.log(`✅ Teacher schedule cleared`);
      
    } catch (error) {
      console.error(`❌ Failed to clean teacher schedule:`, error);
    }
    
    console.log(`\n🎉 CLEANUP COMPLETE!`);
    console.log(`\n📋 Summary:`);
    console.log(`  • Removed teacher from ${successCount} student documents`);
    console.log(`  • Cleared teacher's schedule entries`);
    console.log(`  • Teacher-student relationship logic remains intact`);
    console.log(`  • Ready for new proper assignments`);
    
    console.log(`\n🔍 Verification:`);
    console.log(`  • Teacher should now show 0 students in UI`);
    console.log(`  • Students should not show this teacher anymore`);
    console.log(`  • All assignment functionality still works for future use`);
    
  } catch (error) {
    console.error("❌ Cleanup failed:", error);
  }
}

// Auto-run confirmation
console.log("🧹 Teacher-Student Data Cleanup Tool Ready");
console.log("This will REMOVE the old/corrupted teacher-student relationships");
console.log("Run cleanupTeacherStudentData() to start cleanup");

// Uncomment to auto-run:
// cleanupTeacherStudentData();