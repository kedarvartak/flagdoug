import { useState } from 'react';
import { MoreVertical, ToggleLeft, Percent, Split } from 'lucide-react';
import type { Flag, Environment } from '../../types/api.types';
import { FlagType } from '../../types/api.types';
import { getFlagCardStyles } from './FlagCard.styles';
import { useTheme } from '../../context/ThemeContext';
import { useFlagsContext } from '../../context/FlagsContext';
import { EditFlagModal } from '../EditFlagModal';
import { DeleteConfirmDialog } from '../DeleteConfirmDialog';

interface FlagCardProps {
  flag: Flag;
  currentEnvironment: Environment;
  onToggle?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const FlagCard = ({ flag, currentEnvironment, onToggle, onEdit, onDelete }: FlagCardProps) => {
  const { theme } = useTheme();
  const { toggleEnvironment, refreshFlags, isOperationLoading } = useFlagsContext();
  const [isHovered, setIsHovered] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hoveredMenuItem, setHoveredMenuItem] = useState<string | null>(null);
  const styles = getFlagCardStyles(theme, isHovered);
  
  const envConfig = flag.environments.find((e) => e.environment === currentEnvironment);
  const isEnabled = envConfig?.enabled ?? false;
  
  // Get loading state from context (optimistic updates are handled in the hook)
  const isToggling = isOperationLoading('toggling', flag.id, currentEnvironment);
  const isUpdating = isOperationLoading('updating', flag.id);
  const isDeleting = isOperationLoading('deleting', flag.id);

  // Handle toggle with API integration
  const handleToggle = async () => {
    if (isToggling) return;

    const newEnabledState = !isEnabled;

    // Optimistic update is handled in the useFlags hook
    const result = await toggleEnvironment(flag.id, currentEnvironment, {
      enabled: newEnabledState,
      rolloutPercentage: envConfig?.rolloutPercentage,
    });

    if (result) {
      // Success - call optional callback
      onToggle?.();
    }
    // Error handling and rollback are handled in the useFlags hook
  };

  // Handle edit button click
  const handleEdit = () => {
    setIsEditModalOpen(true);
    onEdit?.();
  };

  // Handle successful edit
  const handleEditSuccess = async () => {
    // Refresh flags to get updated data
    await refreshFlags();
  };

  // Handle delete button click
  const handleDelete = () => {
    setIsDeleteDialogOpen(true);
    onDelete?.();
  };

  // Handle successful deletion
  const handleDeleteSuccess = async () => {
    // Refresh flags to remove deleted flag from list
    await refreshFlags();
  };

  return (
    <div 
      style={styles.card}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={styles.header}>
        <div style={styles.info}>
          <div style={styles.nameRow}>
            <h3 style={styles.name}>
              {flag.name}
              {(isUpdating || isDeleting) && (
                <span style={{ marginLeft: '8px', fontSize: '11px', color: theme.colors.textMuted }}>
                  {isUpdating && '(updating...)'}
                  {isDeleting && '(deleting...)'}
                </span>
              )}
            </h3>
          </div>
          <code style={styles.key}>{flag.key}</code>
        </div>
        
        <div style={styles.actions}>
          <button
            onClick={handleToggle}
            disabled={isToggling || isDeleting}
            style={{
              ...styles.toggleSwitch,
              ...(isToggling || isDeleting ? { opacity: 0.6, cursor: 'not-allowed' } : {}),
            }}
            title={isToggling ? 'Toggling...' : isEnabled ? 'Disable' : 'Enable'}
            aria-busy={isToggling}
          >
            <div style={{
              ...styles.toggleTrack,
              ...(isEnabled ? styles.toggleTrackOn : styles.toggleTrackOff),
            }}>
              <div style={{
                ...styles.toggleThumb,
                ...(isEnabled ? styles.toggleThumbOn : styles.toggleThumbOff),
              }} />
            </div>
          </button>
          
          <div style={styles.menuContainer}>
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              style={styles.menuButton}
              disabled={isUpdating || isDeleting}
              title="More options"
            >
              <MoreVertical size={16} color={theme.colors.textSecondary} strokeWidth={2} />
            </button>
            
            {isMenuOpen && (
              <>
                <div 
                  style={styles.menuOverlay} 
                  onClick={() => setIsMenuOpen(false)}
                />
                <div style={styles.menu}>
                  <button 
                    onClick={() => {
                      setIsMenuOpen(false);
                      handleEdit();
                    }}
                    style={{
                      ...styles.menuItem,
                      ...(hoveredMenuItem === 'edit' ? styles.menuItemHover : {}),
                    }}
                    onMouseEnter={() => setHoveredMenuItem('edit')}
                    onMouseLeave={() => setHoveredMenuItem(null)}
                    disabled={isUpdating || isDeleting}
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => {
                      setIsMenuOpen(false);
                      handleDelete();
                    }}
                    style={{
                      ...styles.menuItem, 
                      ...styles.menuItemDanger,
                      ...(hoveredMenuItem === 'delete' ? styles.menuItemHover : {}),
                    }}
                    onMouseEnter={() => setHoveredMenuItem('delete')}
                    onMouseLeave={() => setHoveredMenuItem(null)}
                    disabled={isDeleting || isUpdating}
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {flag.description && (
        <p style={styles.description}>{flag.description}</p>
      )}

      <div style={styles.meta}>
        <span style={styles.badge}>
          {flag.type === FlagType.BOOLEAN && <ToggleLeft size={14} strokeWidth={2} />}
          {flag.type === FlagType.PERCENTAGE && <Percent size={14} strokeWidth={2} />}
          {flag.type === FlagType.MULTIVARIATE && <Split size={14} strokeWidth={2} />}
          {flag.type}
        </span>
        {flag.type === FlagType.PERCENTAGE && envConfig?.rolloutPercentage !== undefined && (
          <span style={styles.rollout}>
            <Percent size={14} strokeWidth={2} />
            {envConfig.rolloutPercentage}% rollout
          </span>
        )}
        <span style={styles.date}>{new Date(flag.updatedAt).toLocaleDateString()}</span>
      </div>

      {/* Edit Flag Modal */}
      <EditFlagModal
        isOpen={isEditModalOpen}
        flag={flag}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={handleEditSuccess}
      />

      {/* Delete Confirm Dialog */}
      <DeleteConfirmDialog
        isOpen={isDeleteDialogOpen}
        flagName={flag.name}
        flagId={flag.id}
        onConfirm={handleDeleteSuccess}
        onCancel={() => setIsDeleteDialogOpen(false)}
      />
    </div>
  );
};
