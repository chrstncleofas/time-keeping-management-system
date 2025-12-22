import reactHotToast, { Toaster as HotToaster } from 'react-hot-toast';

// Export the Toaster component with IBAYTECH theme
export const Toaster = () => {
  return (
    <HotToaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: '#fff',
          color: '#1f2937',
          padding: '16px',
          borderRadius: '12px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          maxWidth: '500px',
        },
        success: {
          iconTheme: {
            primary: '#0066ff', // IBAYTECH blue
            secondary: '#fff',
          },
          style: {
            border: '2px solid #0066ff',
          },
        },
        error: {
          iconTheme: {
            primary: '#ff0000', // IBAYTECH red
            secondary: '#fff',
          },
          style: {
            border: '2px solid #ff0000',
          },
        },
      }}
    />
  );
};

// Export customized toast functions
export const toast = {
  success: (message: string) => {
    return reactHotToast.success(message, {
      style: {
        border: '2px solid #0066ff',
        fontSize: '14px',
        fontWeight: '500',
      },
    });
  },
  error: (message: string) => {
    return reactHotToast.error(message, {
      style: {
        border: '2px solid #ff0000',
        fontSize: '14px',
        fontWeight: '500',
      },
    });
  },
  loading: (message: string) => {
    return reactHotToast.loading(message, {
      style: {
        border: '2px solid #0066ff',
        fontSize: '14px',
        fontWeight: '500',
      },
    });
  },
  custom: (message: string) => {
    return reactHotToast(message, {
      style: {
        border: '2px solid #0066ff',
        fontSize: '14px',
        fontWeight: '500',
      },
    });
  },
  dismiss: reactHotToast.dismiss,
  promise: reactHotToast.promise,
};

