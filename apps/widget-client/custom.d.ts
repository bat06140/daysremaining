declare module "*.svg" {
  import * as React from "react";

  const ReactComponent: React.FunctionComponent<
    React.ComponentProps<"svg"> & { title?: string }
  >;

  export default ReactComponent;
}

/// <reference types="vite/client" />

interface Window {
  __WIDGET_RUNTIME__?: {
    widget?: string;
    accessGranted?: boolean;
    reason?: string;
    purchaseUrl?: string;
  };
}
