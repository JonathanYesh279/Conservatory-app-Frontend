// src/cmps/RehearsalList.tsx
import { Rehearsal } from '../services/rehearsalService';
import { Orchestra } from '../services/orchestraService';
import { RehearsalPreview } from './RehearsalPreview';
import { Calendar } from 'lucide-react';
import { useMemo } from 'react';

interface RehearsalListProps {
  rehearsals: Rehearsal[];
  isLoading: boolean;
  orchestras: Orchestra[];
  onEdit?: (rehearsalId: string) => void;
  onView: (rehearsalId: string) => void;
  onRemove?: (rehearsalId: string) => void;
  onRemoveOrchestra?: (orchestraId: string, rehearsalId: string) => void;
}

export function RehearsalList({
  rehearsals,
  isLoading,
  orchestras,
  onEdit,
  onView,
  onRemove,
  onRemoveOrchestra,
}: RehearsalListProps) {

  // Group rehearsals by date with today's rehearsals first
  const groupedRehearsals = useMemo(() => {
    if (!rehearsals.length) return [];

    // Get today's date as YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];

    // Group rehearsals by date
    const dateGroups = rehearsals.reduce((groups, rehearsal) => {
      const date = rehearsal.date;
      if (!groups[date]) {
        groups[date] = {
          date,
          rehearsals: [],
          isToday: date === today,
        };
      }
      groups[date].rehearsals.push(rehearsal);
      return groups;
    }, {} as Record<string, { date: string; rehearsals: Rehearsal[]; isToday: boolean }>);

    // Sort rehearsals within each group by start time
    Object.values(dateGroups).forEach((group) => {
      group.rehearsals.sort((a, b) => a.startTime.localeCompare(b.startTime));
    });

    // Convert to array and sort with today first, then by date
    return Object.values(dateGroups).sort((a, b) => {
      // Today's rehearsals first
      if (a.isToday && !b.isToday) return -1;
      if (!a.isToday && b.isToday) return 1;

      // Then by date (ascending)
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
  }, [rehearsals]);

  if (isLoading && rehearsals.length === 0) {
    return <div className='loading-state'>טוען חזרות...</div>;
  }

  if (rehearsals.length === 0) {
    return (
      <div className='empty-state'>
        <p>לא נמצאו חזרות להצגה</p>
        <p>נסה לשנות את מסנני החיפוש או להוסיף חזרות חדשות</p>
      </div>
    );
  }

  // Format date to display in Hebrew
  const formatDateHeader = (dateStr: string, isToday: boolean) => {
    if (isToday) {
      return 'חזרות היום';
    }

    const date = new Date(dateStr);
    return date.toLocaleDateString('he-IL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Get orchestra name by id
  const getOrchestraName = (orchestraId: string) => {
    const orchestra = orchestras.find((o) => o._id === orchestraId);
    return orchestra ? orchestra.name : 'תזמורת לא מוגדרת';
  };

  return (
    <div className='rehearsal-list-container'>
      {groupedRehearsals.map(({ date, rehearsals, isToday }) => (
        <div
          key={date}
          className={`rehearsal-date-group ${isToday ? 'today-group' : ''}`}
        >
          <div className='date-header'>
            <Calendar size={20} />
            <h2>{formatDateHeader(date, isToday)}</h2>
          </div>

          <div className='rehearsal-grid'>
            {rehearsals.map((rehearsal) => (
              <RehearsalPreview
                key={rehearsal._id}
                rehearsal={rehearsal}
                orchestraName={getOrchestraName(rehearsal.groupId)}
                onEdit={onEdit}
                onView={onView}
                onRemove={onRemove}
                onRemoveOrchestra={onRemoveOrchestra}
                isToday={isToday}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
