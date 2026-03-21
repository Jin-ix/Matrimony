export type UserRole = 'candidate' | 'scout';
export type Gender = 'male' | 'female';
export type Compatibility = 'green' | 'yellow' | 'red';
export type InteractionType = 'interest' | 'pass' | 'recommend';
export type ConversationType = 'direct';

export type Rite =
    | 'Syro-Malabar'
    | 'Latin'
    | 'Knanaya Catholic'
    | 'Malankara Orthodox'
    | 'Syro-Malankara'
    | 'Other';

export type NotificationType =
    | 'new_interest'
    | 'mutual_match'
    | 'new_message'
    | 'profile_verified'
    | 'scout_recommendation'
    | 'kitchen_table';

export type Education =
    | 'Bachelors'
    | 'Masters'
    | 'Doctorate'
    | 'Professional Degree';

export type DietaryPreference =
    | 'Vegetarian'
    | 'Non-Vegetarian'
    | 'Pescatarian'
    | 'Any';

export interface DiscoveryFilters {
    rite?: string;
    orthodoxBridge?: boolean;
    strictKnanaya?: boolean;
    minAge?: number;
    maxAge?: number;
    education?: string;
    diet?: string;
}

export interface MatchProfileResponse {
    id: string;
    name: string;
    age: number;
    gender: Gender;
    location: string;
    rite: string;
    image: string;
    compatibility: Compatibility;
    dealbreaker?: string;
    scoutRecommended?: boolean;
    hobbies?: string[];
}
