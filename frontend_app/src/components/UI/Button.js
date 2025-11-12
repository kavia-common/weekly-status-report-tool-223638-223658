/**
 * Simple reusable Button component.
 */
// PUBLIC_INTERFACE
import React from 'react';

export function Button({ type = 'button', variant = 'primary', className = '', children, ...rest }) {
  const classes = ['btn'];
  if (variant === 'secondary') classes.push('secondary');
  if (variant === 'ghost') classes.push('ghost');
  if (variant === 'success') classes.push('success');
  if (variant === 'error') classes.push('error');
  if (className) classes.push(className);
  return (
    <button type={type} className={classes.join(' ')} {...rest}>
      {children}
    </button>
  );
}
