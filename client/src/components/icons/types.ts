import type { SVGProps } from 'react';

export interface IconProps extends Omit<SVGProps<SVGSVGElement>,
  'onAnimationStart' | 'onAnimationEnd' | 'onDragStart' | 'onDragEnd' | 'onDrag' | 'onDragExit'
  | 'children'
> {
  size?: number;
  animated?: boolean;
}
