import { Component } from 'react';
import Card from './Card';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Render error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ hasError: true });
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card className="schedule-days-card">
          <div className="schedule-card__header">
            <h2>Something went wrong</h2>
          </div>
          <div className="schedule-card__body">
            <p>We couldn't show your schedule. Please refresh the page.</p>
            <button 
              type="button" 
              className="button button--secondary" 
              onClick={() => window.location.reload()} 
              style={{ marginTop: '1rem' }}
            >
              Reload page
            </button>
          </div>
        </Card>
      );
    }
    return this.props.children;
  }
}
