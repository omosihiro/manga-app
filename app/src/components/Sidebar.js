import React from 'react';
import './Sidebar.css';

function Sidebar({ activeTab, onTabChange }) {
  const tabs = ['Pages', 'Speech', 'Preview'];

  return (
    <div className="sidebar">
      <div className="sidebar-tabs">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={`tab-button ${activeTab === tab ? 'active' : ''}`}
            onClick={() => onTabChange(tab)}
          >
            {tab}
          </button>
        ))}
      </div>
    </div>
  );
}

export default Sidebar;