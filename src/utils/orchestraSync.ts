// src/utils/orchestraSync.ts
import { orchestraService } from '../services/orchestraService';
import { studentService } from '../services/studentService';

/**
 * Synchronizes orchestra memberIds with student enrollments
 * This function ensures that orchestras have correct memberIds arrays
 * based on which students have the orchestra in their enrollments
 */
export async function syncAllOrchestraMembers(): Promise<void> {
  try {
    console.log('Starting orchestra-student relationship synchronization...');
    
    // Get all students and orchestras
    const [allStudents, allOrchestras] = await Promise.all([
      studentService.getStudents(),
      orchestraService.getOrchestras()
    ]);
    
    console.log(`Found ${allStudents.length} students and ${allOrchestras.length} orchestras`);
    
    // Process each orchestra
    for (const orchestra of allOrchestras) {
      console.log(`Processing orchestra: ${orchestra.name} (${orchestra._id})`);
      
      // Find all students enrolled in this orchestra
      const enrolledStudents = allStudents.filter(student => 
        student.enrollments?.orchestraIds?.includes(orchestra._id)
      );
      
      const enrolledStudentIds = enrolledStudents.map(student => student._id);
      
      console.log(`Orchestra ${orchestra.name} should have ${enrolledStudentIds.length} members: ${enrolledStudentIds.join(', ')}`);
      console.log(`Orchestra ${orchestra.name} currently has ${orchestra.memberIds?.length || 0} members: ${orchestra.memberIds?.join(', ') || 'none'}`);
      
      // Check if memberIds needs to be updated
      const currentMemberIds = orchestra.memberIds || [];
      const needsUpdate = !arraysEqual(currentMemberIds.sort(), enrolledStudentIds.sort());
      
      if (needsUpdate) {
        console.log(`Updating orchestra ${orchestra.name} memberIds...`);
        
        await orchestraService.updateOrchestra(orchestra._id, {
          memberIds: enrolledStudentIds
        });
        
        console.log(`✓ Updated orchestra ${orchestra.name} with ${enrolledStudentIds.length} members`);
      } else {
        console.log(`✓ Orchestra ${orchestra.name} already has correct memberIds`);
      }
    }
    
    console.log('Orchestra-student relationship synchronization completed successfully!');
    
  } catch (error) {
    console.error('Error during orchestra-student synchronization:', error);
    throw error;
  }
}

/**
 * Synchronizes a specific orchestra's memberIds with student enrollments
 */
export async function syncOrchestraMembers(orchestraId: string): Promise<void> {
  try {
    console.log(`Synchronizing orchestra ${orchestraId}...`);
    
    // Get all students and the specific orchestra
    const [allStudents, orchestra] = await Promise.all([
      studentService.getStudents(),
      orchestraService.getOrchestraById(orchestraId)
    ]);
    
    // Find all students enrolled in this orchestra
    const enrolledStudents = allStudents.filter(student => 
      student.enrollments?.orchestraIds?.includes(orchestraId)
    );
    
    const enrolledStudentIds = enrolledStudents.map(student => student._id);
    
    console.log(`Orchestra ${orchestra.name} should have ${enrolledStudentIds.length} members`);
    console.log(`Orchestra ${orchestra.name} currently has ${orchestra.memberIds?.length || 0} members`);
    
    // Update orchestra memberIds
    await orchestraService.updateOrchestra(orchestraId, {
      memberIds: enrolledStudentIds
    });
    
    console.log(`✓ Updated orchestra ${orchestra.name} with ${enrolledStudentIds.length} members`);
    
  } catch (error) {
    console.error(`Error synchronizing orchestra ${orchestraId}:`, error);
    throw error;
  }
}

/**
 * Helper function to compare two arrays for equality
 */
function arraysEqual(arr1: string[], arr2: string[]): boolean {
  if (arr1.length !== arr2.length) return false;
  return arr1.every((value, index) => value === arr2[index]);
}