import React from 'react';

const DEFAULT_ROW_ACTIONS_WIDTH = 96;

const isReactComponentType = value =>
  value &&
  typeof value === 'object' &&
  typeof value.$$typeof === 'symbol';

export const hasDefaultTableRowActionsComponent = component =>
  typeof component === 'function' ||
  React.isValidElement(component) ||
  isReactComponentType(component);

export const resolveDefaultTableRowActionsWidth = configs => {
  const rawWidth = configs?.rowActionsWidth ?? configs?.actionsColumnWidth;
  const width = Number(rawWidth);

  if (Number.isFinite(width) && width > 0) {
    return width;
  }

  return DEFAULT_ROW_ACTIONS_WIDTH;
};

const DefaultTableRowActions = ({ component, ...props }) => {
  if (React.isValidElement(component)) {
    return React.cloneElement(component, {
      ...(component.props || {}),
      ...props,
    });
  }

  if (hasDefaultTableRowActionsComponent(component)) {
    const RowActionsComponent = component;

    return <RowActionsComponent {...props} />;
  }

  return null;
};

export default DefaultTableRowActions;
