import { useEffect, useState } from "react";

export function useDebounce(cb: any, delay: number) {
  const [debounceValue, setDebounceVaule] = useState(cb);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebounceVaule(cb);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [cb, delay]);
  return debounceValue;
}