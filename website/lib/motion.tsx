"use client";

import {
  ComponentPropsWithoutRef,
  ElementType,
  ForwardedRef,
  MutableRefObject,
  PropsWithoutRef,
  Ref,
  CSSProperties,
  createElement,
  forwardRef,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";

type MotionStyles = CSSProperties;

type Transition = {
  duration?: number;
  delay?: number;
  property?: string;
};

type Viewport = {
  once?: boolean;
  amount?: number;
};

type MotionProps<T extends ElementType> = ComponentPropsWithoutRef<T> & {
  initial?: MotionStyles;
  animate?: MotionStyles;
  whileInView?: MotionStyles;
  transition?: Transition;
  viewport?: Viewport;
};

function mergeRefs<T>(...refs: (Ref<T> | undefined)[]): (value: T | null) => void {
  return (value) => {
    for (const ref of refs) {
      if (!ref) continue;
      if (typeof ref === "function") {
        ref(value);
      } else {
        (ref as MutableRefObject<T | null>).current = value;
      }
    }
  };
}

function resolveTransition(transition?: Transition) {
  const duration = transition?.duration ?? 0.6;
  const delay = transition?.delay ?? 0;
  const property = transition?.property ?? "all";
  return `${property} ${duration}s cubic-bezier(0.22, 1, 0.36, 1) ${delay}s`;
}

function createMotionComponent<T extends ElementType>(component: T) {
  type Props = MotionProps<T>;

  function MotionComponent(
    { initial, animate, whileInView, transition, viewport, style, ...rest }: PropsWithoutRef<Props>,
    ref: ForwardedRef<HTMLElement>
  ) {
    const localRef = useRef<HTMLElement | null>(null);
    const [hasEntered, setHasEntered] = useState(false);
    const [isInView, setIsInView] = useState(false);

    const mergedRef = useMemo(() => mergeRefs(ref as Ref<HTMLElement>, localRef), [ref]);

    useEffect(() => {
      if (!whileInView) return;
      const target = localRef.current;
      if (!target) return;

      const threshold = viewport?.amount ?? 0.35;
      const runOnce = viewport?.once ?? true;
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              setIsInView(true);
              setHasEntered(true);
              if (runOnce) {
                observer.unobserve(entry.target);
              }
            } else if (!runOnce) {
              setIsInView(false);
            }
          }
        },
        { threshold }
      );

      observer.observe(target);

      return () => observer.disconnect();
    }, [viewport?.amount, viewport?.once, whileInView]);

    const computedStyle: MotionStyles = {
      transition: resolveTransition(transition),
      ...(style as MotionStyles)
    };

    if (whileInView) {
      const active = (viewport?.once ?? true) ? hasEntered : isInView;
      if (active) {
        Object.assign(computedStyle, initial, animate, whileInView);
      } else {
        Object.assign(computedStyle, initial ?? { opacity: "0", transform: "translateY(24px)" });
      }
    } else if (animate) {
      Object.assign(computedStyle, initial, animate);
    } else if (initial) {
      Object.assign(computedStyle, initial);
    }

    return createElement(component, {
      ...(rest as ComponentPropsWithoutRef<T>),
      ref: mergedRef,
      style: computedStyle
    });
  }

  return forwardRef<HTMLElement, Props>(MotionComponent);
}

export const motion = {
  div: createMotionComponent("div"),
  section: createMotionComponent("section"),
  header: createMotionComponent("header"),
  footer: createMotionComponent("footer"),
  article: createMotionComponent("article"),
  ul: createMotionComponent("ul"),
  li: createMotionComponent("li"),
  span: createMotionComponent("span"),
  blockquote: createMotionComponent("blockquote")
};
