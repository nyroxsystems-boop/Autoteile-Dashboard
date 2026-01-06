import { useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

// German car makes commonly found on mobile.de
const CAR_MAKES = [
    'Audi', 'BMW', 'Citroën', 'Dacia', 'Fiat', 'Ford', 'Honda', 'Hyundai',
    'Kia', 'Mazda', 'Mercedes-Benz', 'Mini', 'Mitsubishi', 'Nissan', 'Opel',
    'Peugeot', 'Porsche', 'Renault', 'Seat', 'Skoda', 'Subaru', 'Suzuki',
    'Tesla', 'Toyota', 'Volkswagen', 'Volvo'
];

// Model data for popular makes
const CAR_MODELS: Record<string, string[]> = {
    'Audi': ['A1', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'Q2', 'Q3', 'Q5', 'Q7', 'Q8', 'TT', 'e-tron', 'RS3', 'RS4', 'RS5', 'RS6', 'RS7'],
    'BMW': ['1er', '2er', '3er', '4er', '5er', '6er', '7er', '8er', 'X1', 'X2', 'X3', 'X4', 'X5', 'X6', 'X7', 'Z4', 'i3', 'i4', 'iX', 'M3', 'M4', 'M5'],
    'Mercedes-Benz': ['A-Klasse', 'B-Klasse', 'C-Klasse', 'E-Klasse', 'S-Klasse', 'CLA', 'CLS', 'GLA', 'GLB', 'GLC', 'GLE', 'GLS', 'G-Klasse', 'AMG GT', 'EQA', 'EQB', 'EQC', 'EQE', 'EQS'],
    'Volkswagen': ['Golf', 'Polo', 'Passat', 'Tiguan', 'T-Roc', 'T-Cross', 'Touran', 'Touareg', 'Arteon', 'ID.3', 'ID.4', 'ID.5', 'Up', 'Caddy', 'Transporter', 'Multivan'],
    'Ford': ['Fiesta', 'Focus', 'Mondeo', 'Kuga', 'Puma', 'EcoSport', 'Edge', 'Explorer', 'Mustang', 'S-MAX', 'Galaxy', 'Transit', 'Ranger'],
    'Opel': ['Corsa', 'Astra', 'Insignia', 'Mokka', 'Crossland', 'Grandland', 'Combo', 'Zafira', 'Vivaro', 'Movano'],
    'Toyota': ['Yaris', 'Corolla', 'Camry', 'C-HR', 'RAV4', 'Highlander', 'Land Cruiser', 'Aygo', 'Prius', 'Supra', 'Hilux', 'Proace'],
    'Skoda': ['Fabia', 'Scala', 'Octavia', 'Superb', 'Kamiq', 'Karoq', 'Kodiaq', 'Enyaq', 'Citigo'],
    'Seat': ['Ibiza', 'Leon', 'Arona', 'Ateca', 'Tarraco', 'Cupra Formentor', 'Cupra Born'],
    'Hyundai': ['i10', 'i20', 'i30', 'Ioniq', 'Kona', 'Tucson', 'Santa Fe', 'Ioniq 5', 'Ioniq 6', 'Nexo'],
    'Kia': ['Picanto', 'Rio', 'Ceed', 'Stonic', 'Sportage', 'Sorento', 'Niro', 'EV6', 'Stinger'],
    'Renault': ['Clio', 'Megane', 'Captur', 'Kadjar', 'Arkana', 'Scenic', 'Espace', 'Twingo', 'Zoe', 'Austral'],
    'Peugeot': ['108', '208', '308', '408', '508', '2008', '3008', '5008', 'Rifter', 'Partner'],
    'Citroën': ['C1', 'C3', 'C4', 'C5', 'Berlingo', 'C3 Aircross', 'C5 Aircross', 'ë-C4'],
    'Fiat': ['500', 'Panda', 'Tipo', '500X', '500L', 'Ducato', 'Doblo'],
    'Nissan': ['Micra', 'Juke', 'Qashqai', 'X-Trail', 'Leaf', 'Ariya', 'Navara'],
    'Mazda': ['2', '3', '6', 'CX-3', 'CX-30', 'CX-5', 'CX-60', 'MX-5', 'MX-30'],
    'Honda': ['Jazz', 'Civic', 'Accord', 'HR-V', 'CR-V', 'e', 'ZR-V'],
    'Volvo': ['V40', 'V60', 'V90', 'XC40', 'XC60', 'XC90', 'S60', 'S90', 'C40', 'EX30', 'EX90'],
    'Porsche': ['911', '718 Boxster', '718 Cayman', 'Panamera', 'Cayenne', 'Macan', 'Taycan'],
    'Tesla': ['Model 3', 'Model Y', 'Model S', 'Model X'],
    'Mini': ['Cooper', 'Countryman', 'Clubman', 'Cabrio'],
    'Dacia': ['Sandero', 'Duster', 'Jogger', 'Spring'],
    'Subaru': ['Impreza', 'XV', 'Forester', 'Outback', 'BRZ', 'Solterra'],
    'Suzuki': ['Swift', 'Ignis', 'Vitara', 'S-Cross', 'Jimny', 'Across'],
    'Mitsubishi': ['Space Star', 'ASX', 'Eclipse Cross', 'Outlander', 'L200']
};

// Generate years from current year back to 1990
const YEARS = Array.from({ length: new Date().getFullYear() - 1989 }, (_, i) =>
    (new Date().getFullYear() - i).toString()
);

interface VehicleSelectProps {
    make: string;
    model: string;
    year: string;
    onMakeChange: (make: string) => void;
    onModelChange: (model: string) => void;
    onYearChange: (year: string) => void;
}

export function VehicleSelect({
    make, model, year,
    onMakeChange, onModelChange, onYearChange
}: VehicleSelectProps) {

    const availableModels = useMemo(() => {
        return CAR_MODELS[make] || [];
    }, [make]);

    const handleMakeChange = (newMake: string) => {
        onMakeChange(newMake);
        // Reset model when make changes
        if (model && !CAR_MODELS[newMake]?.includes(model)) {
            onModelChange('');
        }
    };

    return (
        <div className="grid grid-cols-3 gap-3">
            {/* Make Select */}
            <div>
                <label className="text-xs text-muted-foreground mb-1 block">Marke</label>
                <Select value={make} onValueChange={handleMakeChange}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Marke wählen" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                        {CAR_MAKES.map(m => (
                            <SelectItem key={m} value={m}>{m}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Model Select */}
            <div>
                <label className="text-xs text-muted-foreground mb-1 block">Modell</label>
                <Select
                    value={model}
                    onValueChange={onModelChange}
                    disabled={!make || availableModels.length === 0}
                >
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder={make ? "Modell wählen" : "Erst Marke"} />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                        {availableModels.map(m => (
                            <SelectItem key={m} value={m}>{m}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Year Select */}
            <div>
                <label className="text-xs text-muted-foreground mb-1 block">Baujahr</label>
                <Select value={year} onValueChange={onYearChange}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Jahr" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                        {YEARS.map(y => (
                            <SelectItem key={y} value={y}>{y}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}
