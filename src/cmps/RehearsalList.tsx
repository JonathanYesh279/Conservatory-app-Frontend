// src/cmps/RehearsalList.tsx
import { Rehearsal } from '../services/rehearsalService'
import { Orchestra } from '../services/orchestraService'
import { RehearsalPreview } from './RehearsalPreview'
import { Calendar } from 'lucide-react'

interface GroupedRehearsals {
  date: string
  rehearsals: Rehearsal[]
}

interface RehearsalListProps {
  groupedRehearsals: GroupedRehearsals[]
  isLoading: boolean
  orchestras: Orchestra[]
  onEdit?: (rehearsalId: string) => void
  onView: (rehearsalId: string) => void
  onRemove?: (rehearsalId: string) => void
}

export function RehearsalList({
  groupedRehearsals,
  isLoading,
  orchestras,
  onEdit,
  onView,
  onRemove,
}: RehearsalListProps) {
  if (isLoading && groupedRehearsals.length === 0) {
    return <div className='loading-state'>טוען חזרות...</div>
  }

  if (groupedRehearsals.length === 0) {
    return (
      <div className='empty-state'>
        <p>לא נמצאו חזרות להצגה</p>
        <p>נסה לשנות את מסנני החיפוש או להוסיף חזרות חדשות</p>
      </div>
    )
  }

  // Format date to display in Hebrew
  const formatDateHeader = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('he-IL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // Get orchestra name by id
  const getOrchestraName = (groupId: string) => {
    const orchestra = orchestras.find(o => o._id === groupId)
    return orchestra ? orchestra.name : 'תזמורת לא מוגדרת'
  }

  return (
    <div className='rehearsal-list-container'>
      {groupedRehearsals.map(({ date, rehearsals }) => (
        <div key={date} className='date-group'>
          <div className='date-header'>
            <div className='date-text'>
              <Calendar className='date-icon' size={18} />
              {formatDateHeader(date)}
            </div>
            <span className='date-count'>{rehearsals.length} חזרות</span>
          </div>
          
          <div className='rehearsals-list'>
            {rehearsals.map((rehearsal) => (
              <RehearsalPreview
                key={rehearsal._id}
                rehearsal={rehearsal}
                orchestraName={getOrchestraName(rehearsal.groupId)}
                onEdit={onEdit}
                onView={onView}
                onRemove={onRemove}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}