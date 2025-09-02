
export interface Biomarkers {
    [key: string]: number;
}

export interface Preferences {
    diet?: string;
    allergies?: string[];
}

export interface PhotoAnalysisResponse {
    detected: string[];
    products: string[];
}

export interface User {
    id: number;
    username: string;
    email: string;
    password: string;
}

export interface Ingredient {
    name: string;
    amount: string;
}

export interface Recipe {
    name: string;
    time_min?: number;
    description?: string;
    ingredients: Ingredient[];
    instructions: string[];
    tags: string[];
    id: string;
    user_id?: number;
}

