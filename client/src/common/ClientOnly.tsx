import { useState, useEffect, ReactNode } from 'react';

interface ClientOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export default function ClientOnly(props: ClientOnlyProps) {
  // 1. Start with a state that says "we are not in the browser yet"
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // 3. During the server render, we return the fallback (or nothing).
  if (!hasMounted) {
    return props.fallback;
  }

  // 4. On the client, after the first paint, we render the actual component.
  return props.children;
}