import React, { createContext, useContext, useState, useCallback } from 'react';

const NotificationContext = createContext();

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) throw new Error('useNotifications must be used within a NotificationProvider');
    return context;
};

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);

    const notify = useCallback((message, type = 'success', duration = 4000) => {
        const id = Date.now();
        setNotifications(prev => [...prev, { id, message, type }]);

        setTimeout(() => {
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, fading: true } : n));
            setTimeout(() => {
                setNotifications(prev => prev.filter(n => n.id !== id));
            }, 300);
        }, duration);
    }, []);

    return (
        <NotificationContext.Provider value={{ notify }}>
            {children}
            <div className="toast-container">
                {notifications.map(n => (
                    <div key={n.id} className={`toast ${n.type} ${n.fading ? 'fade-out' : ''}`}>
                        <span>{n.type === 'success' ? '✅' : n.type === 'error' ? '❌' : 'ℹ️'}</span>
                        <div style={{ flex: 1 }}>{n.message}</div>
                    </div>
                ))}
            </div>
        </NotificationContext.Provider>
    );
};
