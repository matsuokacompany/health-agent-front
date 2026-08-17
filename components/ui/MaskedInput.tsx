'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';
import { applyInputMask, type InputMask } from '@/lib/inputMasks';

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> & {
  mask: InputMask;
  onValueChange?: (value: string) => void;
};

export const MaskedInput = forwardRef<HTMLInputElement, Props>(function MaskedInput({ mask, onValueChange, ...props }, ref) {
  return <input {...props} ref={ref} onChange={(event) => {
    const value = applyInputMask(mask, event.target.value);
    event.target.value = value;
    onValueChange?.(value);
  }} />;
});
