import { create } from 'zustand';
import type { SkillName, Familiarity, ProjectInterest, IssueInterest, SkillInputDTO } from '@/types/api';

// Skill with familiarity for UI state
export interface SkillWithFamiliarity {
  name: SkillName;
  familiarity: Familiarity;
}

export interface Preferences {
  languages: string[];
  skills: SkillWithFamiliarity[];
  issue_interests: IssueInterest[];
  project_interests: ProjectInterest[];
}

interface PreferencesState {
  currentStep: number;
  preferences: Preferences;
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  toggleLanguage: (lang: string) => void;
  addSkill: (skill: SkillWithFamiliarity) => void;
  removeSkill: (skillName: SkillName) => void;
  updateSkillFamiliarity: (skillName: SkillName, familiarity: Familiarity) => void;
  toggleIssueInterest: (interest: IssueInterest) => void;
  toggleProjectInterest: (interest: ProjectInterest) => void;
  resetPreferences: () => void;
  getSkillsForApi: () => SkillInputDTO[];
}

const initialPreferences: Preferences = {
  languages: [],
  skills: [],
  issue_interests: [],
  project_interests: [],
};

// Total steps: Welcome(0), Languages(1), Skills(2), IssueTypes(3), ProjectTypes(4), Summary(5), CreateAccount(6)
// GitHub OAuth is done after signup in Dashboard
const TOTAL_STEPS = 6;

export const usePreferencesStore = create<PreferencesState>((set, get) => ({
  currentStep: 0,
  preferences: initialPreferences,

  setStep: (step) => set({ currentStep: step }),

  nextStep: () => set((state) => ({ currentStep: Math.min(state.currentStep + 1, TOTAL_STEPS) })),

  prevStep: () => set((state) => ({ currentStep: Math.max(state.currentStep - 1, 0) })),

  toggleLanguage: (lang) =>
    set((state) => ({
      preferences: {
        ...state.preferences,
        languages: state.preferences.languages.includes(lang)
          ? state.preferences.languages.filter((l) => l !== lang)
          : [...state.preferences.languages, lang],
      },
    })),

  addSkill: (skill) =>
    set((state) => {
      const exists = state.preferences.skills.find((s) => s.name === skill.name);
      if (exists) return state;
      return {
        preferences: {
          ...state.preferences,
          skills: [...state.preferences.skills, skill],
        },
      };
    }),

  removeSkill: (skillName) =>
    set((state) => ({
      preferences: {
        ...state.preferences,
        skills: state.preferences.skills.filter((s) => s.name !== skillName),
      },
    })),

  updateSkillFamiliarity: (skillName, familiarity) =>
    set((state) => ({
      preferences: {
        ...state.preferences,
        skills: state.preferences.skills.map((s) =>
          s.name === skillName ? { ...s, familiarity } : s
        ),
      },
    })),

  toggleIssueInterest: (interest) =>
    set((state) => ({
      preferences: {
        ...state.preferences,
        issue_interests: state.preferences.issue_interests.includes(interest)
          ? state.preferences.issue_interests.filter((i) => i !== interest)
          : [...state.preferences.issue_interests, interest],
      },
    })),

  toggleProjectInterest: (interest) =>
    set((state) => ({
      preferences: {
        ...state.preferences,
        project_interests: state.preferences.project_interests.includes(interest)
          ? state.preferences.project_interests.filter((i) => i !== interest)
          : [...state.preferences.project_interests, interest],
      },
    })),

  resetPreferences: () => set({ currentStep: 0, preferences: initialPreferences }),

  getSkillsForApi: () => {
    return get().preferences.skills.map((skill) => ({
      name: skill.name,
      familiarity: skill.familiarity,
    }));
  },
}));
