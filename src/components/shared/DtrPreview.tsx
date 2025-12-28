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

interface ScheduleWindow {
  lunchStart?: string;
  lunchEnd?: string;
}

interface Props {
  attendanceRecords: AttendanceRecord[];
  periodStart: Date;
  periodEnd: Date;
  schedule?: ScheduleWindow;
}

export default function DtrPreview({ attendanceRecords, periodStart, periodEnd, schedule }: Props) {
  const start = new Date(periodStart);
  const end = new Date(periodEnd);
  const rows: Array<JSX.Element> = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const iso = d.toISOString().split('T')[0];
    const rec = attendanceRecords.find(r => r.date.split('T')[0] === iso || r.date === iso);
    // derive morning/afternoon split using schedule if available
    let morningIn = '';
    let morningOut = '';
    let afternoonIn = '';
    let afternoonOut = '';

    // handle cases with only timeIn, only timeOut, or both
    if (rec?.timeIn || rec?.timeOut) {
      const timeInDate = rec?.timeIn ? parseISO(rec.timeIn.timestamp) : null;
      const timeOutDate = rec?.timeOut ? parseISO(rec.timeOut.timestamp) : null;

      if (schedule?.lunchStart && schedule?.lunchEnd) {
        const [lh, lm] = schedule.lunchStart.split(':').map(Number);
        const [leh, lem] = schedule.lunchEnd.split(':').map(Number);
        const lunchStartDate = timeInDate ? new Date(timeInDate) : new Date();
        lunchStartDate.setHours(lh, lm, 0, 0);
        const lunchEndDate = timeInDate ? new Date(timeInDate) : new Date();
        lunchEndDate.setHours(leh, lem, 0, 0);

        // morningIn: show timeIn if exists and before lunch end
        if (timeInDate) {
          morningIn = format(timeInDate, 'h:mm a');
        }

        // morningOut: if there's a timeOut before lunchStart, use timeOut; otherwise use lunchStart if timeIn before lunchStart
        if (timeOutDate && timeOutDate < lunchStartDate) {
          morningOut = format(timeOutDate, 'h:mm a');
        } else if (timeInDate && timeInDate < lunchStartDate) {
          morningOut = format(lunchStartDate, 'h:mm a');
        }

        // afternoonIn: if timeOut is after lunchEnd, set to lunchEnd or timeIn if timeIn after lunchEnd
        if (timeOutDate && timeOutDate > lunchEndDate) {
          const aIn = timeInDate && timeInDate > lunchEndDate ? timeInDate : lunchEndDate;
          afternoonIn = format(aIn, 'h:mm a');
          afternoonOut = format(timeOutDate, 'h:mm a');
        } else if (timeInDate && timeInDate > lunchEndDate && !timeOutDate) {
          // only timeIn in afternoon
          afternoonIn = format(timeInDate, 'h:mm a');
        }
      } else {
        // no schedule/lunch info: show timeIn/timeOut in the first IN/OUT pair
        if (timeInDate) morningIn = format(timeInDate, 'h:mm a');
        if (timeOutDate) morningOut = format(timeOutDate, 'h:mm a');
      }
    }

    rows.push(
      <tr key={iso} className="hover:bg-gray-50">
        <td className="px-3 py-2 text-center text-sm text-gray-700">{d.getDate()}</td>
        <td className="px-3 py-2 text-center text-sm">{morningIn}</td>
        <td className="px-3 py-2 text-center text-sm">{morningOut}</td>
        <td className="px-3 py-2 text-center text-sm">{afternoonIn}</td>
        <td className="px-3 py-2 text-center text-sm">{afternoonOut}</td>
        <td className="px-3 py-2 text-center text-sm">{rec?.overtimeHours ? (rec.overtimeHours > 0 ? rec.overtimeHours.toFixed(2) : '') : ''}</td>
        <td className="px-3 py-2 text-center text-sm">{rec?.overtimeHours ? (rec.overtimeHours > 0 ? rec.overtimeHours.toFixed(2) : '') : ''}</td>
      </tr>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-lg shadow border border-gray-100 p-2 sm:p-4 overflow-x-auto">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-base sm:text-lg font-semibold text-gray-800">DTR Preview</h3>
        <div className="text-xs sm:text-sm text-gray-500">{format(start, 'MMM d')} — {format(end, 'MMM d, yyyy')}</div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[320px] sm:min-w-[640px] text-sm">
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
