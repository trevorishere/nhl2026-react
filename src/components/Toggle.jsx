import { useState } from 'react';
import { ctrlBtnStyle, C } from '../styles/tokens';

export default function Toggle({ on, onChange }) {
  const [hovering, setHovering] = useState(false);
  const active = on || hovering;
  return (
    <button
      type="button"
      onClick={onChange}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      style={ctrlBtnStyle(false, {
        gap: 5, padding: '0 16px',
        background: on ? C.text : 'transparent',
        transition: 'background 0.15s ease, color 0.15s ease',
      })}
    >
      <span style={{ color: on ? '#18191A' : (active ? C.text : '#c5c9cd'), transition: 'color 0.15s ease' }}>Projected Games</span>
      <span style={{ color: on ? 'rgba(24,25,26,0.5)' : 'rgba(197,201,205,0.5)' }}> | </span>
      <span style={{
        display: 'inline-block',
        minWidth: 26,
        color: on ? '#18191A' : (active ? C.text : '#c5c9cd'),
        transition: 'color 0.15s ease',
      }}>
        {on ? 'ON' : 'OFF'}
      </span>
    </button>
  );
}
