import { useState, useEffect } from 'react';
import { Calendar, momentLocalizer, View } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { X, Calendar as CalendarIcon } from 'lucide-react';

// Initialize moment locale
try {
  moment.locale('he');
} catch (e) {
  console.error('Error loading Hebrew locale:', e);
}

const localizer = momentLocalizer(moment);

interface ScheduleEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  studentId: string;
  studentName: string;
  instrument?: string;
}

interface TeacherScheduleProps {
  schedule: Array<{
    studentId: string;
    day: string;
    time: string;
    duration: number;
    studentName?: string;
    instrument?: string;
    isActive: boolean;
  }>;
  isOpen: boolean;
  onClose: () => void;
  initialView?: 'day' | 'week';
}

// Map for converting day names to day numbers (0-6, Sunday-Saturday)
const DAY_NAME_TO_NUMBER: Record<string, number> = {
  ראשון: 0, // Sunday
  שני: 1, // Monday
  שלישי: 2, // Tuesday
  רביעי: 3, // Wednesday
  חמישי: 4, // Thursday
  שישי: 5, // Friday
  שבת: 6, // Saturday
};

// Hebrew day names for use in header
const HEBREW_DAY_NAMES = [
  'ראשון',
  'שני',
  'שלישי',
  'רביעי',
  'חמישי',
  'שישי',
  'שבת',
];

// Full Hebrew messages for calendar labels
const hebrewMessages = {
  today: 'היום',
  previous: 'הקודם',
  next: 'הבא',
  month: 'חודש',
  week: 'שבוע',
  day: 'יום',
  agenda: 'סדר יום',
  date: 'תאריך',
  time: 'שעה',
  event: 'אירוע',
  allDay: 'כל היום',
  showMore: (total: number) => `+ עוד ${total}`,
  noEventsInRange: 'אין שיעורים בטווח זה',
};

export function TeacherSchedule({
  schedule,
  isOpen,
  onClose,
  initialView = 'week',
}: TeacherScheduleProps) {
  const [view, setView] = useState<View>(initialView);
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    if (!schedule || !schedule.length) {
      setEvents([]);
      return;
    }

    console.log('Processing schedule:', schedule);

    // Convert schedule to events
    const convertedEvents = schedule
      .filter((lesson) => lesson.isActive)
      .map((lesson) => {
        // Parse time (format: "HH:MM")
        const [hours, minutes] = lesson.time.split(':').map(Number);

        // Get the day number (0-6)
        const dayNumber = DAY_NAME_TO_NUMBER[lesson.day];

        if (dayNumber === undefined) {
          console.error(`Invalid day name: ${lesson.day}`);
          return null;
        }

        // Create date objects for start and end times
        // Use the current week for dates
        const now = new Date(currentDate);
        const currentDay = now.getDay();

        // Calculate day difference
        let dayDiff = dayNumber - currentDay;

        // If the day is in the past this week, schedule for next week
        if (dayDiff < 0) {
          dayDiff += 7;
        }

        const startDate = new Date(now);
        startDate.setDate(now.getDate() + dayDiff);
        startDate.setHours(hours, minutes, 0, 0);

        const endDate = new Date(startDate.getTime());
        endDate.setMinutes(endDate.getMinutes() + lesson.duration);

        console.log(
          `Created event for ${
            lesson.studentName || 'Unknown Student'
          } on ${startDate.toLocaleString()}`
        );

        return {
          id: `${lesson.studentId}-${lesson.day}-${lesson.time}`,
          title: lesson.studentName || 'תלמיד',
          start: startDate,
          end: endDate,
          studentId: lesson.studentId,
          studentName: lesson.studentName || 'תלמיד',
          instrument: lesson.instrument,
        };
      })
      .filter(Boolean) as ScheduleEvent[];

    console.log('Converted events:', convertedEvents);
    setEvents(convertedEvents);
  }, [schedule, currentDate]);

  if (!isOpen) return null;

  const handleViewChange = (newView: View) => {
    setView(newView);
  };

  // Custom header component that uses Hebrew day names
  const DayHeaderComponent = ({ date }: { date: Date }) => {
    const dayIndex = date.getDay();
    const dayName = HEBREW_DAY_NAMES[dayIndex];
    const dayNum = date.getDate();

    return (
      <div className='custom-day-header'>
        <span className='day-name'>{dayName}</span>
        <span className='day-number'>{dayNum}</span>
      </div>
    );
  };

  // Custom time gutter header to add proper styling
  const TimeGutterHeader = () => {
    return <div className='time-gutter-header'></div>;
  };

  // Custom event component with more information
  const EventComponent = ({ event }: { event: ScheduleEvent }) => (
    <div className='schedule-event'>
      <div className='event-title'>{event.title}</div>
      <div className='event-time'>{moment(event.start).format('HH:mm')}</div>
      {event.instrument && (
        <div className='event-instrument'>{event.instrument}</div>
      )}
    </div>
  );

  // Format the time label to use 24-hour format
  const TimeGutterFormatter = (date: Date) => {
    return `${date.getHours().toString().padStart(2, '0')}:${date
      .getMinutes()
      .toString()
      .padStart(2, '0')}`;
  };

  return (
    <div className='schedule-overlay' onClick={onClose}>
      <div className='schedule-modal' onClick={(e) => e.stopPropagation()}>
        <div className='schedule-header'>
          <h2 className='header-title'>מערכת שעות</h2>
          <CalendarIcon className='header-icon' size={18} />

          <div className='view-selector'>
            <button
              className={`view-button ${view === 'day' ? 'active' : ''}`}
              onClick={() => handleViewChange('day')}
            >
              יום
            </button>
            <button
              className={`view-button ${view === 'week' ? 'active' : ''}`}
              onClick={() => handleViewChange('week')}
            >
              שבוע
            </button>
          </div>

          <button className='close-button' onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className='schedule-body'>
          {events.length > 0 ? (
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor='start'
              endAccessor='end'
              views={['week', 'day']}
              view={view}
              onView={handleViewChange}
              date={currentDate}
              onNavigate={setCurrentDate}
              defaultView='week'
              toolbar={false}
              rtl={true}
              messages={hebrewMessages}
              components={{
                event: EventComponent,
                timeGutterHeader: TimeGutterHeader,
                header: DayHeaderComponent,
              }}
              formats={{
                timeGutterFormat: TimeGutterFormatter,
                dayFormat: (date) => String(date.getDate()),
              }}
              min={new Date(0, 0, 0, 7, 0, 0)} // Start time: 7:00 AM
              max={new Date(0, 0, 0, 20, 0, 0)} // End time: 8:00 PM
            />
          ) : (
            <div className='empty-schedule-message'>
              <p>אין שיעורים במערכת</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
