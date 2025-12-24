"use client";
import React from 'react';
import { format, parseISO } from 'date-fns';

interface AttendanceRecord {
  _id: string;
  date: string;
  timeIn?: { timestamp: string };
  timeOut?: { timestamp: string };
  overtimeHours?: number;
}

interface Props {
  attendanceRecords: AttendanceRecord[];
  periodStart: Date;
  periodEnd: Date;
}

export default function DtrPreview({ attendanceRecords, periodStart, periodEnd }: Props) {
  const start = new Date(periodStart);
  const end = new Date(periodEnd);
  const rows: Array<JSX.Element> = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const iso = d.toISOString().split('T')[0];
    const rec = attendanceRecords.find(r => r.date.split('T')[0] === iso || r.date === iso);
    const inTime = rec?.timeIn ? format(parseISO(rec.timeIn.timestamp), 'h:mm a') : '';
    const outTime = rec?.timeOut ? format(parseISO(rec.timeOut.timestamp), 'h:mm a') : '';
    rows.push(
      <tr key={iso} className="hover:bg-gray-50">
        <td className="px-3 py-2 text-center text-sm text-gray-700">{d.getDate()}</td>
        <td className="px-3 py-2 text-center text-sm">{inTime}</td>
        <td className="px-3 py-2 text-center text-sm">{outTime}</td>
        <td className="px-3 py-2 text-center text-sm">{inTime}</td>
        <td className="px-3 py-2 text-center text-sm">{outTime}</td>
        <td className="px-3 py-2 text-center text-sm">{rec?.overtimeHours ? (rec.overtimeHours > 0 ? rec.overtimeHours.toFixed(2) : '') : ''}</td>
        <td className="px-3 py-2 text-center text-sm">{rec?.overtimeHours ? (rec.overtimeHours > 0 ? rec.overtimeHours.toFixed(2) : '') : ''}</td>
      </tr>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow border border-gray-100 p-2 sm:p-4 overflow-x-auto">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-base sm:text-lg font-semibold text-gray-800">DTR Preview</h3>
        <div className="text-xs sm:text-sm text-gray-500">{format(start, 'MMM d')} — {format(end, 'MMM d, yyyy')}</div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] sm:min-w-[640px] text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-600 uppercase tracking-wide">
              <th className="px-2 py-1 sm:px-3 sm:py-2">Days</th>
              <th className="px-2 py-1 sm:px-3 sm:py-2">IN</th>
              <th className="px-2 py-1 sm:px-3 sm:py-2">OUT</th>
              <th className="px-2 py-1 sm:px-3 sm:py-2">IN</th>
              <th className="px-2 py-1 sm:px-3 sm:py-2">OUT</th>
              <th className="px-2 py-1 sm:px-3 sm:py-2">OT IN</th>
              <th className="px-2 py-1 sm:px-3 sm:py-2">OT OUT</th>
            </tr>
          </thead>
          <tbody className="text-gray-700">{rows}</tbody>
        </table>
      </div>
    </div>
  );
}
