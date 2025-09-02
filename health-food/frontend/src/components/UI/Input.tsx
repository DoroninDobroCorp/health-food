import clsx from "clsx";

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = ({ className, ...props }: InputProps) => {
    const inputClasses = clsx(
        "w-full px-3 py-2 border-2 border-gray-200 rounded-md transition-all duration-200 focus:border-indigo-500 focus:outline-none focus:ring-0 focus:shadow-sm",
        className
    );
    return <input className={inputClasses} {...props} />;
};

export default Input;
