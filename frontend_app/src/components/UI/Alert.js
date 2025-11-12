/**
 * Alert component for inline messages.
 */
// PUBLIC_INTERFACE
import React from 'react';

export function Alert({ kind = 'info', children }) {
  const colors = {
    info: { bg: '#EFF6FF', border: '#BFDBFE', text: '#1E40AF' },
    success: { bg: '#ECFDF5', border: '#A7F3D0', text: '#065F46' },
    error: { bg: '#FEF2F2', border: '#FECACA', text: '#991B1B' },
    warning: { bg: '#FFFBEB', border: '#FDE68A', text: '#92400E' },
  };
  const c = colors[kind] || colors.info;
  return (
    <div style={{
      background: c.bg,
      border: `1px solid ${c.border}`,
      color: c.text,
      padding: '10px 12px',
      borderRadius: 8,
      marginBottom: 12
    }}>
      {children}
    </div>
  );
}
