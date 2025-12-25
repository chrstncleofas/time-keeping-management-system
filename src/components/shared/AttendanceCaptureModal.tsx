"use client";

import React from 'react';
import { X } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface TimeEntryMini {
  _id?: string;
  timestamp?: string;
  photoUrl?: string;
  type?: 'time-in' | 'time-out';
}

interface Props {
  open: boolean;
  onClose: () => void;
  dateLabel?: string;
  userName?: string;
  timeIn?: TimeEntryMini | null;
  timeOut?: TimeEntryMini | null;
}

export const AttendanceCaptureModal: React.FC<Props> = ({ open, onClose, dateLabel, userName, timeIn, timeOut }) => {
  if (!open) return null;

  const renderEntry = (entry?: TimeEntryMini | null) => {
    if (!entry) return (
      <div className="p-4 text-center text-gray-500">No capture</div>
    );

    return (
      <div className="flex flex-col items-center gap-2">
        {entry.photoUrl ? (
          <img src={entry.photoUrl} alt="capture" className="w-full max-h-[50vh] md:max-h-64 object-contain rounded-md border" />
        ) : (
          <div className="w-full h-40 bg-gray-100 flex items-center justify-center text-sm text-gray-500">No image</div>
        )}
        <div className="text-sm text-gray-700">
          {entry.type ? `${entry.type.replace('-', ' ').toUpperCase()}` : 'Entry'}
        </div>
        <div className="text-xs text-gray-500">
          {entry.timestamp ? format(parseISO(entry.timestamp), 'PPpp') : '-'}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-[95vw] max-h-[92vh] overflow-auto">
        <div className="p-4 border-b flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold">View Capture</h3>
            {userName && <p className="text-sm text-gray-600">{userName} • {dateLabel}</p>}
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded-md">{renderEntry(timeIn)}</div>
          <div className="bg-gray-50 p-4 rounded-md">{renderEntry(timeOut)}</div>
        </div>

        <div className="p-4 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg">Close</button>
        </div>
      </div>
    </div>
  );
};

export default AttendanceCaptureModal;
