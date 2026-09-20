import React, { createContext, useContext, useRef, useState } from 'react';
import { cn } from '../../lib/utils';

interface MouseEnterContextType {
  isMouseEntered: boolean;
  setIsMouseEntered: React.Dispatch<React.SetStateAction<boolean>>;
}

const MouseEnterContext = createContext<MouseEnterContextType>({
  isMouseEntered: false,
  setIsMouseEntered: () => {},
});

/**
 * Aceternity UI inspired 3D Card Container.
 * Applies perspective and dynamic mouse-tracking tilt with spring return.
 */
export const Card3DContainer: React.FC<{
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
}> = ({ children, className, containerClassName }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMouseEntered, setIsMouseEntered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const { left, top, width, height } = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - left - width / 2) / 25;
    const y = (e.clientY - top - height / 2) / 25;
    containerRef.current.style.transform = `rotateY(${x}deg) rotateX(${-y}deg)`;
  };

  const handleMouseEnter = () => {
    setIsMouseEntered(true);
    if (!containerRef.current) return;
    containerRef.current.style.transition = 'transform 100ms ease-out';
  };

  const handleMouseLeave = () => {
    setIsMouseEntered(false);
    if (!containerRef.current) return;
    containerRef.current.style.transition = 'transform 500ms cubic-bezier(0.16, 1, 0.3, 1)';
    containerRef.current.style.transform = `rotateY(0deg) rotateX(0deg)`;
  };

  return (
    <MouseEnterContext.Provider value={{ isMouseEntered, setIsMouseEntered }}>
      <div
        className={cn('flex items-center justify-center [perspective:1000px]', containerClassName)}
      >
        <div
          ref={containerRef}
          onMouseEnter={handleMouseEnter}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className={cn(
            'relative transition-all duration-200 ease-linear [transform-style:preserve-3d]',
            className
          )}
        >
          {children}
        </div>
      </div>
    </MouseEnterContext.Provider>
  );
};

export const Card3DBody: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  return (
    <div
      className={cn(
        'w-full h-full [transform-style:preserve-3d] [&>*]:[transform-style:preserve-3d]',
        className
      )}
    >
      {children}
    </div>
  );
};

export const Card3DItem: React.FC<{
  as?: React.ElementType;
  children: React.ReactNode;
  className?: string;
  translateX?: number | string;
  translateY?: number | string;
  translateZ?: number | string;
  rotateX?: number | string;
  rotateY?: number | string;
  rotateZ?: number | string;
  [key: string]: any;
}> = ({
  as: Component = 'div',
  children,
  className,
  translateX = 0,
  translateY = 0,
  translateZ = 0,
  rotateX = 0,
  rotateY = 0,
  rotateZ = 0,
  ...rest
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const { isMouseEntered } = useContext(MouseEnterContext);

  React.useEffect(() => {
    if (!ref.current) return;
    if (isMouseEntered) {
      ref.current.style.transform = `translateX(${translateX}px) translateY(${translateY}px) translateZ(${translateZ}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg)`;
    } else {
      ref.current.style.transform = `translateX(0px) translateY(0px) translateZ(0px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)`;
    }
  }, [isMouseEntered, translateX, translateY, translateZ, rotateX, rotateY, rotateZ]);

  return (
    <Component
      ref={ref}
      className={cn('w-fit transition duration-200 ease-linear', className)}
      {...rest}
    >
      {children}
    </Component>
  );
};
