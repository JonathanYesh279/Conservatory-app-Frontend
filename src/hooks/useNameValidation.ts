// src/hooks/useNameValidation.ts
import { useState, useEffect, useRef } from 'react';

export interface ValidationResult {
  isValid: boolean;
  message: string | null;
}

interface UseNameValidationProps {
  name: string;
  existingNames: string[];
  type: string;
  originalName?: string;
  isSubmitting?: boolean; // Added to skip validation during submission
}

/**
 * Custom hook for validating orchestra/ensemble names
 *
 * This hook handles:
 * - Empty name validation
 * - Minimum length validation
 * - Duplicate name detection (case-insensitive)
 * - Similar name detection (ignoring spaces)
 * - Excluding the original name when editing
 * - Disabling validation during form submission
 */
export const useNameValidation = ({
  name,
  existingNames,
  type,
  originalName,
  isSubmitting = false,
}: UseNameValidationProps): ValidationResult => {
  const [validationResult, setValidationResult] = useState<ValidationResult>({
    isValid: true,
    message: null,
  });

  // Use a ref to track previous validation inputs to avoid unnecessary updates
  const prevInputsRef = useRef<string>('');

  useEffect(() => {
    // Skip validation during form submission to prevent flicker
    if (isSubmitting) {
      // Temporarily consider the name valid during submission
      if (!validationResult.isValid) {
        setValidationResult({ isValid: true, message: null });
      }
      return;
    }

    // Create a string representation of all inputs to compare
    const inputsKey = `${name}|${JSON.stringify(existingNames)}|${type}|${
      originalName || ''
    }`;

    // Skip if inputs haven't changed
    if (prevInputsRef.current === inputsKey) {
      return;
    }

    // Update ref with current inputs
    prevInputsRef.current = inputsKey;

    // Skip validation if name is empty - this is handled by required field validation
    if (!name || name.trim() === '') {
      // Only update state if needed
      if (!validationResult.isValid || validationResult.message !== null) {
        setValidationResult({ isValid: true, message: null });
      }
      return;
    }

    // Skip validation if name hasn't changed from original
    if (originalName && originalName === name) {
      // Only update state if needed
      if (!validationResult.isValid || validationResult.message !== null) {
        setValidationResult({ isValid: true, message: null });
      }
      return;
    }

    // Prepare names for comparison
    const normalizedNewName = name.trim().toLowerCase();

    // Get list of names to check against (excluding the original name)
    const namesToCompare = originalName
      ? existingNames.filter(
          (existingName) =>
            existingName.toLowerCase() !== originalName.toLowerCase()
        )
      : existingNames;

    // Calculate new validation result
    let newResult: ValidationResult = { isValid: true, message: null };

    // Check for exact match (case-insensitive)
    const exactMatch = namesToCompare.find(
      (existingName) => existingName.toLowerCase() === normalizedNewName
    );

    if (exactMatch) {
      newResult = {
        isValid: false,
        message: `שם זהה כבר קיים: "${exactMatch}"`,
      };
    } else {
      // Check for similarity (ignoring spaces)
      const noSpacesNewName = normalizedNewName.replace(/\s+/g, '');
      const similarName = namesToCompare.find((existingName) => {
        const noSpacesExisting = existingName.toLowerCase().replace(/\s+/g, '');
        return noSpacesExisting === noSpacesNewName;
      });

      if (similarName) {
        newResult = {
          isValid: false,
          message: `שם דומה כבר קיים (הבדלי רווחים): "${similarName}"`,
        };
      } else if (normalizedNewName.length < 2) {
        // Check minimum length
        newResult = {
          isValid: false,
          message: 'שם חייב להכיל לפחות 2 תווים',
        };
      }
    }

    // Only update state if result is different
    if (
      newResult.isValid !== validationResult.isValid ||
      newResult.message !== validationResult.message
    ) {
      setValidationResult(newResult);
    }
  }, [name, existingNames, type, originalName, isSubmitting, validationResult]);

  return validationResult;
};
