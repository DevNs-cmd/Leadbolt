import React from 'react';

// Button Component
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', children, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer';

    const variants = {
      primary: 'bg-purple-600 text-white hover:bg-purple-700 active:bg-purple-800 shadow-sm',
      secondary: 'bg-purple-100 text-purple-900 hover:bg-purple-200 active:bg-purple-300',
      outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 active:bg-gray-100 shadow-sm',
      ghost: 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
      danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 py-2 text-sm',
      lg: 'px-5 py-2.5 text-base',
      icon: 'p-2 text-sm',
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

// Input Component
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', error, ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          ref={ref}
          className={`w-full px-3 py-2 border rounded-lg text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors ${
            error ? 'border-red-500' : 'border-gray-300'
          } ${className}`}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';

// Select Component
export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', children, error, ...props }, ref) => {
    return (
      <div className="w-full">
        <select
          ref={ref}
          className={`w-full px-3 py-2 border rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors ${
            error ? 'border-red-500' : 'border-gray-300'
          } ${className}`}
          {...props}
        >
          {children}
        </select>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
    );
  }
);
Select.displayName = 'Select';

// Label Component
export const Label: React.FC<React.LabelHTMLAttributes<HTMLLabelElement>> = ({
  className = '',
  children,
  ...props
}) => (
  <label className={`block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5 ${className}`} {...props}>
    {children}
  </label>
);

// Badge / Tag Component
export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'new' | 'contacted' | 'qualified' | 'unqualified' | 'default';
}

export const Badge: React.FC<BadgeProps> = ({ className = '', variant = 'default', children, ...props }) => {
  const styles = {
    new: 'bg-blue-50 text-blue-700 border-blue-200',
    contacted: 'bg-amber-50 text-amber-700 border-amber-200',
    qualified: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    unqualified: 'bg-rose-50 text-rose-700 border-rose-200',
    default: 'bg-purple-50 text-purple-700 border-purple-200',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};

// Modal / Dialog Component
export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
}

export const Dialog: React.FC<DialogProps> = ({ isOpen, onClose, title, description, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
        <div
          className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
        <div className="relative transform overflow-hidden rounded-xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-lg border border-gray-100">
          <div className="bg-white px-6 pt-6 pb-4">
            {title && <h3 className="text-lg font-bold text-gray-900 leading-6">{title}</h3>}
            {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
            <div className="mt-4">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Table Components
export const Table: React.FC<React.TableHTMLAttributes<HTMLTableElement>> = ({ className = '', children, ...props }) => (
  <div className="w-full overflow-x-auto rounded-xl border border-gray-200 shadow-sm bg-white">
    <table className={`w-full text-left text-sm border-collapse ${className}`} {...props}>
      {children}
    </table>
  </div>
);

export const Thead: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ className = '', children, ...props }) => (
  <thead className={`bg-purple-50/60 border-b border-gray-200 ${className}`} {...props}>
    {children}
  </thead>
);

export const Tbody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ className = '', children, ...props }) => (
  <tbody className={`divide-y divide-gray-100 bg-white ${className}`} {...props}>
    {children}
  </tbody>
);

export const Tr: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({ className = '', children, ...props }) => (
  <tr className={`transition-colors hover:bg-purple-50/30 ${className}`} {...props}>
    {children}
  </tr>
);

export const Th: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>> = ({ className = '', children, ...props }) => (
  <th className={`px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-purple-950 ${className}`} {...props}>
    {children}
  </th>
);

export const Td: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({ className = '', children, ...props }) => (
  <td className={`px-4 py-3.5 text-sm text-gray-700 ${className}`} {...props}>
    {children}
  </td>
);

// Card Component
export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = '', children, ...props }) => (
  <div className={`bg-white rounded-xl border border-gray-200 shadow-sm p-5 ${className}`} {...props}>
    {children}
  </div>
);
