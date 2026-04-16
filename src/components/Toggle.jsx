import { toggleTrack, toggleKnob, toggleLabelOn, toggleLabelOff } from '../styles/tokens';

/**
 * Reusable ON/OFF toggle pill.
 * Props: on (bool), onChange (fn called on click)
 */
export default function Toggle({ on, onChange }) {
  return (
    <div onClick={onChange} style={toggleTrack(on)}>
      <div style={toggleKnob(on)} />
      <div style={toggleLabelOn(on)}>ON</div>
      <div style={toggleLabelOff(on)}>OFF</div>
    </div>
  );
}
