import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';

export interface MenuOption {
  label: string;
  value: string;
  icon?: string;
  description?: string;
  disabled?: boolean;
}

interface MenuProps {
  title: string;
  options: MenuOption[];
  onSelect: (value: string) => void;
}

export function Menu({ title, options, onSelect }: MenuProps) {
  // Find first non-disabled option
  const firstEnabledIndex = options.findIndex(opt => !opt.disabled);
  const [selectedIndex, setSelectedIndex] = useState(
    firstEnabledIndex >= 0 ? firstEnabledIndex : 0
  );

  useInput((_, key) => {
    if (key.upArrow) {
      setSelectedIndex(prev => {
        let newIndex = prev;
        do {
          newIndex = newIndex > 0 ? newIndex - 1 : options.length - 1;
        } while (options[newIndex].disabled && newIndex !== prev);
        return newIndex;
      });
    } else if (key.downArrow) {
      setSelectedIndex(prev => {
        let newIndex = prev;
        do {
          newIndex = newIndex < options.length - 1 ? newIndex + 1 : 0;
        } while (options[newIndex].disabled && newIndex !== prev);
        return newIndex;
      });
    } else if (key.return) {
      const selectedOption = options[selectedIndex];
      if (!selectedOption.disabled) {
        onSelect(selectedOption.value);
      }
    }
  });

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold color="cyan">
          {title}
        </Text>
      </Box>

      <Box flexDirection="column">
        {options.map((option, index) => {
          const isSelected = index === selectedIndex;
          return (
            <Box key={option.value} paddingLeft={1}>
              <Text
                color={
                  option.disabled ? 'gray' : isSelected ? 'magenta' : 'white'
                }
                bold={isSelected && !option.disabled}
                dimColor={option.disabled}
              >
                {isSelected ? '❯' : ' '} {option.icon} {option.label}
              </Text>
              {isSelected && option.description && (
                <Text color={option.disabled ? 'darkGray' : 'gray'} dimColor>
                  {' '}
                  ({option.disabled ? 'Settings required' : option.description})
                </Text>
              )}
            </Box>
          );
        })}
      </Box>

      <Box marginTop={1}>
        <Text dimColor color="gray">
          ↑↓ Navigate • ↵ Select • ^C Exit
        </Text>
      </Box>
    </Box>
  );
}
