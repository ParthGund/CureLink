import { useCallback, useEffect, useState } from 'react';
import { UserCog } from 'lucide-react';
import Card from '../../components/common/Card';
import EmptyState from '../../components/common/EmptyState';
import ErrorBoundary from '../../components/common/ErrorBoundary';
import WeeklyHoursCard from '../../components/doctor/WeeklyHoursCard';
import ScheduleDayPicker from '../../components/doctor/ScheduleDayPicker';
import DaySlotsPanel from '../../components/doctor/DaySlotsPanel';
import UndoBar from '../../components/doctor/UndoBar';
import {
  getMySchedule,
  generateSlotsFromWorkingHours,
  getMySlots,
  updateMySchedule,
  updateMySlot,
} from '../../services/doctorService';
import { getTodayIso } from '../../utils/dateUtils';

/**
 * Build a YYYY-MM-DD string N days from today, using local date parts.
 */
function localDateOffset(daysFromToday) {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysFromToday);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Normalise a raw schedule response into a safe object with defaults.
 */
function normaliseSchedule(raw) {
  return {
    ...raw,
    workingDays: Array.isArray(raw?.workingDays) ? raw.workingDays : [],
    workingHours: {
      start: raw?.workingHours?.start || '',
      end: raw?.workingHours?.end || '',
    },
    breakTime: {
      start: raw?.breakTime?.start || '',
      end: raw?.breakTime?.end || '',
    },
    slotDurationMinutes:
      typeof raw?.slotDurationMinutes === 'number' ? raw.slotDurationMinutes : 30,
  };
}

/**
 * Pick the best default selected date:
 *   today if it has open slots → else first upcoming date with open slots → else today.
 */
function pickDefaultDate(slots) {
  const today = getTodayIso();
  const todayHasOpen = slots.some(
    s => s.date === today && s.status === 'open' && !s.isBooked
  );
  if (todayHasOpen) return today;

  const firstOpen = slots.find(s => s.status === 'open' && !s.isBooked);
  if (firstOpen) return firstOpen.date;

  return today;
}

export default function Schedule() {
  const [schedule, setSchedule] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notSetup, setNotSetup] = useState(false);
  const [notSetupMsg, setNotSetupMsg] = useState('');
  const [fetchError, setFetchError] = useState('');

  const [selectedDate, setSelectedDate] = useState(getTodayIso());
  const [pickerPage, setPickerPage] = useState(0);

  // Undo bar
  const [undoMsg, setUndoMsg] = useState('');
  const [undoInfo, setUndoInfo] = useState(null);
  const [undoing, setUndoing] = useState(false);

  // Derive the 14-day list
  const upcomingDates = [];
  for (let i = 0; i < 14; i++) {
    upcomingDates.push(localDateOffset(i));
  }

  // ── Fetch helpers ──

  const fetchSlots = useCallback(async () => {
    const today = getTodayIso();
    const to = localDateOffset(29);
    const data = await getMySlots({ from: today, to });
    return Array.isArray(data) ? data : [];
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setFetchError('');
    setNotSetup(false);
    try {
      const raw = await getMySchedule();
      setSchedule(normaliseSchedule(raw));

      try { await generateSlotsFromWorkingHours(); } catch { /* silent */ }

      const slotData = await fetchSlots();
      setSlots(slotData);
      setSelectedDate(pickDefaultDate(slotData));
    } catch (err) {
      if (err.status === 404) {
        setNotSetup(true);
        setNotSetupMsg(
          err.message || 'Your doctor profile has not been set up yet. Contact an administrator.'
        );
      } else {
        setFetchError(err.message || 'Unable to load your schedule.');
      }
    } finally {
      setLoading(false);
    }
  }, [fetchSlots]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // Refresh only slots (after slot actions)
  const refreshSlots = useCallback(async () => {
    try {
      const data = await fetchSlots();
      setSlots(data);
    } catch { /* swallowed — page already loaded */ }
  }, [fetchSlots]);

  // After saving weekly hours: refetch schedule, re-generate, refetch slots
  async function handleSaveWeeklyHours(payload) {
    const res = await updateMySchedule(payload);
    // If updateMySchedule didn't throw, update local state
    setSchedule(normaliseSchedule(res.schedule));
    try { await generateSlotsFromWorkingHours(); } catch { /* silent */ }
    const data = await fetchSlots();
    setSlots(data);
    // Show message (no undo for weekly hours save)
    setUndoMsg(res.message || 'Weekly hours saved.');
    setUndoInfo(null);
  }

  // ── Undo ──

  function showUndoMessage(msg, info) {
    setUndoMsg(msg);
    setUndoInfo(info || null);
  }

  async function handleUndo() {
    if (!undoInfo) return;
    setUndoing(true);

    try {
      if (undoInfo.type === 'cancel-slot') {
        await updateMySlot(undoInfo.slotId, { status: 'open' });
      } else if (undoInfo.type === 'day-off') {
        const results = await Promise.allSettled(
          undoInfo.slotIds.map(id => updateMySlot(id, { status: 'open' }))
        );
        const failed = results.filter(r => r.status === 'rejected').length;
        if (failed > 0) {
          setUndoMsg(`Reopened ${undoInfo.slotIds.length - failed} times. ${failed} could not be reopened.`);
          setUndoInfo(null);
          await refreshSlots();
          setUndoing(false);
          return;
        }
      } else if (undoInfo.type === 'change-time') {
        await updateMySlot(undoInfo.slotId, {
          startTime: undoInfo.prevStart,
          endTime: undoInfo.prevEnd,
        });
      }

      setUndoMsg('');
      setUndoInfo(null);
      await refreshSlots();
    } catch (err) {
      setUndoMsg(err.message || 'Undo failed.');
      setUndoInfo(null);
    } finally {
      setUndoing(false);
    }
  }

  // Slots for the currently selected date
  const slotsForSelected = slots.filter(s => s.date === selectedDate);

  return (
    <ErrorBoundary>
      <div>
        <header className="page-heading">
          <h1>My Schedule</h1>
          <p>Manage your availability and upcoming consultations.</p>
        </header>

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
            <button className="button button--secondary" type="button" onClick={loadAll}>
              Try again
            </button>
          </div>
        )}

        {!loading && !notSetup && !fetchError && (
          <div className="sch2-layout">
            <WeeklyHoursCard
              schedule={schedule}
              onSave={handleSaveWeeklyHours}
            />

            <Card>
              <div className="sch2-days-body">
                <ScheduleDayPicker
                  dates={upcomingDates}
                  slots={slots}
                  workingDays={schedule?.workingDays || []}
                  selectedDate={selectedDate}
                  onSelect={setSelectedDate}
                  page={pickerPage}
                  onPageChange={setPickerPage}
                />

                <DaySlotsPanel
                  key={selectedDate}
                  date={selectedDate}
                  slots={slotsForSelected}
                  schedule={schedule}
                  onSlotsChanged={refreshSlots}
                  onUndoMsg={showUndoMessage}
                />
              </div>
            </Card>

            {undoMsg && (
              <UndoBar
                message={undoMsg}
                onUndo={undoInfo ? handleUndo : undefined}
                onDismiss={() => { setUndoMsg(''); setUndoInfo(null); }}
                undoing={undoing}
              />
            )}
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
