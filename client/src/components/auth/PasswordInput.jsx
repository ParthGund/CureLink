import { Eye, EyeOff, LockKeyhole } from 'lucide-react';
import { useState } from 'react';

export default function PasswordInput({ id, label = 'Password', hideLabel = false }) {
  const [visible, setVisible] = useState(false);
  return <label className="auth-field" htmlFor={id}>{!hideLabel && <span>{label}</span>}<div className="auth-input"><LockKeyhole aria-hidden="true" size={21} /><input id={id} type={visible ? 'text' : 'password'} placeholder={label === 'Confirm Password' ? 'Confirm your password' : 'Enter your password'} /><button aria-label={`${visible ? 'Hide' : 'Show'} ${label.toLowerCase()}`} className="password-toggle" onClick={() => setVisible(!visible)} type="button">{visible ? <EyeOff size={21} /> : <Eye size={21} />}</button></div></label>;
}
