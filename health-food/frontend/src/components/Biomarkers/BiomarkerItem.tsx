import { type ChangeEvent } from "react";

interface Biomarker {
    name: string;
    unit: string;
    default: number;
    description?: string;
    range?: number[];
    inverse?: boolean;
}

interface BiomarkerItemProps {
    id: string;
    biomarker: Biomarker;
    value: number | undefined;
    onChange: (id: string, value: string) => void;
}

const BiomarkerItem = ({ id, biomarker, value, onChange }: BiomarkerItemProps) => {
    const { name, unit, default: defaultValue, range, inverse } = biomarker;

    const getStatusClass = (): string => {
        if (!range || value === undefined || isNaN(value)) return '';
    
        if (inverse) {
            // For inverse markers, let's assume a simpler 2-value range [ok_max, warning_max] for now
            const [okMax, warningMax] = range;
            if (value > warningMax) return 'status-danger';
            if (value > okMax) return 'status-warning';
            return 'status-ok';
        }

        // Standard range with 4 values: [warning_low, ok_low, ok_high, warning_high]
        if (range.length === 4) {
            const [warningLow, okLow, okHigh, warningHigh] = range;
            if (value < warningLow || value > warningHigh) return 'status-danger';
            if (value < okLow || value > okHigh) return 'status-warning';
            return 'status-ok';
        }
        
        // Fallback for old 2-value range (or misconfigured)
        const [ok, warning] = range;
        if (value >= ok) return 'status-ok';
        if (value >= warning) return 'status-warning';
        return 'status-danger';
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        onChange(id, e.target.value);
    }
    
    return (
        <div className="biomarker-item">
            <label htmlFor={id}>
                {biomarker.description ? (
                    <span className="tooltip-trigger">
                        {name}
                        <span className="tooltip">{biomarker.description}</span>
                    </span>
                ) : (
                    name
                )}
            </label>
            <div className={`input-wrapper ${getStatusClass()}`}>
                <input
                    type="number"
                    id={id}
                    name={id}
                    value={value || ''}
                    placeholder={String(defaultValue)}
                    step="0.1"
                    onChange={handleChange}
                />
                <span className="unit">{unit}</span>
            </div>
        </div>
    );
};

export default BiomarkerItem;
