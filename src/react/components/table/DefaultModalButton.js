import React, { useCallback, useState } from 'react';

const DefaultModalButton = ({ children, renderButton }) => {
  const [isOpen, setIsOpen] = useState(false);

  const close = useCallback(() => setIsOpen(false), []);
  const open = useCallback(() => setIsOpen(true), []);
  const toggle = useCallback(() => setIsOpen(prev => !prev), []);

  return (
    <>
      {renderButton?.({ close, isOpen, open, toggle })}
      {children?.({ close, isOpen, open, toggle })}
    </>
  );
};

export default DefaultModalButton;
