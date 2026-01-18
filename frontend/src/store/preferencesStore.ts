import { create } from 'zustand';

export interface Preferences {
  experienceLevel: string | null;
  languages: string[];
  frameworks: string[];
  issueTypes: string[];
  projectTypes: string[];
}

interface PreferencesState {
  currentStep: number;
  preferences: Preferences;
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  setExperienceLevel: (level: string) => void;
  toggleLanguage: (lang: string) => void;
  toggleFramework: (framework: string) => void;
  toggleIssueType: (type: string) => void;
  toggleProjectType: (type: string) => void;
  resetPreferences: () => void;
}

const initialPreferences: Preferences = {
  experienceLevel: null,
  languages: [],
  frameworks: [],
  issueTypes: [],
  projectTypes: [],
};

export const usePreferencesStore = create<PreferencesState>((set) => ({
  currentStep: 0,
  preferences: initialPreferences,
  
  setStep: (step) => set({ currentStep: step }),
  
  nextStep: () => set((state) => ({ currentStep: Math.min(state.currentStep + 1, 7) })),
  
  prevStep: () => set((state) => ({ currentStep: Math.max(state.currentStep - 1, 0) })),
  
  setExperienceLevel: (level) =>
    set((state) => ({
      preferences: { ...state.preferences, experienceLevel: level },
    })),
  
  toggleLanguage: (lang) =>
    set((state) => ({
      preferences: {
        ...state.preferences,
        languages: state.preferences.languages.includes(lang)
          ? state.preferences.languages.filter((l) => l !== lang)
          : [...state.preferences.languages, lang],
      },
    })),
  
  toggleFramework: (framework) =>
    set((state) => ({
      preferences: {
        ...state.preferences,
        frameworks: state.preferences.frameworks.includes(framework)
          ? state.preferences.frameworks.filter((f) => f !== framework)
          : [...state.preferences.frameworks, framework],
      },
    })),
  
  toggleIssueType: (type) =>
    set((state) => ({
      preferences: {
        ...state.preferences,
        issueTypes: state.preferences.issueTypes.includes(type)
          ? state.preferences.issueTypes.filter((t) => t !== type)
          : [...state.preferences.issueTypes, type],
      },
    })),
  
  toggleProjectType: (type) =>
    set((state) => ({
      preferences: {
        ...state.preferences,
        projectTypes: state.preferences.projectTypes.includes(type)
          ? state.preferences.projectTypes.filter((t) => t !== type)
          : [...state.preferences.projectTypes, type],
      },
    })),
  
  resetPreferences: () => set({ currentStep: 0, preferences: initialPreferences }),
}));
