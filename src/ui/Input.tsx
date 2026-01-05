import React from 'react';
import { cn } from './utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    fullWidth?: boolean;
}

export const Input: React.FC<InputProps> = ({
    fullWidth,
    className,
    ...rest
}) => {
    return (
        <input
            className={cn(
                'ui-input',
                { 'ui-input-full': !!fullWidth },
                className
            )}
            {...rest}
        />
    );
};

export default Input;
