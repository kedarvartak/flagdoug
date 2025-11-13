import { useTheme } from '../../context/ThemeContext';

interface LogoProps {
  size?: number;
}

export const Logo = ({ size = 32 }: LogoProps) => {
  const { theme } = useTheme();
  
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background circle */}
      <circle cx="20" cy="20" r="20" fill={theme.colors.accentPrimary} />
      
      {/* Flag pole */}
      <rect x="12" y="10" width="2" height="20" fill="white" rx="1" />
      
      {/* Flag */}
      <path
        d="M14 10 L14 11 L26 11 C26 11 28 13 28 15 C28 17 26 19 26 19 L14 19 L14 10 Z"
        fill="white"
        opacity="0.9"
      />
      
      {/* Flag accent */}
      <path
        d="M14 11 L14 15 L24 15 C24 15 25.5 13.5 25.5 13 C25.5 12.5 24 11 24 11 L14 11 Z"
        fill="white"
        opacity="0.6"
      />
    </svg>
  );
};
