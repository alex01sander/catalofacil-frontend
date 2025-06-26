import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

type Theme = 'verde' | 'roxo' | 'azul' | 'rosa' | 'laranja' | 'violeta' | 'branco';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    const storedTheme = localStorage.getItem('adminTheme') as Theme;
    return storedTheme || 'violeta';
  });

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('adminTheme', newTheme);
  };

  useEffect(() => {
    document.documentElement.className = ''; // Limpa classes existentes
    document.documentElement.classList.add(`theme-${theme}`);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}; 