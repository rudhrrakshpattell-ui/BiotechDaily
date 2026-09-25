import { useCallback, useEffect, useRef, useState } from 'react';

// Runs an async loader whenever deps change. Keeps the previous data while reloading so lists
// don't flash empty during filtering or "load more", and ignores stale responses.
export function useAsync(loader, deps = []) {
  const [state, setState] = useState({ data: undefined, loading: true, error: null });
  const callId = useRef(0);

  const run = useCallback(() => {
    const id = ++callId.current;
    setState((s) => ({ ...s, loading: true, error: null }));
    loader()
      .then((data) => id === callId.current && setState({ data, loading: false, error: null }))
      .catch((error) => id === callId.current && setState((s) => ({ ...s, loading: false, error })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(run, [run]);
  return { ...state, reload: run };
}
