// src/cmps/StudentDetails/sections/OrchestrasSection.tsx
import { ChevronDown, ChevronUp, Music, Award, RefreshCw, Users, Calendar, MapPin, User } from 'lucide-react';
import { Student } from '../../../services/studentService';
import { Orchestra } from '../../../services/orchestraService';
import { teacherService } from '../../../services/teacherService';
import { useEffect, useState, useRef, useMemo } from 'react';

interface OrchestrasSectionProps {
  student: Student;
  orchestras: Orchestra[];
  orchestrasLoading: boolean;
  isOpen: boolean;
  onToggle: () => void;
  onOrchestraClick: (orchestraId: string) => void;
}

export function OrchestrasSection({
  student,
  orchestras,
  orchestrasLoading,
  isOpen,
  onToggle,
  onOrchestraClick,
}: OrchestrasSectionProps) {
  // Use a ref to track if the component has already created placeholders
  const placeholdersCreated = useRef(false);

  // Create placeholders for orchestras that haven't loaded yet
  const [placeholderOrchestras, setPlaceholderOrchestras] = useState<Orchestra[]>([]);
  
  // State for conductor names
  const [conductorNames, setConductorNames] = useState<Record<string, string>>({});

  // Get orchestra IDs from both possible locations in the student object
  // Use useMemo to prevent recalculation on every render
  const studentOrchestraIds = useMemo(() => {
    return student
      ? [
          ...(student.enrollments?.orchestraIds || []),
        ].filter((id) => id)
      : []; // Remove any undefined/null/empty values
  }, [student]);

  // Determine if we have any orchestra IDs
  const hasOrchestras = studentOrchestraIds.length > 0;

  // Create placeholder orchestras only once if needed
  useEffect(() => {
    // Only run this if:
    // 1. We have orchestra IDs
    // 2. We don't have actual orchestras
    // 3. We're not currently loading orchestras
    // 4. We haven't already created placeholders
    if (
      studentOrchestraIds.length > 0 &&
      orchestras.length === 0 &&
      !orchestrasLoading &&
      !placeholdersCreated.current
    ) {
      // Create placeholders based on IDs
      const placeholders = studentOrchestraIds.map((id) => ({
        _id: id,
        name: `תזמורת ${id.slice(-4)}`,
        type: '',
        conductorId: '',
        memberIds: [],
        rehearsalIds: [],
        schoolYearId: '',
        location: '',
        isActive: true,
      }));

      setPlaceholderOrchestras(placeholders);
      placeholdersCreated.current = true; // Mark that we've created placeholders
    }
  }, [studentOrchestraIds, orchestras.length, orchestrasLoading]);

  // Reset the placeholders created flag when the student or orchestras change
  useEffect(() => {
    return () => {
      placeholdersCreated.current = false; // Reset when component unmounts
    };
  }, [student._id]); // Only reset when student changes

  // Load conductor names for orchestras
  useEffect(() => {
    const loadConductorNames = async () => {
      if (orchestras.length === 0) return;
      
      const newConductorNames: Record<string, string> = {};
      
      for (const orchestra of orchestras) {
        if (orchestra.conductorId && !conductorNames[orchestra.conductorId]) {
          try {
            const conductor = await teacherService.getTeacherById(orchestra.conductorId);
            if (conductor) {
              newConductorNames[orchestra.conductorId] = conductor.personalInfo.fullName;
            }
          } catch (error) {
            console.error(`Error loading conductor ${orchestra.conductorId}:`, error);
            newConductorNames[orchestra.conductorId] = 'מנצח לא ידוע';
          }
        }
      }
      
      if (Object.keys(newConductorNames).length > 0) {
        setConductorNames(prev => ({ ...prev, ...newConductorNames }));
      }
    };
    
    loadConductorNames();
  }, [orchestras, conductorNames]);

  // Determine if we should use placeholder data
  const shouldUsePlaceholders =
    studentOrchestraIds.length > 0 &&
    orchestras.length === 0 &&
    !orchestrasLoading &&
    placeholderOrchestras.length > 0;

  return (
    <div className='sd-section'>
      <div
        className={`sd-section-title clickable ${isOpen ? 'active' : ''}`}
        onClick={onToggle}
      >
        <Music size={16} />
        <span>
          תזמורות/הרכב {hasOrchestras ? `(${studentOrchestraIds.length})` : ''}
        </span>
        {isOpen ? (
          <ChevronUp size={18} className='sd-toggle-icon' />
        ) : (
          <ChevronDown size={18} className='sd-toggle-icon' />
        )}
      </div>

      {isOpen && (
        <div className='sd-section-content'>
          {orchestrasLoading ? (
            <div className='sd-loading-indicator'>
              <RefreshCw size={16} className='spin' />
              <span>טוען נתוני תזמורת...</span>
            </div>
          ) : !hasOrchestras ? (
            <div className='sd-empty-state'>התלמיד אינו משתתף בתזמורות</div>
          ) : shouldUsePlaceholders ? (
            // Use placeholder data when orchestras haven't loaded yet
            <div className='sd-orchestras-swiper'>
              {placeholderOrchestras.map((orchestra) => (
                <div
                  key={orchestra._id}
                  className='sd-orchestra-compact-card clickable sd-orchestra-placeholder'
                  onClick={() => onOrchestraClick(orchestra._id)}
                >
                  <div className="sd-orchestra-card-header">
                    <div className="sd-orchestra-card-icon">
                      <Award size={16} />
                    </div>
                    <div className="sd-orchestra-card-info">
                      <div className="sd-orchestra-card-title">{orchestra.name}</div>
                      <div className="sd-orchestra-card-type">טוען...</div>
                    </div>
                  </div>
                  
                  <div className="sd-orchestra-card-details">
                    <div className="sd-orchestra-card-detail">
                      <RefreshCw size={12} className="spin" />
                      <span>טוען פרטים...</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Use fully loaded orchestras data with swiper structure
            <div className='sd-orchestras-swiper'>
              {orchestras.map((orchestra) => (
                <div
                  key={orchestra._id}
                  className='sd-orchestra-compact-card clickable'
                  onClick={() => onOrchestraClick(orchestra._id)}
                >
                  <div className="sd-orchestra-card-header">
                    <div className="sd-orchestra-card-icon">
                      <Award size={16} />
                    </div>
                    <div className="sd-orchestra-card-info">
                      <div className="sd-orchestra-card-title">{orchestra.name}</div>
                      {orchestra.type && (
                        <div className="sd-orchestra-card-type">{orchestra.type}</div>
                      )}
                    </div>
                  </div>
                  
                  <div className="sd-orchestra-card-details">
                    {orchestra.memberIds && orchestra.memberIds.length > 0 && (
                      <div className="sd-orchestra-card-detail">
                        <Users size={12} />
                        <span>{orchestra.memberIds.length} משתתפים</span>
                      </div>
                    )}
                    
                    {orchestra.rehearsalIds && orchestra.rehearsalIds.length > 0 && (
                      <div className="sd-orchestra-card-detail">
                        <Calendar size={12} />
                        <span>{orchestra.rehearsalIds.length} חזרות</span>
                      </div>
                    )}
                    
                    {orchestra.location && (
                      <div className="sd-orchestra-card-detail">
                        <MapPin size={12} />
                        <span>{orchestra.location}</span>
                      </div>
                    )}
                    
                    {orchestra.conductorId && (
                      <div className="sd-orchestra-card-detail">
                        <User size={12} />
                        <span>מנצח: {conductorNames[orchestra.conductorId] || 'טוען...'}</span>
                      </div>
                    )}
                    
                    <div className="sd-orchestra-card-detail">
                      <Music size={12} />
                      <span>{orchestra.isActive ? 'פעיל' : 'לא פעיל'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
