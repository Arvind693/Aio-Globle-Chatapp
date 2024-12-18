import React, { createContext, useContext, useState, useCallback } from "react";

const GlobalPopupContext = createContext();

export const useGlobalPopup = () => useContext(GlobalPopupContext);

const GlobalPopupProvider = ({ children }) => {
    const [popupContent, setPopupContent] = useState(null);
    const [isPopupVisible, setIsPopupVisible] = useState(false);

    const showPopup = useCallback((content) => {
        setPopupContent(content);
        setIsPopupVisible(true);
    }, []);

    const hidePopup = useCallback(() => {
        setIsPopupVisible(false);
        // Delay setting popupContent to null to avoid resetting immediately after closing
        setTimeout(() => {
            setPopupContent(null);
        }, 300); // Time should match transition or animation duration
    }, []);

    return (
        <GlobalPopupContext.Provider value={{ showPopup, hidePopup, isPopupVisible, popupContent }}>
            {children}
            {isPopupVisible && (
                <div className="fixed inset-0 h-0 bottom-0 bg-black bg-opacity-50 z-50 border-2">
                    <div className="fixed bottom-3 *: left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg p-2 w-11/12 max-w-lg">
                        {popupContent}
                    </div>
                </div> 
            )}
        </GlobalPopupContext.Provider>
    );
};

export default GlobalPopupProvider;
