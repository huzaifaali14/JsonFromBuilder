import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface FormField {
  type: string;
  title?: string;
  required?: boolean;
  enum?: string[];
  properties?: Record<string, FormField>;
  items?: FormField;
  format?: string;
  minimum?: number;
  maximum?: number;
  description?: string;
}

interface SchemaState {
  formSchema: {
    type: string;
    title: string;
    properties: Record<string, FormField>;
    required: string[];
  };
}

const initialState: SchemaState = {
  formSchema: {
    type: 'object',
    title: 'Dynamic Form',
    properties: {},
    required: [],
  },
};

interface Validation {
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  minimum?: number;
  maximum?: number;
  required?: boolean;
}

const getFieldSchema = (componentType: string, title: string, description?: string, validation?: Validation): FormField => {
  const baseField = {
    title,
    description,
  };

  const { minimum, maximum, ...rest } = validation || {};

  switch (componentType) {
    case 'input':
      return { ...baseField, type: 'string', minimum, maximum, ...rest, };
    case 'number-input':
      return { ...baseField, type: 'number', ...rest };
    case 'select':
      return { ...baseField, type: 'string', enum: ['option1', 'option2', 'option3'], ...rest };
    case 'checkbox':
      return {
        ...baseField,
        type: 'array',
        items: {
          type: 'string',
          enum: ['option1', 'option2', 'option3'],
        },
        ...rest,
      };
    case 'date-picker':
      return { ...baseField, type: 'string', format: 'date', ...rest };
    case 'switch':
      return { ...baseField, type: 'boolean', ...rest };
    case 'slider':
      return { ...baseField, type: 'number', minimum: 0, maximum: 100, ...rest };
    case 'upload':
      return { ...baseField, type: 'string', format: 'binary', ...rest };
    case 'textarea':
      return { ...baseField, type: 'string', ...rest };
    case 'nestedForm':
      return { ...baseField, type: 'object', properties: {}, ...rest };
    default:
      return { ...baseField, type: 'string', ...rest };
  }
};

export const schemaSlice = createSlice({
  name: 'schema',
  initialState,
  reducers: {
    updateSchemaFromTreeData: (state, action: PayloadAction<{ treeData: any[] }>) => {
      const newSchema: SchemaState['formSchema'] = {
        type: 'object',
        title: 'Dynamic Form',
        properties: {},
        required: [],
      };

      // Use an ordered map to maintain property order
      const orderedProperties = new Map<string, FormField>();

      const processNode = (node: any) => {
        const { required, ...restValidation } = node.validation || {};
        if (node.componentType) {
          const fieldSchema = getFieldSchema(
            node.componentType,
            node.title,
            node.description,
            restValidation
          );
          orderedProperties.set(node.key, fieldSchema);

          if (required) {
            newSchema.required = (state.formSchema.required || [])
            newSchema.required.push(node.key);
          }
        }

        if (node.children) {
          node.children.forEach(processNode);
        }
      };

      action.payload.treeData.forEach(processNode);

      // Convert ordered map back to object while preserving order
      newSchema.properties = Object.fromEntries(orderedProperties);
      state.formSchema = newSchema;
      return state;
    },
    updateSchema: (state, action: PayloadAction<{ formSchema: SchemaState['formSchema'] }>) => {
      state.formSchema = action.payload.formSchema;
      return state;
    },
  },
});

export const { updateSchemaFromTreeData, updateSchema } = schemaSlice.actions;
export default schemaSlice.reducer;