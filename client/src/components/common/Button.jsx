import { Link } from 'react-router-dom';

export default function Button({ children, to, variant = 'primary', type = 'button', className = '' }) {
  const classes = `button button--${variant} ${className}`.trim();

  if (to) {
    return <Link className={classes} to={to}>{children}</Link>;
  }

  return <button className={classes} type={type}>{children}</button>;
}
