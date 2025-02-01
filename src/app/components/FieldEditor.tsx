import React, { useState } from 'react';
import { Modal, Form, Input, Switch, Drawer, Space, Button, Tabs } from 'antd';
import { useDispatch } from 'react-redux';
import { updateSchemaFromTreeData } from '@/lib/feature/schema/schemaSlice';
import { updateUiSchemaFromTreeData } from '@/lib/feature/schema/uiSchemaSlice';
import { updateTreeData } from '@/lib/feature/schema/treeSlice';
import { debounce } from 'lodash';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs/components/prism-core';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/themes/prism.css';

interface FieldEditorProps {
  open: boolean;
  onClose: () => void;
  field: {
    key: string;
    title: string;
    type: string;
    required: boolean;
    placeholder?: string;
    description?: string;
    help?: string;
    componentType: string;
    validation?: {
      maxLength?: number;
      minLength?: number;
      pattern?: string;
      required?: boolean;
      customValidator?: string;
      maximum?: number;
      minimum?: number;
    };
  };
  treeData: any[];
}

const FieldEditor: React.FC<FieldEditorProps> = ({
  open,
  onClose,
  field,
  treeData,
}) => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const [error, setError] = useState('');

  const initialCode = `function customValidateFunction (formData, errors, uiSchema) {
      // formData has access to all the fields in the form which you can access using formData.<key>
      // errors has access to all the errors in the form which you can access using errors.<key>
      // custom validator function should always return the errors object
      /**
      if (formData.pass1 !== formData.pass2) {
        errors.pass2.addError("Passwords don't match");
      }
      return errors;
      */
    }`;
  const [code, setCode] = React.useState(initialCode);

  const updateSchemas = (values: any) => {
    // Convert string function to actual function
    // const customValidateFunction = new Function('return ' + code)();
    const updatedValues = {
      ...values,
      customValidator: code === initialCode ? undefined : code,
      minLength: Number(values.minLength),
      maxLength: Number(values.maxLength),
      minimum: Number(values.minimum),
      maximum: Number(values.maximum),
    };
    const updatedTreeData = updateTreeDataField(treeData, field.key, updatedValues);
    dispatch(updateTreeData([...updatedTreeData]));
    dispatch(updateSchemaFromTreeData({ treeData: [...updatedTreeData] }));
    dispatch(updateUiSchemaFromTreeData({ treeData: [...updatedTreeData] }));
  };


  const validateKeyUniqueness = debounce((key: string, data: any[]) => {
    for (const item of data) {
      if (item.key === key) {
        setError(true);
        break;
      }
      if (item.children) {
        validateKeyUniqueness(key, item.children)
      }
    }
  }, 300)

  const updateTreeDataField = (data: any[], key: string, values: any): any[] => {
    return data.map((node) => {
      if (node.key === key) {
        return {
          ...node,
          key: values.key,
          title: values.title,
          required: values.required,
          description: values.description,
          help: values.help,
          placeholder: values.placeholder,
          validation: {
            maxLength: Number(values.maxLength),
            minLength: Number(values.minLength),
            pattern: values.pattern,
            required: values.required,
            customValidator: values.customValidator,
            maximum: Number(values.maximum),
            minimum: Number(values.minimum),
          },
        };
      }
      if (node.children) {
        return {
          ...node,
          children: updateTreeDataField(node.children, key, values),
        };
      }
      return node;
    });
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      updateSchemas(values);
      onClose();
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  React.useEffect(() => {
    if (open) {
      form.setFieldsValue({
        key: field.key,
        title: field.title,
        placeholder: field.placeholder,
        description: field.description,
        help: field.help,
        maxLength: Number(field.validation?.maxLength),
        minLength: Number(field.validation?.minLength),
        pattern: field.validation?.pattern,
        required: field.validation?.required,
        customValidator: field.validation?.customValidator,
        maximum: Number(field.validation?.maximum),
        minimum: Number(field.validation?.minimum),
      });
      if (field.validation?.customValidator) {
        setCode(field.validation?.customValidator);
      }
    }
  }, [open, field, form]);

  return (
    <Drawer
      size='large'
      title="Edit Field"
      placement={'right'}
      closable={true}
      onClose={onClose}
      open={open}
      key={'right'}
      extra={
        <Space>
          <Button onClick={onClose}>Cancel</Button>
          <Button disabled={!!error} type="primary" onClick={handleOk}>
            Save
          </Button>
        </Space>
      }
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          required: false,
        }}
      >
        <Tabs defaultActiveKey="1">
          <Tabs.TabPane tab="Field Configuration" key="1">
            <Form.Item
              label="Key"
              name="key"
              onChange={(e) => {
                setError(false);
                validateKeyUniqueness(e.target.value, treeData)
              }}
              validateStatus={error ? 'error' : ''}
              help={error ? "Key need to be unique" : ''}
              rules={[{ required: true, message: 'Please enter a key' }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              label="Field Title"
              name="title"
              rules={[{ required: true, message: 'Please enter a title' }]}
            >
              <Input />
            </Form.Item>

            <Form.Item label="Placeholder" name="placeholder">
              <Input />
            </Form.Item>

            <Form.Item label="Description" name="description">
              <Input.TextArea rows={2} />
            </Form.Item>

            <Form.Item label="Help Text" name="help">
              <Input.TextArea rows={2} />
            </Form.Item>
          </Tabs.TabPane>

          <Tabs.TabPane tab="Validation Settings" key="2">
            <Form.Item
              label="Required Field"
              name="required"
              valuePropName="checked"
              help="Make this field mandatory for form submission"
            >
              <Switch />
            </Form.Item>

            <Form.Item
              label="Min Length"
              name="minLength"
              help="Minimum number of characters allowed"
            >
              <Input type="number" min={0} />
            </Form.Item>

            <Form.Item
              label="Max Length"
              name="maxLength"
              help="Maximum number of characters allowed"
            >
              <Input type="number" min={0} />
            </Form.Item>

            {field.componentType === 'number-input' && (
              <>
                <Form.Item
                  label="Minimum Value"
                  name="minimum"
                  help="Minimum numeric value allowed"
                >
                  <Input type="number" />
                </Form.Item>

                <Form.Item
                  label="Maximum Value"
                  name="maximum"
                  help="Maximum numeric value allowed"
                >
                  <Input type="number" />
                </Form.Item>
              </>
            )}

            <Form.Item
              label="Pattern"
              name="pattern"
              help="Enter a regular expression pattern (e.g., ^[A-Za-z]+$)"
            >
              <Input />
            </Form.Item>

            <Form.Item
              label="Custom Validation"
              help={`Enter custom validation inside the function`}
            >
              <Editor
                value={code}
                onValueChange={(code) => setCode(code)}
                highlight={code => highlight(code, languages.js)}
                padding={10}
                style={{
                  fontFamily: '"Fira code", "Fira Mono", monospace',
                  fontSize: 12,
                }}
              />
            </Form.Item>
          </Tabs.TabPane>
        </Tabs>
      </Form>
    </Drawer>
  );
};

export default FieldEditor;
