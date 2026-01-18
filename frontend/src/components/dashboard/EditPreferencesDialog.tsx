import { useState } from 'react';
import { User, Lock, Code2, Layers, Target, Folder, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/authStore';
import { usePreferencesStore } from '@/store/preferencesStore';
import { cn } from '@/lib/utils';

interface EditPreferencesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const defaultLanguages = ['JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'Go', 'Rust', 'Ruby', 'PHP', 'Swift', 'Kotlin', 'C#'];
const defaultFrameworks = ['React', 'Vue', 'Angular', 'Next.js', 'Express', 'Django', 'Flask', 'Spring', 'Rails', 'Laravel', 'FastAPI', 'NestJS'];
const defaultIssueTypes = ['Bug Fixes', 'Documentation', 'Feature Development', 'Testing', 'Performance', 'Security', 'Accessibility', 'Refactoring'];
const defaultProjectTypes = ['Web Applications', 'CLI Tools', 'Libraries', 'Mobile Apps', 'DevOps', 'Machine Learning', 'Blockchain', 'Game Development'];

const EditPreferencesDialog = ({ open, onOpenChange }: EditPreferencesDialogProps) => {
  const { user, login } = useAuthStore();
  const { preferences, toggleLanguage, toggleFramework, toggleIssueType, toggleProjectType } = usePreferencesStore();
  
  const [username, setUsername] = useState(user?.username || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    account: true,
    languages: false,
    frameworks: false,
    issueTypes: false,
    projectTypes: false,
  });

  // Custom input states
  const [showOtherInput, setShowOtherInput] = useState<Record<string, boolean>>({
    languages: false,
    frameworks: false,
    issueTypes: false,
    projectTypes: false,
  });
  const [otherInputValues, setOtherInputValues] = useState<Record<string, string>>({
    languages: '',
    frameworks: '',
    issueTypes: '',
    projectTypes: '',
  });

  // Track custom items added by user
  const [customItems, setCustomItems] = useState<Record<string, string[]>>({
    languages: [],
    frameworks: [],
    issueTypes: [],
    projectTypes: [],
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleSaveAccount = () => {
    if (username.trim()) {
      login(username.trim());
    }
  };

  const handleSavePassword = () => {
    if (newPassword && newPassword === confirmPassword) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  const handleAddCustomItem = (section: string, onToggle: (item: string) => void) => {
    const value = otherInputValues[section].trim();
    if (value) {
      // Add to custom items if not already in defaults
      const allDefaults = {
        languages: defaultLanguages,
        frameworks: defaultFrameworks,
        issueTypes: defaultIssueTypes,
        projectTypes: defaultProjectTypes,
      };
      
      if (!allDefaults[section as keyof typeof allDefaults].includes(value) && 
          !customItems[section].includes(value)) {
        setCustomItems(prev => ({
          ...prev,
          [section]: [...prev[section], value]
        }));
      }
      
      // Toggle the item (select it)
      onToggle(value);
      
      // Reset input
      setOtherInputValues(prev => ({ ...prev, [section]: '' }));
      setShowOtherInput(prev => ({ ...prev, [section]: false }));
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

  const SelectionGridWithOther = ({ 
    section,
    defaultItems,
    selected, 
    onToggle 
  }: { 
    section: string;
    defaultItems: string[];
    selected: string[]; 
    onToggle: (item: string) => void;
  }) => {
    const allItems = [...defaultItems, ...customItems[section]];
    
    return (
      <div className="p-3 space-y-3">
        <div className="flex flex-wrap gap-2">
          {allItems.map((item) => (
            <button
              key={item}
              onClick={() => onToggle(item)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                selected.includes(item)
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border hover:border-primary/50"
              )}
            >
              {item}
            </button>
          ))}
          
          {/* Other button */}
          {!showOtherInput[section] && (
            <button
              onClick={() => setShowOtherInput(prev => ({ ...prev, [section]: true }))}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all bg-card border border-dashed border-border hover:border-primary/50 flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              Other
            </button>
          )}
        </div>
        
        {/* Custom input field */}
        {showOtherInput[section] && (
          <div className="flex gap-2">
            <Input
              value={otherInputValues[section]}
              onChange={(e) => setOtherInputValues(prev => ({ ...prev, [section]: e.target.value }))}
              placeholder="Enter custom option..."
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddCustomItem(section, onToggle);
                }
              }}
            />
            <Button 
              size="sm" 
              onClick={() => handleAddCustomItem(section, onToggle)}
              disabled={!otherInputValues[section].trim()}
            >
              Add
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => {
                setShowOtherInput(prev => ({ ...prev, [section]: false }));
                setOtherInputValues(prev => ({ ...prev, [section]: '' }));
              }}
            >
              Cancel
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Profile & Preferences</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Account Section */}
          <div>
            <SectionHeader section="account" icon={User} title="Account Settings" />
            {expandedSections.account && (
              <div className="mt-3 space-y-4 p-3 border border-border rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter username"
                  />
                  <Button size="sm" onClick={handleSaveAccount} className="mt-2">
                    Update Username
                  </Button>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Change Password
                  </Label>
                  <Input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Current password"
                  />
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New password"
                  />
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                  />
                  <Button 
                    size="sm" 
                    onClick={handleSavePassword}
                    disabled={!currentPassword || !newPassword || newPassword !== confirmPassword}
                    className="mt-2"
                  >
                    Update Password
                  </Button>
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
              <SelectionGridWithOther 
                section="languages"
                defaultItems={defaultLanguages} 
                selected={preferences.languages} 
                onToggle={toggleLanguage} 
              />
            )}
          </div>

          {/* Frameworks Section */}
          <div>
            <SectionHeader 
              section="frameworks" 
              icon={Layers} 
              title="Frameworks" 
              count={preferences.frameworks.length} 
            />
            {expandedSections.frameworks && (
              <SelectionGridWithOther 
                section="frameworks"
                defaultItems={defaultFrameworks} 
                selected={preferences.frameworks} 
                onToggle={toggleFramework} 
              />
            )}
          </div>

          {/* Issue Types Section */}
          <div>
            <SectionHeader 
              section="issueTypes" 
              icon={Target} 
              title="Issue Types" 
              count={preferences.issueTypes.length} 
            />
            {expandedSections.issueTypes && (
              <SelectionGridWithOther 
                section="issueTypes"
                defaultItems={defaultIssueTypes} 
                selected={preferences.issueTypes} 
                onToggle={toggleIssueType} 
              />
            )}
          </div>

          {/* Project Types Section */}
          <div>
            <SectionHeader 
              section="projectTypes" 
              icon={Folder} 
              title="Project Types" 
              count={preferences.projectTypes.length} 
            />
            {expandedSections.projectTypes && (
              <SelectionGridWithOther 
                section="projectTypes"
                defaultItems={defaultProjectTypes} 
                selected={preferences.projectTypes} 
                onToggle={toggleProjectType} 
              />
            )}
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <Button onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditPreferencesDialog;
