import { useCallback, useEffect, useState } from 'react';
import { UserCog } from 'lucide-react';
import Card from '../../components/common/Card';
import EmptyState from '../../components/common/EmptyState';
import AvailabilityForm from '../../components/doctor/AvailabilityForm';
import { getMySlots, generateSlotsFromWorkingHours, getMySchedule, updateMySchedule } from '../../services/doctorService';
import ErrorBoundary from '../../components/common/ErrorBoundary';
import ScheduleSettingsCard from '../../components/doctor/ScheduleSettingsCard';
import ScheduleSettingsModal from '../../components/doctor/ScheduleSettingsModal';
import DaySlotsPanel from '../../components/doctor/DaySlotsPanel';
import { getTodayIso, formatShortDate } from '../../utils/dateUtils';

export default function Schedule() {
  const [schedule, setSchedule] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notSetup, setNotSetup] = useState(false);
  const [notSetupMsg, setNotSetupMsg] = useState('');
  const [fetchError, setFetchError] = useState('');
  const [pageMsg, setPageMsg] = useState('');
  
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(getTodayIso());

  const refreshSlots = useCallback(async () => {
    try {
      const today = getTodayIso();
      const thirtyDays = new Date();
      thirtyDays.setDate(thirtyDays.getDate() + 29);
      const toStr = thirtyDays.toISOString().split('T')[0];
      const slotData = await getMySlots({ from: today, to: toStr });
      setSlots(Array.isArray(slotData) ? slotData : []);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const refreshScheduleAndSlots = useCallback(async () => {
    try {
      const sched = await getMySchedule();
      setSchedule({
        ...sched,
        workingDays: Array.isArray(sched?.workingDays) ? sched.workingDays : [],
        workingHours: { start: sched?.workingHours?.start || '', end: sched?.workingHours?.end || '' },
        breakTime: { start: sched?.breakTime?.start || '', end: sched?.breakTime?.end || '' },
        slotDurationMinutes: typeof sched?.slotDurationMinutes === 'number' ? sched.slotDurationMinutes : 30
      });
      try { await generateSlotsFromWorkingHours(); } catch (e) { /* ignore */ }
      await refreshSlots();
    } catch (e) {
      console.error(e);
    }
  }, [refreshSlots]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setFetchError('');
    setNotSetup(false);
    try {
      const sched = await getMySchedule();
      setSchedule({
        ...sched,
        workingDays: Array.isArray(sched?.workingDays) ? sched.workingDays : [],
        workingHours: { start: sched?.workingHours?.start || '', end: sched?.workingHours?.end || '' },
        breakTime: { start: sched?.breakTime?.start || '', end: sched?.breakTime?.end || '' },
        slotDurationMinutes: typeof sched?.slotDurationMinutes === 'number' ? sched.slotDurationMinutes : 30
      });
      
      // Silently auto-sync missing slots
      try { await generateSlotsFromWorkingHours(); } catch (e) { /* ignore */ }
      
      const today = getTodayIso();
      const thirtyDays = new Date();
      thirtyDays.setDate(thirtyDays.getDate() + 29);
      const toStr = thirtyDays.toISOString().split('T')[0];
      
      const slotData = await getMySlots({ from: today, to: toStr });
      setSlots(Array.isArray(slotData) ? slotData : []);
    } catch (err) {
      if (err.status === 404) {
        setNotSetup(true);
        setNotSetupMsg(err.message || 'Your doctor profile has not been set up yet. Please contact an administrator.');
      } else {
        setFetchError(err.message || 'Unable to load your schedule. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Derive unique upcoming dates for the next 14 days
  const upcomingDates = [];
  const todayDate = new Date(getTodayIso());
  for (let i = 0; i < 14; i++) {
    const d = new Date(todayDate);
    d.setDate(todayDate.getDate() + i);
    upcomingDates.push(d.toISOString().split('T')[0]);
  }

  // Auto-select first date with slots if not already selected
  useEffect(() => {
    if (slots?.length > 0 && selectedDate === getTodayIso()) {
      const firstDateWithSlots = slots?.find(s => s.status !== 'cancelled')?.date;
      if (firstDateWithSlots) setSelectedDate(firstDateWithSlots);
    }
  }, [slots, selectedDate]);

  const slotsForSelected = slots?.filter(s => s.date === selectedDate) || [];

  return (
    <ErrorBoundary>
      <div>
        <header className="page-heading">
        <h1>My Schedule</h1>
        <p>Manage your availability and upcoming consultations.</p>
      </header>

      {pageMsg && (
        <div className="schedule-msg schedule-msg--success" role="status" style={{ marginBottom: '24px' }}>
          {pageMsg}
        </div>
      )}

      {loading && (
        <p className="loading-text">Loading schedule…</p>
      )}

      {!loading && notSetup && (
        <Card>
          <EmptyState
            icon={UserCog}
            title="Profile not set up yet"
            description={notSetupMsg}
          />
        </Card>
      )}

      {!loading && fetchError && (
        <div className="doctors-error">
          <p className="doctors-error__msg">{fetchError}</p>
          <button className="button button--secondary" type="button" onClick={loadData}>
            Try again
          </button>
        </div>
      )}

      {!loading && !notSetup && !fetchError && (
        <div className="schedule-layout-new" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <ScheduleSettingsCard 
            schedule={schedule} 
            onEdit={() => setShowSettingsModal(true)} 
          />

          <Card className="schedule-days-card">
            <div className="schedule-card__header">
              <h2>Upcoming days</h2>
            </div>
            <div className="schedule-card__body">
              <div className="schedule-week-strip" role="tablist">
                {upcomingDates.map(dateStr => {
                  const [y, m, d] = dateStr.split('-');
                  const dateObj = new Date(y, m - 1, d);
                  const isWorkingDay = schedule?.workingDays?.includes(dateObj.getDay());
                  const hasSlots = slots?.some(s => s.date === dateStr && s.status !== 'cancelled');
                  
                  return (
                    <button
                      key={dateStr}
                      type="button"
                      role="tab"
                      aria-selected={selectedDate === dateStr}
                      className={`schedule-date-tab ${selectedDate === dateStr ? 'schedule-date-tab--selected' : ''} ${!isWorkingDay ? 'schedule-date-tab--muted' : ''}`}
                      onClick={() => setSelectedDate(dateStr)}
                    >
                      {formatShortDate(dateStr)}
                      {hasSlots && <span className="schedule-date-dot" aria-hidden="true" />}
                    </button>
                  );
                })}
              </div>
              
              <DaySlotsPanel 
                date={selectedDate} 
                slots={slotsForSelected} 
                onSlotsChanged={refreshSlots} 
              />
            </div>
          </Card>

          <details className="schedule-extra-details">
            <summary className="schedule-extra-summary">
              <h3>Add extra availability</h3>
              <p>Need to open a one-off time outside your weekly schedule?</p>
            </summary>
            <div className="schedule-extra-body">
              <AvailabilityForm onCreated={refreshSlots} />
            </div>
          </details>
        </div>
      )}

      {showSettingsModal && (
        <ScheduleSettingsModal 
          schedule={schedule}
          onClose={() => setShowSettingsModal(false)}
          onSave={async (payload) => {
            try {
              const res = await updateMySchedule(payload);
              setPageMsg(res.message);
              refreshScheduleAndSlots();
            } catch (err) {
              console.error(err);
            }
          }}
        />
      )}
      </div>
    </ErrorBoundary>
  );
}
