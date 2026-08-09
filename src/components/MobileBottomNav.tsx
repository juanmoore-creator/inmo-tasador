import React from 'react';
import { Plus, Clock, Shield, X, Settings } from 'lucide-react';

interface TabData {
  id: string;
  clientName?: string;
  target?: { address?: string };
}

interface MobileBottomNavProps {
  activeTabId: string;
  isAdmin: boolean;
  isTenantOwner: boolean;
  openTabs: TabData[];
  onSwitchTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
}

const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTabId,
  isAdmin,
  isTenantOwner,
  openTabs,
  onSwitchTab,
  onCloseTab,
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 pb-[env(safe-area-inset-bottom)]">
      {/* Open Tabs Strip */}
      {openTabs.length > 0 && (
        <div className="flex flex-nowrap overflow-x-auto gap-2 px-3 py-2 border-b border-slate-200 dark:border-slate-800 scrollbar-hide">
          {openTabs.map((tab) => {
            const isActive = tab.id === activeTabId;
            const displayName = tab.clientName || tab.target?.address || 'Tasación';
            
            return (
              <div
                key={tab.id}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-medium'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
                onClick={() => onSwitchTab(tab.id)}
              >
                <span className="max-w-[100px] truncate">{displayName}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseTab(tab.id);
                  }}
                  className="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"
                >
                  <X size={12} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Main Tabs */}
      <div className="flex flex-row justify-around items-center px-2 py-2">
        <button
          onClick={() => onSwitchTab('new')}
          className={`flex flex-col items-center gap-1 w-20 transition-colors ${
            activeTabId === 'new'
              ? 'text-indigo-600 dark:text-indigo-400'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          <div className="relative">
            <Plus size={24} />
            {activeTabId === 'new' && (
              <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
            )}
          </div>
          <span className="text-[10px] font-medium mt-0.5">Nueva</span>
        </button>

        <button
          onClick={() => onSwitchTab('history')}
          className={`flex flex-col items-center gap-1 w-20 transition-colors ${
            activeTabId === 'history'
              ? 'text-indigo-600 dark:text-indigo-400'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          <div className="relative">
            <Clock size={24} />
            {activeTabId === 'history' && (
              <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
            )}
          </div>
          <span className="text-[10px] font-medium mt-0.5">Historial</span>
        </button>

        {isAdmin && (
          <button
            onClick={() => onSwitchTab('admin')}
            className={`flex flex-col items-center gap-1 w-20 transition-colors ${
              activeTabId === 'admin'
                ? 'text-indigo-600 dark:text-indigo-400'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            <div className="relative">
              <Shield size={24} />
              {activeTabId === 'admin' && (
                <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
              )}
            </div>
            <span className="text-[10px] font-medium mt-0.5">Admin</span>
          </button>
        )}

        {isTenantOwner && (
          <button
            onClick={() => onSwitchTab('settings')}
            className={`flex flex-col items-center gap-1 w-20 transition-colors ${
              activeTabId === 'settings'
                ? 'text-indigo-600 dark:text-indigo-400'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            <div className="relative">
              <Settings size={24} />
              {activeTabId === 'settings' && (
                <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
              )}
            </div>
            <span className="text-[10px] font-medium mt-0.5">Config</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default MobileBottomNav;
