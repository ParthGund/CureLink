export default function AuthInput({ icon: Icon, id, label, type = 'text', placeholder }) {
  return <label className="auth-field" htmlFor={id}><span>{label}</span><div className="auth-input"><Icon aria-hidden="true" size={21} /><input id={id} type={type} placeholder={placeholder} /></div></label>;
}
