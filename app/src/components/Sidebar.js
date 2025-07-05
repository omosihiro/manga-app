import React from 'react';
import { MdImage, MdChatBubble, MdPreview } from 'react-icons/md';
import './Sidebar.css';

function Sidebar({ activeTab, onTabChange }) {
  const tabs = [
    { name: 'ページ', icon: MdImage },
    { name: 'セリフ', icon: MdChatBubble },
    { name: 'プレビュー', icon: MdPreview }
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-tabs">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.name}
              className={`tab-button ${activeTab === tab.name ? 'active' : ''}`}
              onClick={() => onTabChange(tab.name)}
            >
              <Icon size={20} />
              <span>{tab.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default Sidebar;