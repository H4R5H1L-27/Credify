import React from 'react';
import { Modal, ModalProps } from './Modal';

export interface DialogProps extends ModalProps {}

export const Dialog: React.FC<DialogProps> = (props) => {
  return <Modal {...props} />;
};

export { Modal } from './Modal';
