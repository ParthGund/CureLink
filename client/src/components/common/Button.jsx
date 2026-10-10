import { Link } from 'react-router-dom';

export default function Button({ children, to, variant = 'primary', type = 'button', className = '', ...rest }) {
  const classes = `button button--${variant} ${className}`.trim();

  if (to) {
    return <Link className={classes} to={to} {...rest}>{children}</Link>;
  }

  return <button className={classes} type={type} {...rest}>{children}</button>;
}
