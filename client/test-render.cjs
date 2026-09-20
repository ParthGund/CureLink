require('@babel/register').default({
  presets: [
    '@babel/preset-env',
    ['@babel/preset-react', { runtime: 'automatic' }]
  ]
});

try {
  const Schedule = require('./src/pages/doctor/Schedule.jsx').default;
  const { renderToString } = require('react-dom/server');
  const React = require('react');

  // Let's inject a fake `useState` to render the loaded state!
  const originalUseState = React.useState;
  React.useState = function(init) {
    if (init === null) return [{ workingDays: [1,2,3], workingHours: {start: '09:00', end: '17:00'}, slotDurationMinutes: 30, breakTime: null }, () => {}];
    if (init === true) return [false, () => {}]; // loading=false
    if (init === false) return [false, () => {}];
    if (init === '') return ['', () => {}];
    if (Array.isArray(init)) return [[], () => {}];
    return originalUseState(init);
  };

  console.log('RENDER:', renderToString(React.createElement(Schedule)));
} catch (e) {
  console.error('ERROR:', e);
}
