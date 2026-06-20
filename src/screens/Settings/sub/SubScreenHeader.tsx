import React from 'react';

export function SubScreenHeader({ title, icon: Icon, description }: { title: string, icon: React.ElementType, description?: string }) {
  return (
    <div className="sub-screen-header">
      <div className="header-icon-wrapper">
        <Icon className="header-icon" />
      </div>
      <div className="header-text">
        <h2 className="header-title">{title}</h2>
        {description && <p className="header-description">{description}</p>}
      </div>
    </div>
  );
}
