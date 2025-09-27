// One-time cleanup utility to fix existing duplicate drafts in localStorage
export const cleanupExistingDuplicates = () => {
  try {
    console.log('Starting cleanup of existing duplicate drafts...');

    const metadataStr = localStorage.getItem('draft_metadata');
    if (!metadataStr) return;

    const metadata = JSON.parse(metadataStr);
    console.log('Found metadata entries:', metadata.length);

    // Group by client name and phone
    const clientGroups = new Map();
    metadata.forEach((draft: any) => {
      const clientKey = `${draft.clientName?.toLowerCase().trim() || ''}-${draft.clientPhone?.replace(/\s+/g, '') || ''}`;
      if (clientKey !== '-') {
        if (!clientGroups.has(clientKey)) {
          clientGroups.set(clientKey, []);
        }
        clientGroups.get(clientKey).push(draft);
      }
    });

    // Remove duplicates, keep most recent
    let removedCount = 0;
    const toKeep = [];

    clientGroups.forEach(drafts => {
      if (drafts.length > 1) {
        // Sort by date, keep newest
        drafts.sort((a: any, b: any) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
        const newest = drafts[0];
        const toRemove = drafts.slice(1);

        // Remove old drafts
        toRemove.forEach((draft: any) => {
          localStorage.removeItem(`draft_${draft.formKey}`);
          console.log('Removed duplicate:', draft.formKey);
          removedCount++;
        });

        toKeep.push(newest);
      } else {
        toKeep.push(drafts[0]);
      }
    });

    // Add any drafts that didn't have duplicates
    metadata.forEach((draft: any) => {
      const clientKey = `${draft.clientName?.toLowerCase().trim() || ''}-${draft.clientPhone?.replace(/\s+/g, '') || ''}`;
      if (clientKey === '-') {
        toKeep.push(draft);
      }
    });

    // Update metadata
    localStorage.setItem('draft_metadata', JSON.stringify(toKeep));

    console.log(`Cleanup complete! Removed ${removedCount} duplicate drafts. Kept ${toKeep.length} drafts.`);
    return { removed: removedCount, kept: toKeep.length };
  } catch (error) {
    console.error('Failed to cleanup duplicates:', error);
    return { removed: 0, kept: 0 };
  }
};

// Call this once to clean up existing duplicates
// cleanupExistingDuplicates();