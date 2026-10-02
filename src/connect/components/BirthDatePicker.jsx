import { useState } from 'react';
import { MIN_AGE, ageOn, birthDateFrom, setAgeBlocked } from '../shared.js';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const thisYear = new Date().getFullYear();
const YEARS = Array.from({ length: 90 }, (_, i) => thisYear - i);

// Month + year with no preselected answer. Calls onConfirm(birthDate) for 13+, onTooYoung() otherwise.
export default function BirthDatePicker({ onConfirm, onTooYoung, submitLabel = 'Continue', children }) {
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const birthDate = month && year ? birthDateFrom(year, month) : null;

  function submit(e) {
    e.preventDefault();
    if (ageOn(birthDate) < MIN_AGE) {
      setAgeBlocked();
      onTooYoung();
    } else {
      onConfirm(birthDate);
    }
  }

  return (
    <form onSubmit={submit}>
      <div className="grid grid-cols-2 gap-3">
        <label>
          <span className="mb-1 block text-xs font-medium text-slate-500">Month</span>
          <select value={month} onChange={(e) => setMonth(e.target.value)} required className="input">
            <option value="">Month</option>
            {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
        </label>
        <label>
          <span className="mb-1 block text-xs font-medium text-slate-500">Year</span>
          <select value={year} onChange={(e) => setYear(e.target.value)} required className="input">
            <option value="">Year</option>
            {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </label>
      </div>
      <button disabled={!birthDate} className="focus-ring mt-6 w-full rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50">{submitLabel}</button>
      {children}
    </form>
  );
}
