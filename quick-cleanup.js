// Quick cleanup - paste this directly in browser console
// This removes the corrupted teacher-student relationships

(async function quickCleanup() {
  const TEACHER_ID = "688136c194c6cd56db965db9";
  
  console.log("🧹 Quick cleanup starting...");
  
  try {
    // Get students with this teacher
    const studentsResponse = await fetch('/api/student');
    const allStudents = await studentsResponse.json();
    
    const studentsToClean = allStudents.filter(student => {
      const hasInIds = student.teacherIds && student.teacherIds.includes(TEACHER_ID);
      const hasInAssignments = student.teacherAssignments && 
        student.teacherAssignments.some(a => a.teacherId === TEACHER_ID);
      return hasInIds || hasInAssignments;
    });
    
    console.log(`Found ${studentsToClean.length} students to clean`);
    
    if (studentsToClean.length === 0) {
      console.log("✅ No cleanup needed");
      return;
    }
    
    // Show students that will be cleaned
    studentsToClean.forEach(s => {
      console.log(`  - ${s.personalInfo?.fullName} (${s._id})`);
    });
    
    if (!confirm(`Remove teacher from ${studentsToClean.length} students?`)) {
      console.log("❌ Cancelled");
      return;
    }
    
    // Clean each student
    for (const student of studentsToClean) {
      console.log(`Cleaning ${student.personalInfo?.fullName}...`);
      
      const cleanedStudent = {
        ...student,
        teacherIds: (student.teacherIds || []).filter(id => id !== TEACHER_ID),
        teacherAssignments: (student.teacherAssignments || []).filter(a => a.teacherId !== TEACHER_ID)
      };
      
      await fetch(`/api/student/${student._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanedStudent)
      });
      
      console.log(`✅ ${student.personalInfo?.fullName} cleaned`);
    }
    
    // Clean teacher's schedule
    console.log("Cleaning teacher schedule...");
    const teacherResponse = await fetch(`/api/teacher/${TEACHER_ID}`);
    const teacher = await teacherResponse.json();
    
    const cleanedTeacher = {
      ...teacher,
      teaching: {
        ...teacher.teaching,
        schedule: [] // Clear schedule
      }
    };
    
    await fetch(`/api/teacher/${TEACHER_ID}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cleanedTeacher)
    });
    
    console.log("✅ Teacher schedule cleared");
    console.log("🎉 CLEANUP COMPLETE!");
    console.log("Teacher should now show 0 students");
    
  } catch (error) {
    console.error("❌ Cleanup failed:", error);
  }
})();