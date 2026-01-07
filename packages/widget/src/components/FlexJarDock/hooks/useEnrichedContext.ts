import { useMemo } from "react";
import type { FlexjarContext, DeviceType } from "../../../core/types.js";

/**
 * Derives device type from viewport width.
 */
function getDeviceType(width: number): DeviceType {
    if (width < 768) return "mobile";
    if (width < 1024) return "tablet";
    return "desktop";
}

/**
 * Hook that enriches user-provided context with auto-collected browser data.
 * Note: This hook is client-only - the widget is never server-rendered.
 * 
 * @param userContext - Optional user-provided context (app, tags, debug)
 * @returns Enriched context with system fields (url, pathname, viewport, deviceType, userAgent)
 */
export function useEnrichedContext(userContext?: FlexjarContext): FlexjarContext {
    return useMemo((): FlexjarContext => {
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        return {
            // System-collected
            url: window.location.href,
            pathname: window.location.pathname,
            viewport: { width: viewportWidth, height: viewportHeight },
            deviceType: getDeviceType(viewportWidth),
            userAgent: navigator.userAgent,
            // User-provided
            app: userContext?.app,
            tags: userContext?.tags,
            debug: userContext?.debug,
        };
    }, [userContext?.app, userContext?.tags, userContext?.debug]);
}
