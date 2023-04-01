import React from "react";

export const useComponentLayout = () => {
  const [layout, setLayout] = React.createSignal({} as { height?: any });

  const onLayout = React.useCallback((event) => {
    const layout = event.nativeEvent.layout;
    setLayout(layout);
  }, []);

  return [layout, onLayout];
};
