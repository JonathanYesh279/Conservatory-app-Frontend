// src/pages/TheoryIndex.tsx
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { TheoryList } from '../cmps/TheoryList';
import { TheoryForm } from '../cmps/TheoryForm';
import { Searchbar } from '../cmps/Searchbar';
import { Plus } from 'lucide-react';
import { Header } from '../cmps/Header';
import { BottomNavbar } from '../cmps/BottomNavbar';
import { ConfirmDialog } from '../cmps/ConfirmDialog';
import { useTheoryStore } from '../store/theoryStore';
import { useTeacherStore } from '../store/teacherStore';
import { TheoryLesson, TheoryFilter, BulkTheoryLessonData } from '../services/theoryService';
import { useToast } from '../cmps/Toast';

export function TheoryIndex() {
  const navigate = useNavigate();
  const location = useLocation();
  const { addToast, showError, showSuccess } = useToast();

  const {
    theoryLessons,
    isLoading,
    error,
    loadTheoryLessons,
    removeTheoryLesson,
    bulkCreateTheoryLessons,
    saveTheoryLesson,
  } = useTheoryStore();

  const { teachers, loadTeachers } = useTeacherStore();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTheoryLesson, setEditingTheoryLesson] = useState<Partial<TheoryLesson> | null>(null);
  const [filterBy, setFilterBy] = useState<TheoryFilter>({});
  const [confirmDelete, setConfirmDelete] = useState<{
    isOpen: boolean;
    theoryLessonId: string | null;
  }>({ isOpen: false, theoryLessonId: null });

  // Get theory teachers (filter teachers with the 'מורה תאוריה' role)
  const theoryTeachers = teachers.filter((teacher) =>
    teacher.roles?.includes('מורה תאוריה')
  );

  // Load theory lessons and teachers on mount
  useEffect(() => {
    loadTheoryLessons();
    loadTeachers();
  }, [loadTheoryLessons, loadTeachers]);

  // Handle theory lesson creation/update
  const handleSubmit = async (theoryLessonData: Partial<TheoryLesson>): Promise<Partial<TheoryLesson>> => {
    try {
      const savedTheoryLesson = await saveTheoryLesson(theoryLessonData);
      
      // Show success toast
      showSuccess(theoryLessonData._id 
        ? `שיעור התאוריה עודכן בהצלחה`
        : `שיעור התאוריה נוסף בהצלחה`);
      
      setIsFormOpen(false);
      setEditingTheoryLesson(null);
      
      // Navigate to the theory lesson details if not already there
      if (location.pathname !== `/theory/${savedTheoryLesson._id}`) {
        navigate(`/theory/${savedTheoryLesson._id}`);
      }
      
      return savedTheoryLesson;
    } catch (err) {
      console.error('Error saving theory lesson:', err);
      
      // Show error toast with centralized error handling
      showError(err as Error);
      
      throw err;
    }
  };

  // Handle bulk creation
  const handleBulkSubmit = async (data: BulkTheoryLessonData) => {
    console.log('TheoryIndex handleBulkSubmit called with data:', data);
    try {
      // Ensure required fields are present
      if (!data.category) throw new Error('Category is required');
      if (!data.teacherId) throw new Error('Teacher is required');
      if (!data.startDate || !data.endDate) throw new Error('Date range is required');
      if (data.dayOfWeek === undefined) throw new Error('Day of week is required');
      if (!data.startTime || !data.endTime) throw new Error('Time range is required');
      if (!data.location) throw new Error('Location is required');
      
      console.log('About to call bulkCreateTheoryLessons with data:', data);
      const result = await bulkCreateTheoryLessons(data);
      console.log('Bulk creation result:', result);
      
      // Show success toast
      showSuccess(`נוצרו ${result.insertedCount} שיעורי תאוריה בהצלחה`);
      
      setIsFormOpen(false);
    } catch (err) {
      console.error('Error bulk creating theory lessons:', err);
      
      // Show error toast with centralized error handling
      showError(err as Error);
      
      throw err;
    }
  };

  // Handle theory lesson deletion
  const handleDelete = async (theoryLessonId: string) => {
    try {
      await removeTheoryLesson(theoryLessonId);
      
      // Show success toast
      showSuccess('שיעור התאוריה נמחק לצמיתות בהצלחה');
      
      // Navigate back to the index if we were on the deleted theory lesson
      if (location.pathname.includes(theoryLessonId)) {
        navigate('/theory');
      }
    } catch (err) {
      console.error('Error deleting theory lesson:', err);
      
      // Show error toast with centralized error handling
      showError(err as Error);
    } finally {
      setConfirmDelete({ isOpen: false, theoryLessonId: null });
    }
  };

  // Handle search and filtering
  const handleFilter = (query: string) => {
    // Using custom property for search query (not in TheoryFilter interface)
    const updatedFilter = { ...filterBy, query };
    setFilterBy(updatedFilter);
    // Pass as separate parameter since it's not part of TheoryFilter interface
    loadTheoryLessons(updatedFilter);
  };

  // Check if we're on a details page
  const isDetailPage = location.pathname.includes('/theory/') && 
    !location.pathname.endsWith('/theory/');

  return (
    <div className='app-container'>
      <Header />
      <main className='main-content'>
        {/* Only show search bar and action buttons if not on details page */}
        {!isDetailPage && (
          <div className='page-header'>
            <div className='search-action-container'>
              <Searchbar
                onSearch={handleFilter}
                placeholder='חפש שיעורי תאוריה...'
              />
              
              <div className='action-buttons'>
                <button
                  className='btn-icon add-btn'
                  onClick={() => {
                    setEditingTheoryLesson(null);
                    setIsFormOpen(true);
                  }}
                  aria-label='הוספת שיעור תאוריה חדש'
                >
                  <Plus className='icon' size={20} />
                </button>
              </div>
            </div>
          </div>
        )}

        {error && <div className='error-message'>{error}</div>}

        {!isDetailPage && (
          <TheoryList
            theoryLessons={theoryLessons}
            isLoading={isLoading}
            teachers={teachers}
            onEdit={(theoryLessonId) => {
              const theoryLesson = theoryLessons.find((t) => t._id === theoryLessonId);
              if (theoryLesson) {
                setEditingTheoryLesson(theoryLesson);
                setIsFormOpen(true);
              }
            }}
            onView={(theoryLessonId) => navigate(`/theory/${theoryLessonId}`)}
            onRemove={(theoryLessonId) =>
              setConfirmDelete({ isOpen: true, theoryLessonId })
            }
          />
        )}

        <TheoryForm
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setEditingTheoryLesson(null);
          }}
          onSubmit={handleSubmit}
          onBulkSubmit={handleBulkSubmit}
          theoryLesson={editingTheoryLesson || undefined}
          theoryTeachers={theoryTeachers}
          isLoading={isLoading}
        />

        <ConfirmDialog
          isOpen={confirmDelete.isOpen}
          title='מחיקת שיעור תאוריה'
          message='האם אתה בטוח שברצונך למחוק לצמיתות את שיעור התאוריה הזה? פעולה זו תמחק לצמיתות את השיעור ואת כל הנתונים הקשורים אליו ואינה ניתנת לביטול.'
          confirmText='מחק'
          cancelText='ביטול'
          onConfirm={() => {
            if (confirmDelete.theoryLessonId) {
              handleDelete(confirmDelete.theoryLessonId);
            }
          }}
          onClose={() => setConfirmDelete({ isOpen: false, theoryLessonId: null })}
          type='danger'
        />
      </main>
      
      {!isDetailPage && !isFormOpen && <BottomNavbar />}
    </div>
  );
}