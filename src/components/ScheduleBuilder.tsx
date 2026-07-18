'use client';

import { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  useDroppable,
  useDraggable,
  useSensor,
  useSensors,
  PointerSensor,
  TouchSensor,
} from '@dnd-kit/core';
import { SUBJECTS, MANDATORY_SUBJECTS, SUBJECT_COLORS, PERIOD_LABELS } from '@/lib/constants';

type Schedule = Partial<Record<number, string>>;

function DraggableSubject({ subject, isPlaced }: { subject: string; isPlaced: boolean }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: subject,
    disabled: isPlaced,
  });

  return (
    <div
      ref={setNodeRef}
      {...(isPlaced ? {} : { ...listeners, ...attributes })}
      className={`px-4 py-2.5 rounded-xl border-2 font-medium text-sm select-none transition-all
        ${isPlaced ? 'opacity-25 cursor-default' : 'cursor-grab active:cursor-grabbing hover:shadow-sm'}
        ${isDragging ? 'opacity-30' : ''}
        ${SUBJECT_COLORS[subject]}`}
    >
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-current opacity-50 flex-shrink-0" />
        <span>{subject}</span>
        {subject === 'Elective 2' && (
          <span className="text-xs opacity-50 ml-auto">(optional)</span>
        )}
      </div>
    </div>
  );
}

function PeriodSlot({
  period,
  subject,
  electiveName,
  onRemove,
  onElectiveNameChange,
}: {
  period: number;
  subject?: string;
  electiveName?: string;
  onRemove: () => void;
  onElectiveNameChange?: (name: string) => void;
}) {
  const { isOver, setNodeRef } = useDroppable({ id: `period-${period}` });
  const isZero = period === 0;
  const isElective = subject === 'Elective 1' || subject === 'Elective 2';

  return (
    <div
      ref={setNodeRef}
      className={`px-3 py-2.5 rounded-xl border-2 transition-all
        ${isOver ? 'border-indigo-400 bg-indigo-50 scale-[1.01]' : subject ? 'border-gray-200 bg-gray-50' : 'border-dashed border-gray-200 bg-white'}`}
    >
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0 w-24">
          <span className="text-xs font-bold text-gray-500">{PERIOD_LABELS[period]}</span>
          {isZero && !subject && (
            <p className="text-xs text-gray-300 leading-tight mt-0.5">optional</p>
          )}
        </div>
        <div className="flex-1 min-w-0">
          {subject ? (
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${SUBJECT_COLORS[subject] ?? 'bg-gray-100 text-gray-700 border-gray-300'}`}>
              <span className="truncate">{electiveName || subject}</span>
              <button onClick={onRemove} className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-black/10 text-current leading-none flex-shrink-0" title="Remove">×</button>
            </div>
          ) : (
            <span className={`text-xs italic ${isOver ? 'text-indigo-400 font-medium' : 'text-gray-300'}`}>
              {isOver ? 'Drop here!' : isZero ? 'N/A — drag here to add' : 'Drop a subject here'}
            </span>
          )}
        </div>
      </div>

      {isElective && (
        <div className="mt-2 ml-27 pl-24">
          <input
            type="text"
            value={electiveName ?? ''}
            onChange={e => onElectiveNameChange?.(e.target.value)}
            placeholder={`What is your ${subject}?`}
            className="w-full px-3 py-1.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
          />
        </div>
      )}
    </div>
  );
}

export default function ScheduleBuilder({
  onSave,
  saving,
  initialSchedule = {},
  initialElective1Name = '',
  initialElective2Name = '',
}: {
  onSave: (schedule: Schedule, elective1Name: string, elective2Name: string) => void;
  saving: boolean;
  initialSchedule?: Schedule;
  initialElective1Name?: string;
  initialElective2Name?: string;
}) {
  const [schedule, setSchedule] = useState<Schedule>(initialSchedule);
  const [elective1Name, setElective1Name] = useState(initialElective1Name);
  const [elective2Name, setElective2Name] = useState(initialElective2Name);
  const [activeSubject, setActiveSubject] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
  );

  const placedSubjects = new Set(
    Object.values(schedule).filter(Boolean) as string[]
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveSubject(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveSubject(null);
    if (!over) return;

    const subject = active.id as string;
    const targetId = over.id as string;
    if (!targetId.startsWith('period-')) return;

    const period = parseInt(targetId.replace('period-', ''));
    setSchedule((prev) => {
      const next = { ...prev };
      for (const p of Object.keys(next)) {
        if (next[Number(p)] === subject) delete next[Number(p)];
      }
      next[period] = subject;
      return next;
    });
  }

  const mandatoryPlaced = MANDATORY_SUBJECTS.every((s) => placedSubjects.has(s));
  const period1to6Filled = [1, 2, 3, 4, 5, 6].every((p) => schedule[p]);
  const elective1Placed = placedSubjects.has('Elective 1');
  const elective2Placed = placedSubjects.has('Elective 2');
  const electiveNamesMissing =
    (elective1Placed && !elective1Name.trim()) ||
    (elective2Placed && !elective2Name.trim());
  const canSave = mandatoryPlaced && period1to6Filled && !electiveNamesMissing;

  const missingMandatory = MANDATORY_SUBJECTS.filter((s) => !placedSubjects.has(s));
  const missingPeriods = [1, 2, 3, 4, 5, 6].filter((p) => !schedule[p]);
  const filledCount = Object.keys(schedule).length;

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Subject palette */}
        <div>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
            Subjects
          </h3>
          <p className="text-xs text-gray-400 mb-3">Drag into a period slot →</p>
          <div className="flex flex-col gap-2">
            {SUBJECTS.map((subject) => (
              <DraggableSubject
                key={subject}
                subject={subject}
                isPlaced={placedSubjects.has(subject)}
              />
            ))}
          </div>
        </div>

        {/* Period slots */}
        <div>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
            Your Schedule
          </h3>
          <p className="text-xs text-gray-400 mb-3">
            {filledCount === 0 ? 'Nothing placed yet' : `${filledCount} / 7 periods filled`}
          </p>
          <div className="flex flex-col gap-2">
            {[0, 1, 2, 3, 4, 5, 6].map((period) => {
              const subject = schedule[period];
              const electiveName =
                subject === 'Elective 1' ? elective1Name :
                subject === 'Elective 2' ? elective2Name : undefined;
              return (
                <PeriodSlot
                  key={period}
                  period={period}
                  subject={subject}
                  electiveName={electiveName}
                  onElectiveNameChange={
                    subject === 'Elective 1' ? setElective1Name :
                    subject === 'Elective 2' ? setElective2Name : undefined
                  }
                  onRemove={() =>
                    setSchedule((prev) => {
                      const next = { ...prev };
                      delete next[period];
                      return next;
                    })
                  }
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Validation hint */}
      {!canSave && filledCount > 0 && (
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
          {missingMandatory.length > 0 ? (
            <p>Still need to place: {missingMandatory.join(', ')}</p>
          ) : missingPeriods.length > 0 ? (
            <p>Periods {missingPeriods.join(', ')} are still empty</p>
          ) : electiveNamesMissing ? (
            <p>Fill in the name{elective1Placed && !elective1Name.trim() && elective2Placed && !elective2Name.trim() ? 's' : ''} for your elective{elective1Placed && !elective1Name.trim() && elective2Placed && !elective2Name.trim() ? 's' : ''}</p>
          ) : null}
        </div>
      )}

      <button
        onClick={() => canSave && !saving && onSave(schedule, elective1Name.trim(), elective2Name.trim())}
        disabled={!canSave || saving}
        className="mt-6 w-full py-3 rounded-full font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
      >
        {saving
          ? 'Saving...'
          : canSave
          ? 'Save My Schedule!'
          : 'Fill in your schedule to continue'}
      </button>

      <DragOverlay dropAnimation={null}>
        {activeSubject && (
          <div
            className={`px-4 py-2.5 rounded-xl border-2 font-medium text-sm shadow-xl cursor-grabbing ${SUBJECT_COLORS[activeSubject]}`}
          >
            {activeSubject}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
