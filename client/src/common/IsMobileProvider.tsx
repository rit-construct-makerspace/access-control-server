import { createContext, ReactElement, useContext, useEffect, useState } from "react";

interface IsMobileProviderProps {
    children: ReactElement;
}

const isMobileContext = createContext<boolean | undefined>(undefined);

export function IsMobileProvider(props: IsMobileProviderProps) {
    // init to 1200 because window not defined when using SSR
    const [windowWidth, setWindowWidth] = useState<number>(1200);

    function handleWindowSizeChange() {
        setWindowWidth(window.innerWidth);
    }
    useEffect(() => {
        setWindowWidth(window.innerWidth)
        window.addEventListener('resize', handleWindowSizeChange);
        return () => {
            window.removeEventListener('resize', handleWindowSizeChange);
        }
    }, []);

    const isMobile = windowWidth <= 1100;

    return (
        <isMobileContext.Provider value={isMobile}>
            {props.children}
        </isMobileContext.Provider>
    )
}

export function useIsMobile() {
    const context = useContext(isMobileContext);

    if (context === undefined) {
        throw new Error("useIsMobile must be used within an isMobileContext");
    }

    return context;
}