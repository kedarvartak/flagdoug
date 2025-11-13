import { getDropdownStyles } from "./Dropdown.styles";
import { useTheme } from "../../context/ThemeContext";

interface DropdownOption {
  value: string;
  label: string;
}

interface DropdownProps {
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  label?: string;
}

export const Dropdown = ({
  value,
  options,
  onChange,
  label,
}: DropdownProps) => {
  const { theme } = useTheme();
  const styles = getDropdownStyles(theme);
  
  return (
    <div style={styles.container}>
      {label && <label style={styles.label}>{label}</label>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={styles.select}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};
