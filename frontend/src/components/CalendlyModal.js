import { useEffect } from 'react';
import { PopupModal } from 'react-calendly';

const CalendlyModal = ({ isOpen, onClose, url }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Validate URL
  if (!url || !url.includes('calendly.com')) {
    console.error('Invalid Calendly URL:', url);
    return null;
  }

  return (
    <PopupModal
      url={url}
      onModalClose={onClose}
      open={isOpen}
      rootElement={document.getElementById('root')}
      pageSettings={{
        backgroundColor: 'ffffff',
        hideEventTypeDetails: false,
        hideLandingPageDetails: false,
        primaryColor: '3b82f6',
        textColor: '1e293b'
      }}
    />
  );
};

export default CalendlyModal;
