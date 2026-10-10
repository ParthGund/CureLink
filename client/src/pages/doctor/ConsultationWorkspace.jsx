import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CircleCheck, Info, Save } from 'lucide-react';
import Card from '../../components/common/Card';
import EmptyState from '../../components/common/EmptyState';
import PatientPanel from '../../components/doctor/consultation/PatientPanel';
import ConsultationSteps from '../../components/doctor/consultation/ConsultationSteps';
import AssessmentStep from '../../components/doctor/consultation/AssessmentStep';
import PrescriptionsStep from '../../components/doctor/consultation/PrescriptionsStep';
import ReviewStep from '../../components/doctor/consultation/ReviewStep';
import PrescriptionSheet from '../../components/doctor/consultation/PrescriptionSheet';
import { getConsultationById, saveConsultation, completeConsultation } from '../../services/consultationService';
import { getConsultationPrescription, saveConsultationPrescription } from '../../services/prescriptionService';
import { useToast } from '../../context/ToastContext';

/** Create a blank medicine item with a unique key. */
function emptyItem() {
  return {
    _key: Math.random().toString(36).slice(2),
    medicine: '',
    dosage: '',
    frequency: '',
    duration: '',
    durationDays: '',
    instructions: '',
  };
}

/** Map server prescription items into local form state. */
function serverItemsToLocal(items) {
  return items.map((it) => ({
    _key: Math.random().toString(36).slice(2),
    medicine: it.medicine || '',
    dosage: it.dosage || '',
    frequency: it.frequency || '',
    duration: it.duration || '',
    durationDays: it.durationDays != null ? String(it.durationDays) : '',
    instructions: it.instructions || '',
  }));
}

/**
 * Build the items array for the server.
 * Drops empty cards, omits empty optional fields,
 * sends durationDays as a number (not string, not null).
 */
function localItemsToServer(items) {
  return items
    .filter((it) => it.medicine.trim())
    .map((it) => {
      const obj = { medicine: it.medicine.trim() };
      if (it.dosage.trim()) obj.dosage = it.dosage.trim();
      if (it.frequency.trim()) obj.frequency = it.frequency.trim();
      if (it.duration.trim()) obj.duration = it.duration.trim();
      if (it.instructions.trim()) obj.instructions = it.instructions.trim();
      const days = parseInt(it.durationDays, 10);
      if (Number.isInteger(days) && days >= 1 && days <= 365) {
        obj.durationDays = days;
      }
      return obj;
    });
}

/** Deep compare local items to last-saved items for change detection. */
function itemsEqual(local, saved) {
  const a = localItemsToServer(local);
  const b = saved;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (JSON.stringify(a[i]) !== JSON.stringify(b[i])) return false;
  }
  return true;
}

function formatCompletedDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function ConsultationWorkspace() {
  const { consultationId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  // Loading & error state
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Consultation data
  const [consultation, setConsultation] = useState(null);

  // Assessment form
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [treatmentPlan, setTreatmentPlan] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpInstructions, setFollowUpInstructions] = useState('');

  // Last-saved assessment values for change detection
  const [savedAssessment, setSavedAssessment] = useState({
    chiefComplaint: '', diagnosis: '', clinicalNotes: '',
    treatmentPlan: '', followUpDate: '', followUpInstructions: '',
  });

  // Prescription items
  const [items, setItems] = useState([]);
  const [savedServerItems, setSavedServerItems] = useState([]);
  const [savedPrescription, setSavedPrescription] = useState(null);

  // Step tracker
  const [step, setStep] = useState(0);

  // Operation states
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [rxError, setRxError] = useState('');

  const hasLoadedRef = useRef(false);

  // ── Load data ──────────────────────────────────────────────
  const loadData = useCallback(async () => {
    try {
      const [cRes, pRes] = await Promise.all([
        getConsultationById(consultationId),
        getConsultationPrescription(consultationId),
      ]);

      const c = cRes.consultation;
      setConsultation(c);
      setChiefComplaint(c.chiefComplaint || '');
      setDiagnosis(c.diagnosis || '');
      setClinicalNotes(c.clinicalNotes || '');
      setTreatmentPlan(c.treatmentPlan || '');
      setFollowUpInstructions(c.followUpInstructions || '');

      // Convert ISO date to YYYY-MM-DD for the date input
      let fuDate = '';
      if (c.followUpDate) {
        const d = new Date(c.followUpDate);
        if (!isNaN(d.getTime())) {
          fuDate = d.toISOString().slice(0, 10);
        }
      }
      setFollowUpDate(fuDate);

      setSavedAssessment({
        chiefComplaint: c.chiefComplaint || '',
        diagnosis: c.diagnosis || '',
        clinicalNotes: c.clinicalNotes || '',
        treatmentPlan: c.treatmentPlan || '',
        followUpDate: fuDate,
        followUpInstructions: c.followUpInstructions || '',
      });

      const rx = pRes.prescription;
      setSavedPrescription(rx);
      if (rx && rx.items?.length > 0) {
        setItems(serverItemsToLocal(rx.items));
        setSavedServerItems(rx.items);
      } else {
        setItems([]);
        setSavedServerItems([]);
      }

      // Open on Review for completed consultations
      if (c.status === 'completed' && !hasLoadedRef.current) {
        setStep(2);
      }
      hasLoadedRef.current = true;
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [consultationId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Derived state ──────────────────────────────────────────
  const isCompleted = consultation?.status === 'completed';
  const hasDiagnosis = diagnosis.trim().length > 0;
  const hasComplaint = chiefComplaint.trim().length > 0;
  const namedMeds = items.filter((it) => it.medicine.trim());
  const hasMedicines = namedMeds.length > 0;

  const assessmentChanged =
    chiefComplaint !== savedAssessment.chiefComplaint ||
    diagnosis !== savedAssessment.diagnosis ||
    clinicalNotes !== savedAssessment.clinicalNotes ||
    treatmentPlan !== savedAssessment.treatmentPlan ||
    followUpDate !== savedAssessment.followUpDate ||
    followUpInstructions !== savedAssessment.followUpInstructions;

  const rxChanged = !itemsEqual(items, savedServerItems);
  const hasUnsaved = (!isCompleted && assessmentChanged) || rxChanged;

  // Print availability: completed, saved prescription with items, no unsaved rx changes
  const canPrint = isCompleted && savedPrescription?.items?.length > 0 && !rxChanged;

  // Patient / doctor info
  const patientName = consultation?.patient?.fullName || '';
  const doctorName = consultation?.doctor?.name || '';
  const doctorSpec = consultation?.doctor?.specialization || '';
  const completedDate = formatCompletedDate(consultation?.completedAt);

  // ── beforeunload ───────────────────────────────────────────
  useEffect(() => {
    function handler(e) {
      if (hasUnsaved) {
        e.preventDefault();
        e.returnValue = '';
      }
    }
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasUnsaved]);

  // ── Medicine handlers ──────────────────────────────────────
  function handleAddItem() {
    if (items.length >= 20) return;
    setItems((prev) => [...prev, emptyItem()]);
  }

  function handleItemChange(index, field, value) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, [field]: value } : it)));
    setRxError('');
  }

  function handleRemoveItem(index) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  // ── Assessment field handler ───────────────────────────────
  function handleAssessmentChange(field, value) {
    if (field === 'chiefComplaint') setChiefComplaint(value);
    else if (field === 'diagnosis') setDiagnosis(value);
    else if (field === 'clinicalNotes') setClinicalNotes(value);
    else if (field === 'treatmentPlan') setTreatmentPlan(value);
    else if (field === 'followUpDate') setFollowUpDate(value);
    else if (field === 'followUpInstructions') setFollowUpInstructions(value);
  }

  // ── Validate items before save ─────────────────────────────
  function validateItems() {
    // Any card with content but no medicine name blocks save
    const hasPartialCard = items.some(
      (it) =>
        !it.medicine.trim() &&
        (it.dosage.trim() || it.frequency.trim() || it.duration.trim() || it.durationDays || it.instructions.trim())
    );
    if (hasPartialCard) {
      setRxError('Enter a medicine name for each row.');
      return false;
    }
    setRxError('');
    return true;
  }

  // ── Save draft ─────────────────────────────────────────────
  async function handleSaveDraft() {
    if (!validateItems()) return;
    setSaving(true);

    let assessmentOk = true;
    let rxOk = true;

    try {
      if (!isCompleted && assessmentChanged) {
        const payload = {
          chiefComplaint,
          diagnosis,
          clinicalNotes,
          treatmentPlan,
          followUpInstructions,
        };
        // Only send followUpDate if non-empty
        if (followUpDate) {
          payload.followUpDate = followUpDate;
        } else {
          payload.followUpDate = '';
        }
        const res = await saveConsultation(consultationId, payload);
        const c = res.consultation;

        let fuDate = '';
        if (c.followUpDate) {
          const d = new Date(c.followUpDate);
          if (!isNaN(d.getTime())) fuDate = d.toISOString().slice(0, 10);
        }

        setSavedAssessment({
          chiefComplaint: c.chiefComplaint || '',
          diagnosis: c.diagnosis || '',
          clinicalNotes: c.clinicalNotes || '',
          treatmentPlan: c.treatmentPlan || '',
          followUpDate: fuDate,
          followUpInstructions: c.followUpInstructions || '',
        });
        setConsultation((prev) => ({ ...prev, ...c }));
      }
    } catch (err) {
      assessmentOk = false;
      toast.error(err.message || 'Failed to save assessment.');
    }

    try {
      if (rxChanged) {
        const serverItems = localItemsToServer(items);
        const res = await saveConsultationPrescription(consultationId, serverItems);
        setSavedPrescription(res.prescription);
        if (res.prescription?.items) {
          setSavedServerItems(res.prescription.items);
          setItems(serverItemsToLocal(res.prescription.items));
        } else {
          setSavedServerItems([]);
          setItems([]);
        }
      }
    } catch (err) {
      rxOk = false;
      toast.error(err.message || 'Failed to save prescription.');
    }

    if (assessmentOk && rxOk) {
      toast.success('Draft saved.');
    }
    setSaving(false);
  }

  // ── Save prescription only (for completed consultations) ───
  async function handleSavePrescription() {
    if (!validateItems()) return;
    setSaving(true);
    try {
      const serverItems = localItemsToServer(items);
      const res = await saveConsultationPrescription(consultationId, serverItems);
      setSavedPrescription(res.prescription);
      if (res.prescription?.items) {
        setSavedServerItems(res.prescription.items);
        setItems(serverItemsToLocal(res.prescription.items));
      } else {
        setSavedServerItems([]);
        setItems([]);
      }
      toast.success('Prescription saved.');
    } catch (err) {
      toast.error(err.message || 'Failed to save prescription.');
    }
    setSaving(false);
  }

  // ── Complete consultation ──────────────────────────────────
  async function handleComplete() {
    setCompleting(true);
    try {
      // Save assessment if changed
      if (assessmentChanged) {
        const payload = {
          chiefComplaint, diagnosis, clinicalNotes,
          treatmentPlan, followUpInstructions,
        };
        if (followUpDate) {
          payload.followUpDate = followUpDate;
        } else {
          payload.followUpDate = '';
        }
        await saveConsultation(consultationId, payload);
      }
      // Save prescription if changed
      if (rxChanged) {
        const serverItems = localItemsToServer(items);
        await saveConsultationPrescription(consultationId, serverItems);
      }
      // Complete
      await completeConsultation(consultationId);
      toast.success('Consultation completed.');
      navigate('/doctor/consultations');
    } catch (err) {
      toast.error(err.message || 'Failed to complete consultation.');
    }
    setCompleting(false);
    setConfirmOpen(false);
  }

  // ── Print ──────────────────────────────────────────────────
  function handlePrint() {
    document.body.classList.add('dr-consult-printing');
    function onAfterPrint() {
      document.body.classList.remove('dr-consult-printing');
      window.removeEventListener('afterprint', onAfterPrint);
    }
    window.addEventListener('afterprint', onAfterPrint);
    window.print();
  }

  // Clean up body class + listener if the component unmounts while printing
  useEffect(() => {
    return () => {
      document.body.classList.remove('dr-consult-printing');
    };
  }, []);

  // ── Render ─────────────────────────────────────────────────
  if (loading) {
    return (
      <div>
        <Link to="/doctor/consultations" className="dr-consult-back button button--secondary">
          <ArrowLeft size={16} /> Back to Consultations
        </Link>
        <div className="skeleton-line dr-consult-skel-title" />
        <div className="skeleton-line dr-consult-skel-sub" />
        <div className="dr-consult-grid dr-consult-grid--loading">
          <Card><div className="dr-consult-skel-card"><div className="skeleton-line dr-consult-skel-line-w60" /><div className="skeleton-line dr-consult-skel-line-w80" /></div></Card>
          <Card><div className="dr-consult-skel-card"><div className="skeleton-line dr-consult-skel-line-w50" /><div className="skeleton-line dr-consult-skel-line-w90" /></div></Card>
        </div>
      </div>
    );
  }

  if (notFound || !consultation) {
    return (
      <div>
        <Link to="/doctor/consultations" className="dr-consult-back button button--secondary">
          <ArrowLeft size={16} /> Back to Consultations
        </Link>
        <Card>
          <EmptyState
            icon={Info}
            title="Consultation not found"
            description="The requested consultation could not be loaded."
          />
        </Card>
      </div>
    );
  }

  // Items for preview (current form state)
  const previewItems = localItemsToServer(items);

  // Status message
  let statusIcon, statusText;
  if (!isCompleted && !hasDiagnosis) {
    statusIcon = <Info size={15} aria-hidden="true" />;
    statusText = 'Diagnosis needed to complete';
  } else if (!isCompleted) {
    statusIcon = <CircleCheck size={15} className="dr-consult-footer__icon--ok" aria-hidden="true" />;
    statusText = 'Ready to complete';
  }
  if (hasUnsaved && statusText) {
    statusText += ' · Unsaved changes';
  }

  return (
    <div>
      <Link to="/doctor/consultations" className="dr-consult-back button button--secondary">
        <ArrowLeft size={16} /> Back to Consultations
      </Link>

      <header className="page-heading">
        <h1>Consultation</h1>
        <p>Record findings and prescriptions for this appointment.</p>
      </header>

      <div className="dr-consult-grid">
        {/* Left: Patient panel */}
        <div className="dr-consult-sidebar">
          <PatientPanel
            consultation={consultation}
            hasDiagnosis={hasDiagnosis}
            hasComplaint={hasComplaint}
            hasMedicines={hasMedicines}
          />
        </div>

        {/* Right: Workspace card */}
        <Card className="dr-consult-workspace">
          <ConsultationSteps
            active={step}
            onSelect={setStep}
            assessmentDone={hasDiagnosis}
            prescriptionsDone={hasMedicines}
            medicineCount={namedMeds.length}
          />

          <div className="dr-consult-workspace__body">
            {step === 0 && (
              <AssessmentStep
                chiefComplaint={chiefComplaint}
                diagnosis={diagnosis}
                clinicalNotes={clinicalNotes}
                treatmentPlan={treatmentPlan}
                followUpDate={followUpDate}
                followUpInstructions={followUpInstructions}
                onChange={handleAssessmentChange}
                readOnly={isCompleted}
              />
            )}

            {step === 1 && (
              <PrescriptionsStep
                items={items}
                onAdd={handleAddItem}
                onChange={handleItemChange}
                onRemove={handleRemoveItem}
                canPrint={canPrint}
                onPrint={handlePrint}
                error={rxError}
                readOnly={isCompleted}
              />
            )}

            {step === 2 && (
              <ReviewStep
                patientName={patientName}
                doctorName={doctorName}
                doctorSpec={doctorSpec}
                date={completedDate || 'Not completed yet'}
                chiefComplaint={chiefComplaint}
                diagnosis={diagnosis}
                treatmentPlan={treatmentPlan}
                followUpDate={followUpDate}
                followUpInstructions={followUpInstructions}
                items={previewItems}
                isCompleted={isCompleted}
                canPrint={canPrint}
                onPrint={handlePrint}
              />
            )}
          </div>

          {/* Footer */}
          <div className="dr-consult-footer">
            {statusText && (
              <span className="dr-consult-footer__status">
                {statusIcon} {statusText}
              </span>
            )}
            <span className="dr-consult-footer__spacer" />

            {/* In-progress: Save draft + Next/Complete */}
            {!isCompleted && (
              <>
                <button
                  type="button"
                  className="button button--secondary"
                  onClick={handleSaveDraft}
                  disabled={saving || completing}
                >
                  <Save size={15} aria-hidden="true" /> Save draft
                </button>
                {step < 2 ? (
                  <button
                    type="button"
                    className="button"
                    onClick={() => setStep(step + 1)}
                  >
                    Next <ArrowRight size={15} aria-hidden="true" />
                  </button>
                ) : (
                  <button
                    type="button"
                    className="button"
                    onClick={() => setConfirmOpen(true)}
                    disabled={!hasDiagnosis || saving || completing}
                  >
                    <CircleCheck size={15} aria-hidden="true" /> Complete consultation
                  </button>
                )}
              </>
            )}

            {/* Completed state: No further actions */}
          </div>
        </Card>
      </div>

      {/* ── Confirm dialog ──────────────────────────────────── */}
      {confirmOpen && (
        <div className="modal-overlay" onClick={() => setConfirmOpen(false)}>
          <div className="modal-panel modal-panel--narrow" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Complete consultation">
            <div className="cancel-modal-body">
              <CircleCheck size={40} className="dr-consult-confirm-icon" />
              <h3 className="cancel-modal-title">Complete this consultation?</h3>
              <p className="cancel-modal-desc">
                You will not be able to edit the assessment or prescription afterwards. Completed records are finalized.
              </p>
              <div className="modal-actions">
                <button type="button" className="button button--secondary" onClick={() => setConfirmOpen(false)} disabled={completing}>
                  Cancel
                </button>
                <button type="button" className="button" onClick={handleComplete} disabled={completing}>
                  {completing ? 'Completing…' : 'Complete consultation'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Print-only prescription sheet ────────────────────── */}
      {canPrint && savedPrescription && (
        <div className="dr-consult-print">
          <PrescriptionSheet
            patientName={savedPrescription.patient?.fullName || patientName}
            doctorName={savedPrescription.doctor?.name || doctorName}
            doctorSpec={savedPrescription.doctor?.specialization || doctorSpec}
            date={completedDate}
            chiefComplaint={chiefComplaint}
            diagnosis={diagnosis}
            items={savedPrescription.items}
          />
        </div>
      )}
    </div>
  );
}
