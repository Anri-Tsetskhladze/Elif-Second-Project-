import { useCallback, useRef, memo, useMemo } from "react";
import {
  FlatList,
  FlatListProps,
  View,
  RefreshControl,
  ActivityIndicator,
  ViewToken,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";

// Type for item with required _id
interface ListItem {
  _id: string;
  [key: string]: any;
}

interface OptimizedListProps<T extends ListItem> extends Omit<FlatListProps<T>, "data"> {
  data: T[];
  isLoading?: boolean;
  isRefreshing?: boolean;
  isFetchingMore?: boolean;
  hasMore?: boolean;
  onRefresh?: () => void;
  onLoadMore?: () => void;
  emptyComponent?: React.ReactElement;
  loadingComponent?: React.ReactElement;
  footerLoadingComponent?: React.ReactElement;
  headerComponent?: React.ReactElement;
  itemHeight?: number;
  onVisibleItemsChanged?: (visibleItems: T[]) => void;
  onScrollPositionChange?: (position: number) => void;
  maintainVisibleContentPosition?: boolean;
}

function OptimizedListInner<T extends ListItem>({
  data,
  renderItem,
  isLoading = false,
  isRefreshing = false,
  isFetchingMore = false,
  hasMore = false,
  onRefresh,
  onLoadMore,
  emptyComponent,
  loadingComponent,
  footerLoadingComponent,
  headerComponent,
  itemHeight,
  onVisibleItemsChanged,
  onScrollPositionChange,
  maintainVisibleContentPosition = false,
  ...props
}: OptimizedListProps<T>) {
  const listRef = useRef<FlatList<T>>(null);
  const scrollPosition = useRef(0);

  // Optimized key extractor
  const keyExtractor = useCallback((item: T) => item._id, []);

  // getItemLayout for fixed height items (major performance boost)
  const getItemLayout = useMemo(() => {
    if (!itemHeight) return undefined;
    return (_: ArrayLike<T> | null | undefined, index: number) => ({
      length: itemHeight,
      offset: itemHeight * index,
      index,
    });
  }, [itemHeight]);

  // Handle end reached for infinite scroll
  const handleEndReached = useCallback(() => {
    if (!isFetchingMore && hasMore && onLoadMore) {
      onLoadMore();
    }
  }, [isFetchingMore, hasMore, onLoadMore]);

  // Handle viewable items changed
  const handleViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (onVisibleItemsChanged) {
        const visibleItems = viewableItems
          .filter((v) => v.isViewable && v.item)
          .map((v) => v.item as T);
        onVisibleItemsChanged(visibleItems);
      }
    },
    [onVisibleItemsChanged]
  );

  // Handle scroll
  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollPosition.current = event.nativeEvent.contentOffset.y;
      if (onScrollPositionChange) {
        onScrollPositionChange(scrollPosition.current);
      }
    },
    [onScrollPositionChange]
  );

  // Viewability config
  const viewabilityConfig = useMemo(
    () => ({
      itemVisiblePercentThreshold: 50,
      minimumViewTime: 100,
    }),
    []
  );

  // Refresh control
  const refreshControl = useMemo(() => {
    if (!onRefresh) return undefined;
    return (
      <RefreshControl
        refreshing={isRefreshing}
        onRefresh={onRefresh}
        tintColor="#6366F1"
        colors={["#6366F1"]}
      />
    );
  }, [isRefreshing, onRefresh]);

  // Footer component
  const ListFooterComponent = useMemo(() => {
    if (isFetchingMore) {
      return (
        footerLoadingComponent || (
          <View className="py-4 items-center">
            <ActivityIndicator size="small" color="#6366F1" />
          </View>
        )
      );
    }
    return <View className="h-24" />;
  }, [isFetchingMore, footerLoadingComponent]);

  // Empty component
  const ListEmptyComponent = useMemo(() => {
    if (isLoading) {
      return loadingComponent || (
        <View className="flex-1 items-center justify-center py-20">
          <ActivityIndicator size="large" color="#6366F1" />
        </View>
      );
    }
    return emptyComponent || null;
  }, [isLoading, loadingComponent, emptyComponent]);

  return (
    <FlatList
      ref={listRef}
      data={data}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      getItemLayout={getItemLayout}
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.5}
      refreshControl={refreshControl}
      ListHeaderComponent={headerComponent}
      ListFooterComponent={ListFooterComponent}
      ListEmptyComponent={ListEmptyComponent}
      onViewableItemsChanged={onVisibleItemsChanged ? handleViewableItemsChanged : undefined}
      viewabilityConfig={onVisibleItemsChanged ? viewabilityConfig : undefined}
      onScroll={onScrollPositionChange ? handleScroll : undefined}
      scrollEventThrottle={onScrollPositionChange ? 16 : undefined}
      // Performance optimizations
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      windowSize={10}
      initialNumToRender={10}
      updateCellsBatchingPeriod={50}
      // Maintain scroll position
      maintainVisibleContentPosition={
        maintainVisibleContentPosition
          ? { minIndexForVisible: 0, autoscrollToTopThreshold: 10 }
          : undefined
      }
      showsVerticalScrollIndicator={false}
      {...props}
    />
  );
}

// Memoized wrapper
const OptimizedList = memo(OptimizedListInner) as typeof OptimizedListInner;

export default OptimizedList;

// Helper hook for list item memoization
export const useListItemMemo = <T extends object>(
  item: T,
  deps: any[] = []
) => {
  return useMemo(() => item, [item._id, ...deps]);
};

// Separator component
export const ItemSeparator = memo(({ height = 8 }: { height?: number }) => (
  <View style={{ height }} />
));

ItemSeparator.displayName = "ItemSeparator";
