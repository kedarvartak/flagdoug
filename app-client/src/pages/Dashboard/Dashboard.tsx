import { useState, useMemo } from "react";
import { Flag, Users } from "lucide-react";
import { Header } from "../../components/Header";
import { Sidebar } from "../../components/Sidebar";
import { FlagToolbar } from "../../components/FlagToolbar";
import { FlagList } from "../../components/FlagList";
import { StatCard } from "../../components/StatCard";
import { SkeletonStatCard } from "../../components/SkeletonStatCard";
import { Pagination } from "../../components/Pagination";
import { CreateFlagModal } from "../../components/CreateFlagModal";
import { getDashboardStyles } from "./Dashboard.styles";
import { useTheme } from "../../context/ThemeContext";
import { useFlagsContext } from "../../context/FlagsContext";
import { useDebounce } from "../../hooks/useDebounce";
import { Environment, FlagType } from "../../types/api.types";
import type { SortOption } from "../../components/SortButton";
import type { FilterOptions } from "../../components/FilterButton";

export const Dashboard = () => {
  const { theme } = useTheme();
  const styles = getDashboardStyles(theme);
  const { flags, loading, error, refreshFlags, pagination, currentPage, fetchFlags } = useFlagsContext();
  
  const [currentEnvironment, setCurrentEnvironment] = useState<Environment>(
    Environment.DEVELOPMENT
  );
  const [activeView, setActiveView] = useState("flags");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [currentSort, setCurrentSort] = useState<SortOption>({ field: 'created', direction: 'desc' });
  const [currentFilters, setCurrentFilters] = useState<FilterOptions>({});

  // Debounce search query to reduce filtering operations
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const handlePageChange = (page: number) => {
    fetchFlags(page);
  };

  // Filter and sort flags based on search query, filters, and sort options
  const filteredAndSortedFlags = useMemo(() => {
    let result = [...flags];

    // Apply search filter
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase().trim();
      result = result.filter(
        (flag) =>
          flag.name.toLowerCase().includes(query) ||
          flag.key.toLowerCase().includes(query)
      );
    }

    // Apply type filters
    if (currentFilters.types && currentFilters.types.length > 0) {
      result = result.filter(flag => currentFilters.types!.includes(flag.type as any));
    }

    // Apply status filters
    if (currentFilters.status && currentFilters.status.length > 0) {
      result = result.filter(flag => {
        const env = flag.environments.find(e => e.environment === currentEnvironment);
        const isEnabled = env?.enabled ?? false;
        const status = isEnabled ? 'enabled' : 'disabled';
        return currentFilters.status!.includes(status as any);
      });
    }

    // Apply environment filters (check if flag has environments)
    if (currentFilters.environments && currentFilters.environments.length > 0) {
      result = result.filter(flag => 
        flag.environments.some(env => 
          currentFilters.environments!.includes(env.environment as any)
        )
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (currentSort.field) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'key':
          aValue = a.key.toLowerCase();
          bValue = b.key.toLowerCase();
          break;
        case 'created':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'updated':
          aValue = new Date(a.updatedAt).getTime();
          bValue = new Date(b.updatedAt).getTime();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return currentSort.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return currentSort.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [flags, debouncedSearchQuery, currentFilters, currentSort, currentEnvironment]);

  const stats = useMemo(() => {
    const totalFlags = flags.length;
    const enabledFlags = flags.filter((flag) => {
      const env = flag.environments.find((e) => e.environment === currentEnvironment);
      return env?.enabled ?? false;
    }).length;
    const percentageFlags = flags.filter(
      (flag) => flag.type === FlagType.PERCENTAGE
    ).length;
    const recentlyUpdated = flags.filter((flag) => {
      const daysSinceUpdate =
        (Date.now() - new Date(flag.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceUpdate <= 7;
    }).length;

    return {
      totalFlags,
      enabledFlags,
      percentageFlags,
      recentlyUpdated,
    };
  }, [flags, currentEnvironment]);

  const handleToggleFlag = (flagId: string) => {
    // This will be implemented in task 11.1
    console.log("Toggle flag:", flagId);
  };

  const handleEditFlag = (flagId: string) => {
    console.log("Edit flag:", flagId);
  };

  const handleDeleteFlag = (flagId: string) => {
    // This will be implemented in task 11.3
    console.log("Delete flag:", flagId);
  };

  const handleCreateFlag = () => {
    setIsCreateModalOpen(true);
  };

  const handleCreateSuccess = () => {
    refreshFlags();
  };

  return (
    <div style={styles.container}>
      <div style={styles.main}>
        <Sidebar activeView={activeView} onViewChange={setActiveView} />

        <div style={styles.content}>
          <Header title="Dashboard" />
          
          <main style={styles.mainContent}>
            {activeView === "flags" && (
              <>


                <FlagToolbar
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  onCreateFlag={handleCreateFlag}
                  resultCount={filteredAndSortedFlags.length}
                  totalCount={flags.length}
                  currentSort={currentSort}
                  onSortChange={setCurrentSort}
                  currentFilters={currentFilters}
                  onFiltersChange={setCurrentFilters}
                />

                <FlagList
                  flags={filteredAndSortedFlags}
                  currentEnvironment={currentEnvironment}
                  onToggleFlag={handleToggleFlag}
                  onEditFlag={handleEditFlag}
                  onDeleteFlag={handleDeleteFlag}
                  loading={loading}
                  error={error}
                  onRetry={refreshFlags}
                  isSearchActive={debouncedSearchQuery.length > 0}
                  isInitialLoad={flags.length === 0}
                />

                {!loading && !error && pagination && pagination.totalPages > 1 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={pagination.totalPages}
                    onPageChange={handlePageChange}
                    loading={loading}
                  />
                )}
              </>
            )}

            {activeView !== "flags" && (
              <div style={styles.placeholder}>
                <h2>
                  {activeView.charAt(0).toUpperCase() + activeView.slice(1)} View
                </h2>
                <p>Coming soon...</p>
              </div>
            )}
          </main>
        </div>

        <CreateFlagModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={handleCreateSuccess}
        />
      </div>
    </div>
  );
};
