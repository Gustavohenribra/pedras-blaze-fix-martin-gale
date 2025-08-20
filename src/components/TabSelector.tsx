interface TabSelectorProps {
  activeTab: 'cores' | 'numeros';
  onTabChange: (tab: 'cores' | 'numeros') => void;
}

export function TabSelector({ activeTab, onTabChange }: TabSelectorProps) {
  return (
    <div className="flex gap-1 bg-muted/50 rounded-xl p-1 backdrop-blur-sm border border-border/50 shadow-lg">
      <button
        onClick={() => onTabChange('cores')}
        className={`px-8 py-3 rounded-lg text-sm font-semibold transition-all duration-300 ${
          activeTab === 'cores'
            ? 'bg-background text-foreground shadow-lg shadow-primary/10 border border-border/50'
            : 'text-muted-foreground'
        }`}
        disabled
      >
        Cores
      </button>
      <button
        onClick={() => onTabChange('numeros')}
        className={`px-8 py-3 rounded-lg text-sm font-semibold transition-all duration-300 ${
          activeTab === 'numeros'
            ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25 animate-glow'
            : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
        }`}
      >
        Números
      </button>
    </div>
  );
}