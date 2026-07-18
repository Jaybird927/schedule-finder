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
  onRemove,
}: {
  period: number;
  subject?: string;
  onRemove: () => void;
}) {
  const { isOver, setNodeRef } = useDroppable({ id: `period-${period}` });
  const isZero = period === 0;

  return (
    <div
      ref={setNodeRef}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 transition-all
        ${
          isOver
            ? 'border-indigo-400 bg-indigo-50 scale-[1.01]'
            : subject
            ? 'border-gray-200 bg-gray-50'
            : 'border-dashed border-gray-200 bg-white'
        }`}
    >
      <div className="flex-shrink-0 w-24">
        <span className="text-xs font-bold text-gray-500">{PERIOD_LABELS[period]}</span>
        {isZero && !subject && (
          <p className="text-xs text-gray-300 leading-tight mt-0.5">optional</p>
        )}
      </div>

      <div className="flex-1 min-w-0">
        {subject ? (
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${SUBJECT_COLORS[subject]}`}
          >
            <span className="truncate">{subject}</span>
            <button
              onClick={onRemove}
              className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-black/10 text-current leading-none flex-shrink-0"
              title="Remove"
            >
              ×
            </button>
          </div>
        ) : (
          <span
            className={`text-xs italic ${
              isOver ? 'text-indigo-400 font-medium' : 'text-gray-300'
            }`}
          >
            {isOver ? 'Drop here!' : isZero ? 'N/A — drag here to add' : 'Drop a subject here'}
          </span>
        )}
      </div>
    </div>
  );
}

export default function ScheduleBuilder({
  onSave,
  saving,
  initialSchedule = {},
}: {
  onSave: (schedule: Schedule) => void;
  saving: boolean;
  initialSchedule?: Schedule;
}) {
  const [schedule, setSchedule] = useState<Schedule>(initialSchedule);
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
  const canSave = mandatoryPlaced && period1to6Filled;

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
            {[0, 1, 2, 3, 4, 5, 6].map((period) => (
              <PeriodSlot
                key={period}
                period={period}
                subject={schedule[period]}
                onRemove={() =>
                  setSchedule((prev) => {
                    const next = { ...prev };
                    delete next[period];
                    return next;
                  })
                }
              />
            ))}
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
          ) : null}
        </div>
      )}

      <button
        onClick={() => canSave && !saving && onSave(schedule)}
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
