import { createSlice, PayloadAction } from '@reduxjs/toolkit'

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

interface Schema {
  type: string;
  title: string;
  properties: Record<string, FormField>;
  required: string[];
}

const schemaToTreeData = (schema: Schema, uiSchema: any = {}) => {
  const treeData = [];
  const counter = 0;

  const getComponentType = (field: FormField, fieldName: string) => {
    const uiWidget = uiSchema[fieldName]?.['ui:widget'];

    if (uiWidget) {
      switch (uiWidget) {
        case 'select': return 'select';
        case 'date': return 'datePicker';
        case 'switch': return 'switch';
        default: return uiWidget;
      }
    }

    switch (field.type) {
      case 'string':
        return field.format === 'date' ? 'datePicker' : 'input';
      case 'number':
        return 'inputNumber';
      case 'boolean':
        return 'switch';
      case 'array':
        return field.items?.type === 'object' ? 'nestedForm' : 'select';
      case 'object':
        return 'nestedForm';
      default:
        return 'input';
    }
  };

  const processField = (fieldName: string, field: FormField) => {
    const node: any = {
      title: field.title || fieldName,
      key: fieldName,
      componentType: getComponentType(field, fieldName),
      required: schema.required?.includes(fieldName),
      description: uiSchema[fieldName]?.['ui:options']?.description,
      placeholder: uiSchema[fieldName]?.['ui:options']?.placeholder,
      help: uiSchema[fieldName]?.['ui:options']?.help,
    };

    if (field.properties) {
      node.children = Object.entries(field.properties).map(([childName, childField]) =>
        processField(childName, childField)
      );
    }

    return node;
  };

  if (schema.properties) {
    Object.entries(schema.properties).forEach(([fieldName, field]) => {
      const d = processField(fieldName, field)
      treeData.push(d as unknown as never);
    });
  }

  return treeData.length > 0 ? treeData : initialData;
};

const initialData = [
  {
    title: 'Root',
    key: '0',
  },
];

export const treeSlice = createSlice({
  name: 'tree',
  initialState: initialData,
  reducers: {
    updateTreeData: (state, action: PayloadAction<any[]>) => {
      state = action.payload;
      return state;
    },
    updateTreeFromSchemas: (state, action: PayloadAction<{ schema: Schema; uiSchema: any }>) => {
      debugger
      const newTreeData = schemaToTreeData(action.payload.schema, action.payload.uiSchema);

      const resultantStat = {
        title: 'Root',
        key: '0',
        children: [
          ...newTreeData
        ]
      }

      state = [resultantStat];
      return state;
    }
  },
  selectors: {
    treeData: (state) => state
  }
});

export const { updateTreeData, updateTreeFromSchemas } = treeSlice.actions;
export const treeSelector = treeSlice.selectors;
