import Slider from '@react-native-community/slider';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from './Themed';

interface CheckSliderProps {
  label: string;
  description?: string;
  value: number;
  onValueChange: (value: number) => void;
  color: string;
  minimumValue?: number;
  maximumValue?: number;
  step?: number;
}

const SLIDER_WIDTH = 270;
const TOOLTIP_TIMEOUT = 1400;

const CheckSlider: React.FC<CheckSliderProps> = ({
  label,
  description,
  value,
  onValueChange,
  color,
  minimumValue = 0,
  maximumValue = 10,
  step = 1,
}) => {
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipValue, setTooltipValue] = useState(value);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleSlidingComplete = (val: number) => {
    setTooltipValue(val);
    setTooltipVisible(true);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setTooltipVisible(false);
    }, TOOLTIP_TIMEOUT);
  };

  const normalizedValue =
    maximumValue === minimumValue
      ? 0
      : (tooltipValue - minimumValue) / (maximumValue - minimumValue);
  const clampedValue = Math.min(Math.max(normalizedValue, 0), 1);
  const tooltipLeft = clampedValue * SLIDER_WIDTH;

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.sliderTrackArea, { width: SLIDER_WIDTH }]}>
        {tooltipVisible && (
          <View
            pointerEvents="none"
            style={[styles.tooltip, { left: tooltipLeft, borderColor: color }]}
          >
            <Text style={[styles.tooltipText, { color }]}>{tooltipValue}</Text>
          </View>
        )}
        <Slider
          style={styles.slider}
          minimumValue={minimumValue}
          maximumValue={maximumValue}
          minimumTrackTintColor={color}
          maximumTrackTintColor="#949494ff"
          step={step}
          tapToSeek
          thumbTintColor={color}
          onValueChange={onValueChange}
          onSlidingComplete={handleSlidingComplete}
          value={value}
        />
      </View>
      {description ? <Text style={styles.description}>{description}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    gap: 6,
  },
  label: {
    fontSize: 16,
    color: '#1d1564',
  },
  sliderTrackArea: {
    position: 'relative',
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  tooltip: {
    position: 'absolute',
    top: 4,
    width: 36,
    height: 36,
    borderRadius: 6,
    borderWidth: 2,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateX: -18 }],
  },
  tooltipText: {
    fontSize: 16,
    fontWeight: '700',
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    color: '#1d1564',
    opacity: 0.75,
  },
});

export default CheckSlider;
