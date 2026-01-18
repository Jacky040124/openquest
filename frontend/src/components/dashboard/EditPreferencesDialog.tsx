import { useState, useEffect } from 'react';
import { User, Code2, Wrench, Target, Folder, ChevronDown, ChevronUp, Plus, X, Loader2, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store/authStore';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { usePreferencesStore, SkillWithFamiliarity } from '@/store/preferencesStore';
import { useUpdatePreferences, useUserPreferences } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import type { SkillName, Familiarity, IssueInterest, ProjectInterest } from '@/types/api';

interface EditPreferencesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Default options matching backend enums
const defaultLanguages = ['JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'Go', 'Rust', 'Ruby', 'PHP', 'Swift', 'Kotlin', 'C#'];

const defaultSkills: { id: SkillName; label: string }[] = [
  { id: 'react', label: 'React' },
  { id: 'vue', label: 'Vue' },
  { id: 'angular', label: 'Angular' },
  { id: 'nextjs', label: 'Next.js' },
  { id: 'express', label: 'Express' },
  { id: 'django', label: 'Django' },
  { id: 'fastapi', label: 'FastAPI' },
  { id: 'flask', label: 'Flask' },
  { id: 'spring', label: 'Spring' },
  { id: 'docker', label: 'Docker' },
  { id: 'kubernetes', label: 'Kubernetes' },
  { id: 'postgres', label: 'PostgreSQL' },
  { id: 'mongodb', label: 'MongoDB' },
  { id: 'redis', label: 'Redis' },
  { id: 'aws', label: 'AWS' },
  { id: 'gcp', label: 'GCP' },
];

const defaultIssueInterests: { id: IssueInterest; label: string }[] = [
  { id: 'bug_fix', label: 'Bug Fixes' },
  { id: 'feature', label: 'Features' },
  { id: 'enhancement', label: 'Enhancements' },
  { id: 'documentation', label: 'Documentation' },
  { id: 'refactor', label: 'Refactoring' },
  { id: 'testing', label: 'Testing' },
  { id: 'security', label: 'Security' },
  { id: 'optimization', label: 'Optimization' },
  { id: 'accessibility', label: 'Accessibility' },
  { id: 'ui_ux', label: 'UI/UX' },
];

const defaultProjectInterests: { id: ProjectInterest; label: string }[] = [
  { id: 'webapp', label: 'Web Apps' },
  { id: 'mobile', label: 'Mobile' },
  { id: 'cli', label: 'CLI Tools' },
  { id: 'api', label: 'APIs' },
  { id: 'library', label: 'Libraries' },
  { id: 'llm', label: 'LLM/AI' },
  { id: 'ml', label: 'Machine Learning' },
  { id: 'devtools', label: 'DevTools' },
  { id: 'infrastructure', label: 'Infrastructure' },
  { id: 'game', label: 'Games' },
];

const familiarityLevels: { id: Familiarity; label: string }[] = [
  { id: 'beginner', label: 'Beginner' },
  { id: 'intermediate', label: 'Intermediate' },
  { id: 'advanced', label: 'Advanced' },
  { id: 'expert', label: 'Expert' },
];

const EditPreferencesDialog = ({ open, onOpenChange }: EditPreferencesDialogProps) => {
  const { user } = useAuthStore();
  const {
    preferences,
    toggleLanguage,
    addSkill,
    removeSkill,
    updateSkillFamiliarity,
    toggleIssueInterest,
    toggleProjectInterest,
    getSkillsForApi,
  } = usePreferencesStore();

  const { data: userPrefs, refetch: refetchPrefs } = useUserPreferences();
  const updatePrefsMutation = useUpdatePreferences();

  const [editedUsername, setEditedUsername] = useState(userPrefs?.user_name || '');
  const [usernameError, setUsernameError] = useState('');

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    account: true,
    languages: false,
    skills: false,
    issueInterests: false,
    projectInterests: false,
  });

  // Custom input states
  const [showOtherInput, setShowOtherInput] = useState<Record<string, boolean>>({
    languages: false,
  });
  const [otherInputValues, setOtherInputValues] = useState<Record<string, string>>({
    languages: '',
  });
  const [customLanguages, setCustomLanguages] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Reset username when dialog opens
  useEffect(() => {
    if (open) {
      setEditedUsername(userPrefs?.user_name || '');
      setUsernameError('');
    }
  }, [open, userPrefs?.user_name]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleAddCustomLanguage = () => {
    const value = otherInputValues.languages.trim();
    if (value && !customLanguages.includes(value) && !defaultLanguages.includes(value)) {
      setCustomLanguages(prev => [...prev, value]);
      toggleLanguage(value);
      setOtherInputValues(prev => ({ ...prev, languages: '' }));
      setShowOtherInput(prev => ({ ...prev, languages: false }));
    }
  };

  const isSkillSelected = (skillName: SkillName) => {
    return preferences.skills.some(s => s.name === skillName);
  };

  const getSkillFamiliarity = (skillName: SkillName): Familiarity | null => {
    const skill = preferences.skills.find(s => s.name === skillName);
    return skill?.familiarity || null;
  };

  const handleSkillClick = (skillId: SkillName) => {
    if (isSkillSelected(skillId)) {
      removeSkill(skillId);
    } else {
      const newSkill: SkillWithFamiliarity = { name: skillId, familiarity: 'beginner' };
      addSkill(newSkill);
    }
  };

  const validateUsername = (value: string): boolean => {
    if (!value.trim()) {
      setUsernameError('Username is required');
      return false;
    }
    if (value.trim().length < 3) {
      setUsernameError('Username must be at least 3 characters');
      return false;
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(value.trim())) {
      setUsernameError('Username can only contain letters, numbers, underscores, and hyphens');
      return false;
    }
    setUsernameError('');
    return true;
  };

  const handleSave = async () => {
    if (!validateUsername(editedUsername)) {
      return;
    }

    setIsSaving(true);
    try {
      // Update preferences including user_name
      try {
        await updatePrefsMutation.mutateAsync({
          user_name: editedUsername.trim(),
          languages: preferences.languages,
          skills: getSkillsForApi(),
          project_interests: preferences.project_interests,
          issue_interests: preferences.issue_interests,
        });
        await refetchPrefs();
      } catch {
        // API failed, preferences are already in local store
      }
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const SectionHeader = ({
    section,
    icon: Icon,
    title,
    count
  }: {
    section: string;
    icon: React.ElementType;
    title: string;
    count?: number;
  }) => (
    <button
      onClick={() => toggleSection(section)}
      className="w-full flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
    >
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-primary" />
        <span className="font-medium">{title}</span>
        {count !== undefined && count > 0 && (
          <Badge variant="secondary" className="text-xs">{count}</Badge>
        )}
      </div>
      {expandedSections[section] ? (
        <ChevronUp className="w-4 h-4 text-muted-foreground" />
      ) : (
        <ChevronDown className="w-4 h-4 text-muted-foreground" />
      )}
    </button>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Profile & Preferences</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Account Section */}
          <div>
            <SectionHeader section="account" icon={User} title="Account Info" />
            {expandedSections.account && (
              <div className="mt-3 p-3 border border-border rounded-lg space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">{user?.email || 'Not logged in'}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-medium">Username</Label>
                  <Input
                    id="username"
                    value={editedUsername}
                    onChange={(e) => {
                      setEditedUsername(e.target.value);
                      setUsernameError('');
                    }}
                    placeholder="Enter username"
                    className={cn(usernameError && "border-destructive")}
                  />
                  {usernameError && (
                    <p className="text-xs text-destructive">{usernameError}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Languages Section */}
          <div>
            <SectionHeader
              section="languages"
              icon={Code2}
              title="Languages"
              count={preferences.languages.length}
            />
            {expandedSections.languages && (
              <div className="p-3 space-y-3">
                <div className="flex flex-wrap gap-2">
                  {[...defaultLanguages, ...customLanguages].map((lang) => (
                    <button
                      key={lang}
                      onClick={() => toggleLanguage(lang)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                        preferences.languages.includes(lang)
                          ? "bg-secondary text-secondary-foreground"
                          : "bg-card border border-border hover:border-secondary/50"
                      )}
                    >
                      {lang}
                    </button>
                  ))}

                  {!showOtherInput.languages && (
                    <button
                      onClick={() => setShowOtherInput(prev => ({ ...prev, languages: true }))}
                      className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all bg-card border border-dashed border-border hover:border-secondary/50 flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      Other
                    </button>
                  )}
                </div>

                {showOtherInput.languages && (
                  <div className="flex gap-2">
                    <Input
                      value={otherInputValues.languages}
                      onChange={(e) => setOtherInputValues(prev => ({ ...prev, languages: e.target.value }))}
                      placeholder="Enter language..."
                      className="flex-1"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddCustomLanguage();
                      }}
                    />
                    <Button size="sm" onClick={handleAddCustomLanguage}>Add</Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setShowOtherInput(prev => ({ ...prev, languages: false }));
                        setOtherInputValues(prev => ({ ...prev, languages: '' }));
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Skills Section */}
          <div>
            <SectionHeader
              section="skills"
              icon={Wrench}
              title="Skills"
              count={preferences.skills.length}
            />
            {expandedSections.skills && (
              <div className="p-3 space-y-3">
                <div className="flex flex-wrap gap-2">
                  {defaultSkills.map((skill) => {
                    const selected = isSkillSelected(skill.id);
                    const familiarity = getSkillFamiliarity(skill.id);

                    if (selected) {
                      return (
                        <DropdownMenu key={skill.id}>
                          <DropdownMenuTrigger asChild>
                            <button
                              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all bg-secondary text-secondary-foreground flex items-center gap-1.5"
                            >
                              {skill.label}
                              <span className="text-xs opacity-80">
                                ({familiarityLevels.find(l => l.id === familiarity)?.label.charAt(0)})
                              </span>
                              <ChevronDown className="w-3 h-3 opacity-60" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="bg-popover border border-border z-50">
                            {familiarityLevels.map((level) => (
                              <DropdownMenuItem
                                key={level.id}
                                onClick={() => updateSkillFamiliarity(skill.id, level.id)}
                                className={cn(
                                  "cursor-pointer",
                                  familiarity === level.id && "bg-secondary/20"
                                )}
                              >
                                <Check className={cn("w-4 h-4 mr-2", familiarity === level.id ? "opacity-100" : "opacity-0")} />
                                {level.label}
                              </DropdownMenuItem>
                            ))}
                            <DropdownMenuItem
                              onClick={() => removeSkill(skill.id)}
                              className="cursor-pointer text-destructive focus:text-destructive"
                            >
                              <X className="w-4 h-4 mr-2" />
                              Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      );
                    }

                    return (
                      <button
                        key={skill.id}
                        onClick={() => handleSkillClick(skill.id)}
                        className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all bg-card border border-border hover:border-secondary/50"
                      >
                        {skill.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Issue Interests Section */}
          <div>
            <SectionHeader
              section="issueInterests"
              icon={Target}
              title="Issue Types"
              count={preferences.issue_interests.length}
            />
            {expandedSections.issueInterests && (
              <div className="p-3">
                <div className="flex flex-wrap gap-2">
                  {defaultIssueInterests.map((interest) => (
                    <button
                      key={interest.id}
                      onClick={() => toggleIssueInterest(interest.id)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                        preferences.issue_interests.includes(interest.id)
                          ? "bg-secondary text-secondary-foreground"
                          : "bg-card border border-border hover:border-secondary/50"
                      )}
                    >
                      {interest.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Project Interests Section */}
          <div>
            <SectionHeader
              section="projectInterests"
              icon={Folder}
              title="Project Types"
              count={preferences.project_interests.length}
            />
            {expandedSections.projectInterests && (
              <div className="p-3">
                <div className="flex flex-wrap gap-2">
                  {defaultProjectInterests.map((interest) => (
                    <button
                      key={interest.id}
                      onClick={() => toggleProjectInterest(interest.id)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                        preferences.project_interests.includes(interest.id)
                          ? "bg-secondary text-secondary-foreground"
                          : "bg-card border border-border hover:border-secondary/50"
                      )}
                    >
                      {interest.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditPreferencesDialog;
