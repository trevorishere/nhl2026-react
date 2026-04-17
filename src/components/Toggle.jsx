import { useState } from 'react';
import { ctrlBtnStyle, C } from '../styles/tokens';

export default function Toggle({ on, onChange }) {
  const [hovering, setHovering] = useState(false);
  return (
    <button
      type="button"
      onClick={onChange}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      style={ctrlBtnStyle(hovering, { gap: 5, padding: '0 16px' })}
    >
      <span>Projected Games</span>
      <span> | </span>
      {/* Fixed-width container sized to "OFF" so button width never changes */}
      <span style={{
        display: 'inline-block',
        minWidth: 26,
        color: on ? C.text : C.muted,
        transition: 'color 0.15s ease',
      }}>
        {on ? 'ON' : 'OFF'}
      </span>
    </button>
  );
}
