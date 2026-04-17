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
      style={ctrlBtnStyle(false, { gap: 5, padding: '0 16px' })}
    >
      {/* Label and value brighten when ON or hovering; pipe always muted */}
      <span style={{ color: active ? C.text : C.muted, transition: 'color 0.15s ease' }}>Projected Games</span>
      <span style={{ color: C.muted }}> | </span>
      {/* Fixed-width span sized to "OFF" so button never resizes */}
      <span style={{
        display: 'inline-block',
        minWidth: 26,
        color: active ? C.text : C.muted,
        transition: 'color 0.15s ease',
      }}>
        {on ? 'ON' : 'OFF'}
      </span>
    </button>
  );
}
