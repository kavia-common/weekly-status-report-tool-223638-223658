/**
 * Reusable labeled textarea with error display.
 */
// PUBLIC_INTERFACE
import React from 'react';

export function TextArea({ label, error, rows = 4, className = '', ...props }) {
  return (
    <div className={`form-group ${className}`}>
      {label && <label>{label}</label>}
      <textarea className="input" rows={rows} {...props} />
      {error && <div className="help" style={{ color: '#DC2626' }}>{error}</div>}
    </div>
  );
}
