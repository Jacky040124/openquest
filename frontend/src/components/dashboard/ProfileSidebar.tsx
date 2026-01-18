import { User, Code2, Layers, Target, Folder, Edit2, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { Preferences } from '@/store/preferencesStore';

interface ProfileSidebarProps {
  preferences: Preferences;
  userName?: string;
  onClose: () => void;
  onEditPreferences: () => void;
}

const ProfileSidebar = ({ preferences, userName, onClose, onEditPreferences }: ProfileSidebarProps) => {

  return (
    <div className="fixed inset-y-0 right-0 w-80 bg-card border-l border-border shadow-xl z-50 overflow-y-auto">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-lg hover:bg-muted transition-colors"
      >
        <X className="w-5 h-5 text-muted-foreground" />
      </button>

      <div className="p-6 pt-14">
        {/* Profile Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center">
            <User className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">{userName || 'Developer'}</h3>
            <p className="text-muted-foreground text-sm">
              Open Source Contributor
            </p>
          </div>
        </div>

        <Separator className="mb-6" />

        {/* Preferences Summary */}
        <div className="space-y-5">
          {/* Languages */}
          <div>
            <div className="flex items-center gap-2 text-sm font-medium mb-2">
              <Code2 className="w-4 h-4 text-primary" />
              <span>Languages</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {preferences.languages.length > 0 ? (
                preferences.languages.map((lang) => (
                  <Badge
                    key={lang}
                    variant="secondary"
                    className="text-xs bg-secondary/50"
                  >
                    {lang}
                  </Badge>
                ))
              ) : (
                <span className="text-muted-foreground text-sm">None selected</span>
              )}
            </div>
          </div>

          {/* Skills */}
          <div>
            <div className="flex items-center gap-2 text-sm font-medium mb-2">
              <Layers className="w-4 h-4 text-primary" />
              <span>Skills</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {preferences.skills.length > 0 ? (
                preferences.skills.map((skill) => (
                  <Badge
                    key={skill.name}
                    variant="secondary"
                    className="text-xs bg-secondary/50"
                  >
                    {skill.name}
                  </Badge>
                ))
              ) : (
                <span className="text-muted-foreground text-sm">None selected</span>
              )}
            </div>
          </div>

          {/* Issue Types */}
          <div>
            <div className="flex items-center gap-2 text-sm font-medium mb-2">
              <Target className="w-4 h-4 text-primary" />
              <span>Issue Types</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {preferences.issue_interests.length > 0 ? (
                preferences.issue_interests.map((type) => (
                  <Badge
                    key={type}
                    variant="secondary"
                    className="text-xs bg-secondary/50"
                  >
                    {type}
                  </Badge>
                ))
              ) : (
                <span className="text-muted-foreground text-sm">None selected</span>
              )}
            </div>
          </div>

          {/* Project Types */}
          <div>
            <div className="flex items-center gap-2 text-sm font-medium mb-2">
              <Folder className="w-4 h-4 text-primary" />
              <span>Project Types</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {preferences.project_interests.length > 0 ? (
                preferences.project_interests.map((type) => (
                  <Badge
                    key={type}
                    variant="secondary"
                    className="text-xs bg-secondary/50"
                  >
                    {type}
                  </Badge>
                ))
              ) : (
                <span className="text-muted-foreground text-sm">None selected</span>
              )}
            </div>
          </div>
        </div>

        <Separator className="my-6" />

        {/* Edit Preferences Button */}
        <Button variant="outline" className="w-full gap-2" onClick={onEditPreferences}>
          <Edit2 className="w-4 h-4" />
          Edit Preferences
        </Button>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 gap-4 text-center">
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="text-2xl font-bold text-primary">6</div>
            <div className="text-xs text-muted-foreground">Matches</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="text-2xl font-bold text-accent">360</div>
            <div className="text-xs text-muted-foreground">Open Issues</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSidebar;
