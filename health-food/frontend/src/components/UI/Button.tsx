import { type ComponentProps } from 'react';
import clsx from 'clsx';

type ButtonProps = ComponentProps<'button'> & {
    variant?: 'primary' | 'secondary';
};

const Button = ({ className, variant = 'primary', ...props }: ButtonProps) => {
    const buttonClasses = clsx(
        'btn',
        {
            'btn-primary': variant === 'primary',
            'btn-secondary': variant === 'secondary',
        },
        className
    );

    return <button className={buttonClasses} {...props} />;
};

export default Button; 