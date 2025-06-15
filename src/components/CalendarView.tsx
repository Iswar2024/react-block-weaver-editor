
import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths, startOfWeek, endOfWeek, isSameMonth } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, Clock, MapPin, Users, Edit3, Trash2 } from 'lucide-react';

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  color: string;
  location?: string;
  attendees?: string[];
}

interface CalendarViewProps {
  selectedDate?: Date;
  events: CalendarEvent[];
  onDateSelect: (date: Date) => void;
  onEventCreate: (event: Omit<CalendarEvent, 'id'>) => void;
  onEventUpdate: (eventId: string, event: Partial<CalendarEvent>) => void;
  onEventDelete: (eventId: string) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({
  selectedDate = new Date(),
  events,
  onDateSelect,
  onEventCreate,
  onEventUpdate,
  onEventDelete
}) => {
  const [currentDate, setCurrentDate] = useState(selectedDate);
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ date: Date; time: string } | null>(null);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const eventColors = [
    'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-red-500', 
    'bg-yellow-500', 'bg-pink-500', 'bg-indigo-500', 'bg-orange-500'
  ];

  const timeSlots = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, '0');
    return `${hour}:00`;
  });

  const getEventsForDate = (date: Date) => {
    return events.filter(event => isSameDay(event.startTime, date));
  };

  const getEventsForTimeSlot = (date: Date, time: string) => {
    const [hour] = time.split(':').map(Number);
    return events.filter(event => {
      if (!isSameDay(event.startTime, date)) return false;
      const eventHour = event.startTime.getHours();
      return eventHour === hour;
    });
  };

  const handleTimeSlotClick = (date: Date, time: string) => {
    setSelectedSlot({ date, time });
    setEditingEvent(null);
    setShowEventModal(true);
  };

  const handleEventClick = (event: CalendarEvent) => {
    setEditingEvent(event);
    setSelectedSlot(null);
    setShowEventModal(true);
  };

  const renderMonthView = () => (
    <div className="grid grid-cols-7 gap-1">
      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
        <div key={day} className="p-3 text-center font-medium text-gray-500 text-sm">
          {day}
        </div>
      ))}
      {calendarDays.map(day => {
        const dayEvents = getEventsForDate(day);
        const isCurrentMonth = isSameMonth(day, currentDate);
        const isSelected = isSameDay(day, selectedDate);
        const isTodayDate = isToday(day);

        return (
          <div
            key={day.toISOString()}
            onClick={() => onDateSelect(day)}
            className={`min-h-[120px] p-2 border border-gray-100 cursor-pointer hover:bg-gray-50 ${
              !isCurrentMonth ? 'text-gray-400 bg-gray-50' : ''
            } ${isSelected ? 'ring-2 ring-blue-500' : ''} ${isTodayDate ? 'bg-blue-50' : ''}`}
          >
            <div className={`text-sm font-medium mb-1 ${isTodayDate ? 'text-blue-600' : ''}`}>
              {format(day, 'd')}
            </div>
            <div className="space-y-1">
              {dayEvents.slice(0, 3).map(event => (
                <div
                  key={event.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEventClick(event);
                  }}
                  className={`text-xs p-1 rounded text-white truncate cursor-pointer hover:opacity-80 ${event.color}`}
                >
                  {format(event.startTime, 'HH:mm')} {event.title}
                </div>
              ))}
              {dayEvents.length > 3 && (
                <div className="text-xs text-gray-500">+{dayEvents.length - 3} more</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderDayView = () => (
    <div className="flex h-[600px]">
      <div className="w-16 flex-shrink-0">
        {timeSlots.map(time => (
          <div key={time} className="h-12 text-xs text-gray-500 flex items-center justify-end pr-2">
            {time}
          </div>
        ))}
      </div>
      <div className="flex-1 relative">
        {timeSlots.map(time => {
          const slotEvents = getEventsForTimeSlot(selectedDate, time);
          return (
            <div
              key={time}
              onClick={() => handleTimeSlotClick(selectedDate, time)}
              className="h-12 border-b border-gray-100 hover:bg-gray-50 cursor-pointer relative"
            >
              {slotEvents.map((event, index) => (
                <div
                  key={event.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEventClick(event);
                  }}
                  className={`absolute left-1 right-1 top-1 bottom-1 p-1 rounded text-white text-xs cursor-pointer hover:opacity-80 ${event.color}`}
                  style={{ zIndex: index + 1 }}
                >
                  <div className="font-medium truncate">{event.title}</div>
                  <div className="truncate opacity-75">
                    {format(event.startTime, 'HH:mm')} - {format(event.endTime, 'HH:mm')}
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="w-full bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <h2 className="text-xl font-semibold">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="flex bg-gray-100 rounded-lg p-1">
            {(['month', 'day'] as const).map(viewType => (
              <button
                key={viewType}
                onClick={() => setView(viewType)}
                className={`px-3 py-1 text-sm rounded-md capitalize ${
                  view === viewType ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                }`}
              >
                {viewType}
              </button>
            ))}
          </div>
          <button
            onClick={() => {
              setSelectedSlot({ date: selectedDate, time: '09:00' });
              setEditingEvent(null);
              setShowEventModal(true);
            }}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            <span>Create</span>
          </button>
        </div>
      </div>

      {/* Calendar Content */}
      <div className="p-4">
        {view === 'month' ? renderMonthView() : renderDayView()}
      </div>

      {/* Event Modal */}
      {showEventModal && (
        <EventModal
          event={editingEvent}
          selectedSlot={selectedSlot}
          onClose={() => setShowEventModal(false)}
          onSave={(eventData) => {
            if (editingEvent) {
              onEventUpdate(editingEvent.id, eventData);
            } else {
              onEventCreate(eventData);
            }
            setShowEventModal(false);
          }}
          onDelete={editingEvent ? () => {
            onEventDelete(editingEvent.id);
            setShowEventModal(false);
          } : undefined}
          eventColors={eventColors}
        />
      )}
    </div>
  );
};

// Event Modal Component
interface EventModalProps {
  event?: CalendarEvent | null;
  selectedSlot?: { date: Date; time: string } | null;
  onClose: () => void;
  onSave: (event: Omit<CalendarEvent, 'id'>) => void;
  onDelete?: () => void;
  eventColors: string[];
}

const EventModal: React.FC<EventModalProps> = ({
  event,
  selectedSlot,
  onClose,
  onSave,
  onDelete,
  eventColors
}) => {
  const [formData, setFormData] = useState({
    title: event?.title || '',
    description: event?.description || '',
    startTime: event ? format(event.startTime, 'HH:mm') : selectedSlot?.time || '09:00',
    endTime: event ? format(event.endTime, 'HH:mm') : '10:00',
    date: event ? format(event.startTime, 'yyyy-MM-dd') : selectedSlot ? format(selectedSlot.date, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
    color: event?.color || eventColors[0],
    location: event?.location || '',
    attendees: event?.attendees?.join(', ') || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const startDateTime = new Date(`${formData.date}T${formData.startTime}`);
    const endDateTime = new Date(`${formData.date}T${formData.endTime}`);
    
    onSave({
      title: formData.title,
      description: formData.description,
      startTime: startDateTime,
      endTime: endDateTime,
      color: formData.color,
      location: formData.location,
      attendees: formData.attendees.split(',').map(a => a.trim()).filter(Boolean)
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">
            {event ? 'Edit Event' : 'Create Event'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Event title"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />

          <textarea
            placeholder="Description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
              <div className="flex space-x-1">
                {eventColors.slice(0, 4).map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, color }))}
                    className={`w-8 h-8 rounded-full ${color} ${
                      formData.color === color ? 'ring-2 ring-gray-400' : ''
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Location"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Attendees (comma separated)"
              value={formData.attendees}
              onChange={(e) => setFormData(prev => ({ ...prev, attendees: e.target.value }))}
              className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center justify-between pt-4">
            <div>
              {onDelete && (
                <button
                  type="button"
                  onClick={onDelete}
                  className="flex items-center space-x-2 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              )}
            </div>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {event ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CalendarView;
export type { CalendarEvent };
