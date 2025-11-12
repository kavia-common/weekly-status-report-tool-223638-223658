/**
 * Reusable labeled input with error display.
 */
// PUBLIC_INTERFACE
import React from 'react';

export function Input({ label, error, className = '', ...props }) {
  return (
    <div className={`form-group ${className}`}>
      {label && <label>{label}</label>}
      <input className="input" {...props} />
      {error && <div className="help" style={{ color: '#DC2626' }}>{error}</div>}
    </div>
  );
}
