import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UiSchemaField {
  'ui:widget'?: string;
  'ui:options'?: {
    placeholder?: string;
    inputType?: string;
    rows?: number;
    description?: string;
    disabled?: boolean;
    help?: string;
    filePreview?: boolean;
    size?: 'large' | 'middle' | 'small';
    allowClear?: boolean;
    style?: Record<string, string | number>;
  };
  'ui:description'?: string;
  'ui:help'?: string;
  'ui:disabled'?: boolean;
  'ui:autofocus'?: boolean;
  'ui:className'?: string;
  'ui:style'?: Record<string, string | number>;
}

interface UiSchemaState {
  formUiSchema: Record<string, UiSchemaField>;
}

const initialState: UiSchemaState = {
  formUiSchema: {},
};

const getFieldUiSchema = (node: any): UiSchemaField => {
  const baseOptions = {
    size: 'large' as const,
    allowClear: true,
    style: {
      width: '100%',
    },
  };

  const placeholder = (text?: string) => node?.placeholder || text || 'Enter text...';
  const help = node?.help || '';
  const description = node?.description || '';

  switch (node?.componentType) {
    case 'input':
      return {
        'ui:options': {
          ...baseOptions,
          placeholder: placeholder(),
          help,
          description,
        },
        'ui:className': 'w-full',
      };
    case 'number-input':
      return {
        'ui:options': {
          ...baseOptions,
          placeholder: placeholder('Enter number...'),
          help,
          description,
          inputType: 'number',
        },
        'ui:className': 'w-full',
      };
    case 'select':
      return {
        'ui:widget': 'select',
        'ui:options': {
          ...baseOptions,
          placeholder: placeholder('Select option...'),
          help,
          description,
        },
        'ui:className': 'w-full',
      };
    case 'checkbox':
      return {
        'ui:widget': 'checkboxes',
        'ui:options': {
          ...baseOptions,
          inline: true,
        },
        'ui:className': 'w-full flex gap-4',
      };
    case 'date-picker':
      return {
        'ui:widget': 'date',
        'ui:options': {
          ...baseOptions,
          placeholder: placeholder('Select date...'),
        },
        'ui:className': 'w-full',
      };
    case 'switch':
      return {
        // No specific widget for switch, using default
        'ui:options': {
          ...baseOptions,
        },
        'ui:className': 'w-full',
      };
    case 'slider':
      return {
        'ui:widget': 'range',
        'ui:options': {
          ...baseOptions,
          style: {
            ...baseOptions.style,
            padding: '15px 0',
          },
        },
        'ui:className': 'w-full',
      };
    case 'upload':
      return {
        'ui:widget': 'file',
        'ui:options': {
          ...baseOptions,
          filePreview: true,
          accept: 'image/*,.pdf',
        },
        'ui:className': 'w-full',
      };
    case 'textarea':
      return {
        'ui:widget': 'textarea',
        'ui:options': {
          ...baseOptions,
          rows: 4,
          placeholder: placeholder('Enter text...'),
          style: {
            ...baseOptions.style,
            minHeight: '100px',
            resize: 'vertical',
          },
        },
        'ui:className': 'w-full',
      };
    case 'nestedForm':
      return {
        'ui:options': {
          ...baseOptions,
          label: false,
        },
        'ui:className': 'w-full border rounded-lg p-4 bg-gray-50',
      };
    default:
      return {};
  }
};

export const uiSchemaSlice = createSlice({
  name: 'uiSchema',
  initialState,
  reducers: {
    updateUiSchemaFromTreeData: (state, action: PayloadAction<{ treeData: any[] }>) => {
      const newUiSchema: Record<string, UiSchemaField> = {};
      const processNode = (node: any) => {
        if (node.componentType) {
          const fieldUiSchema = getFieldUiSchema(node);
          newUiSchema[node.key] = fieldUiSchema;
        }

        if (node.children) {
          node.children.forEach(processNode);
        }
      };

      action.payload.treeData.forEach(processNode);
      state.formUiSchema = newUiSchema;
    },
    updateUiSchema: (state, action: PayloadAction<{ key: string; uiSchema: Record<string, UiSchemaField>; }>) => {
      state.formUiSchema = action.payload.uiSchema;
      return state;
    },
  },
});

export const { updateUiSchemaFromTreeData, updateUiSchema } = uiSchemaSlice.actions;
export default uiSchemaSlice.reducer;
