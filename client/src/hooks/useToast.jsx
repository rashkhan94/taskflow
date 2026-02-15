import { useState } from 'react';

export function useToast() {
    const [toast, setToast] = useState(null);

    const showToast = (message, type = 'info') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const ToastComponent = toast ? (
        <div className={"toast " + (toast.type || 'info')}>{toast.message}</div>
    ) : null;

    return { showToast, ToastComponent };
}
