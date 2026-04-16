import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

export default function usePostLoginReady(isReady) {
  const { postLoginTransition, completePostLoginTransition } = useAuth();
  const didNotifyRef = useRef(false);

  useEffect(() => {
    if (!postLoginTransition?.active) {
      didNotifyRef.current = false;
      return;
    }

    if (didNotifyRef.current || !isReady) {
      return;
    }

    didNotifyRef.current = true;
    completePostLoginTransition();
  }, [isReady, postLoginTransition?.active, completePostLoginTransition]);
}
