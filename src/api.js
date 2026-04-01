/**
 * Centralized API service for the Kiosco System.
 * Handles security headers (x-user-role) and global error management.
 */

const getHeaders = (options = {}) => {
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    // Pull user role from localStorage (saved by App.jsx)
    try {
        const savedUser = localStorage.getItem('kiosco_user');
        if (savedUser) {
            const user = JSON.parse(savedUser);
            if (user && user.rol) {
                headers['x-user-role'] = user.rol;
            }
        }
    } catch (e) {
        console.error("Error pulling auth from localStorage", e);
    }

    return headers;
};

const handleResponse = async (res) => {
    if (!res.ok) {
        let errorData;
        try {
            errorData = await res.json();
        } catch (e) {
            errorData = { error: res.statusText };
        }
        
        if (res.status === 403) {
            console.error("Acceso denegado: No tienes permisos para esta acción.");
        }
        
        throw new Error(errorData.error || "Fallo en la comunicación con el servidor");
    }
    
    // Some routes might return 204 No Content
    if (res.status === 204) return null;
    
    return res.json();
};

const api = {
    get: (url, options = {}) => fetch(url, { ...options, method: 'GET', headers: getHeaders(options) }).then(handleResponse),
    post: (url, body, options = {}) => fetch(url, { ...options, method: 'POST', body: JSON.stringify(body), headers: getHeaders(options) }).then(handleResponse),
    put: (url, body, options = {}) => fetch(url, { ...options, method: 'PUT', body: JSON.stringify(body), headers: getHeaders(options) }).then(handleResponse),
    delete: (url, options = {}) => fetch(url, { ...options, method: 'DELETE', headers: getHeaders(options) }).then(handleResponse),
    
    // Method for file uploads (doesn't JSON.stringify body)
    upload: (url, formData, options = {}) => {
        const headers = getHeaders(options);
        delete headers['Content-Type']; // Let browser set it for FormData
        return fetch(url, { ...options, method: 'POST', body: formData, headers }).then(handleResponse);
    }
};

export default api;
