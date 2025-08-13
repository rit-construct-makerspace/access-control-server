import React from "react";

class ErrorBoundary extends React.Component<any,any> {
    constructor(props: any) {
      super(props);
      this.state = { hasError: false };
    }
  
    static getDerivedStateFromError(_error: any) {
      // Update state so the next render will show the fallback UI.
      return { hasError: true };
    }
  
    componentDidCatch(error: any, _errorInfo: any) {
      // You can also log the error to an error reporting service
      console.log(error);
    }
  
    render() {
      if (this.state.hasError) {
        // You can render any custom fallback UI
        return <div>Error.</div>;
      }
  
      return this.props.children; 
    }
  }

export default ErrorBoundary;