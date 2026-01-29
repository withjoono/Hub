import { useEffect, useRef, type RefObject } from 'react';

/**
 * 요소 외부 클릭 감지
 *
 * @example
 * const ref = useClickOutside<HTMLDivElement>(() => {
 *   setIsOpen(false);
 * });
 *
 * return <div ref={ref}>...</div>;
 */
export function useClickOutside<T extends HTMLElement>(
  handler: () => void
): RefObject<T> {
  const ref = useRef<T>(null);

  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      const el = ref.current;

      // 클릭한 요소가 ref 내부에 있으면 무시
      if (!el || el.contains(event.target as Node)) {
        return;
      }

      handler();
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [handler]);

  return ref;
}
